---
title: システムアーキテクチャ
description: AzurPilot のレイヤー構造、プロセスモデル、モジュール境界、データフロー、改修時に遵守すべき設計規約。
updated: 2026-10-20
---

# システムアーキテクチャ

<CoreArchDiagram />

<Figure caption="上位レイヤーは下位レイヤーに依存します。業務モジュール同士が直接結合することはなく、タスク間の連携は設定およびスケジューラーの基本機構を経由して行われます。" />

## <DocIcon name="box" /> プロセスモデル

```text
gui.py（親プロセス）
├── HTTP / WebSocket サービス（uvicorn）
├── 静的フロントエンド（frontend/dist）
├── インスタンス worker × N（multiprocessing.Process）
│    └── AzurLaneAutoScript.loop()
└── TaskHandler（WebUI 自身のバックグラウンド定期タスク：更新確認、リモート保活等）
```

| プロセス | 生存期間 | 責務と役割 |
| --- | --- | --- |
| `gui.py` | 常駐 | WebUI および API の提供、worker プロセスの生成・監視・回収 |
| worker | インスタンス稼働中 | スケジューリングループおよびゲーム自動化操作の全般 |
| `mcp_server_sse.py` | 任意（独立プロセス） | 外部連携用 MCP ツール（WebUI パスワード認証を流用） |

よくある誤解の解消：

- **worker はデーモンプロセスではありません**。`ProcessManager` によって管理され、親プロセスの終了時に確実に道連れ回収されます。
- **`TaskHandler` はゲームスケジューラーではありません**。WebUI バックエンド自身の定期メンテナンスタスク（更新チェック等）を担当し、エミュレーター等のデバイスには触れません。
- **1つのインスタンスにつき worker プロセスは1つのみです**。同一エミュレーターに対して複数の worker が同時に操作を行った場合の挙動は未定義（競合発生）となります。

## <DocIcon name="settings" /> 分層与边界 {#分层与边界}

### エントリレイヤー

| ファイル | エントリ関数 | 役割 |
| --- | --- | --- |
| `alas.py` | `AzurLaneAutoScript.loop()`、`run(command)` | 唯一のスケジューラー統括 |
| `gui.py` | `main()` | 引数パース、フロントエンドビルド確認、uvicorn 起動、worker 監視 |
| `mcp_server_sse.py` | `main()` | SSE トランスポートによる MCP サービス |
| `tui.py` | `main()` | ターミナルコンソール（同一設定を共有） |

### ランタイムレイヤー

| ディレクトリ | 役割 |
| --- | --- |
| `module/api/router.py` | 明示的なメソッド登録テーブル、引数のバリデーションとディスパッチ |
| `module/api/socket.py` | WebSocket セッション管理、認証、イベント購読 |
| `module/runtime/process_manager.py` | worker プロセスのライフサイクル、終了シグナル伝達 |
| `module/runtime/updater.py` | アップデートの確認、フェッチ、適用 |
| `module/runtime/remote_*.py` | Cloudflare Tunnel およびペアリング制御 |
| `module/runtime/account_*.py` | アカウントヴォールトの暗号化管理 |

### 業務ロジックレイヤー

コンテンツごとに独立したパッケージとして構成され、エントリクラスが `run()` を実装します。各業務クラスは `ModuleBase` を継承することで以下を利用できます：

- `self.device`：スクリーンショット取得、タップ、アプリ起動停止
- `self.config`：現在タスクにバインドされた設定プロパティ
- `self.appear()` / `appear_then_click()`：画像認識および操作プリミティブ
- `self.ui_ensure()` / `ui_goto()`：画面遷移グラフに基づくページナビゲーション

### 基盤レイヤー

| モジュール | 主要な抽象化 | 境界定義 |
| --- | --- | --- |
| `module/base` | `ModuleBase`、`Button`、`Template`、`Timer`、`Filter` | 個別ゲームコンテンツのロジックは含まない |
| `module/device` | `Device`、`Connection`、`Screenshot`、`Control` | 障害復旧の判断（再起動等）は下さない |
| `module/ui` | `UI`、`Page`、画面遷移グラフ | ゲーム業務の成否判定は行わない |
| `module/ocr` | 機械学習モデル、推論ラッパー、ベンチマーク | 呼び出し元の業務関心を持たない |
| `module/map` | `Map`、グリッド認識、経路探索 | 戦闘戦術ロジックは含まない |
| `module/combat` | 戦闘ステートループ、リザルト、陣形 | 海域の選択ロジックは含まない |

## <DocIcon name="zap" /> 1回のタスク実行におけるデータフロー

```text
WebUI での設定変更
  → config/<インスタンス名>.json
    → スケジューラーがタスク境界で既存の config キャッシュを破棄
      → get_next() により実行対象タスクを抽出
        → bind(task) により self.config.<Group>_<Argument> へプロパティ展開
          → run(command) を呼び出し
            → 業務モジュールによるスクリーンショット / 画像認識 / タップ操作
              → task_delay() により次回実行時刻 NextRun を書き戻し
                → True / 'recoverable' / False を返却
```

**スケジューラーの状態は設定ファイル内の `Scheduler.NextRun` に完全に永続化されます**。メモリ上の失敗カウンタは一時的なリカバリ判断にのみ使用されるため、プロセスが再起動してもタスクキューの状態は失われません。

## <DocIcon name="pencil" /> タスク登録メカニズム

スケジューラーは文字列ベースでタスクを識別します：

1. `task.yaml` でタスク名、メニュー所属、引数グループを定義。
2. `alas.py` 内に同名のメソッドを定義（キャメルケースからスネークケースへ変換）。
3. メソッド内部で実装クラスを遅延インポートし、`run()` を呼び出し。

```python
# alas.py
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

新タスク追加時にレジストリ等への明示的な登録コードは不要で、`run()` は `getattr(self, command)()` により動的ディスパッチされます。これは、**メソッド名のタイポは起動時には検知されず、実行時に初めて `AttributeError` となる**ことを意味します。

## <DocIcon name="drive" /> データの永続化

| データ種別 | 格納場所 | 特徴 |
| --- | --- | --- |
| インスタンス設定 | `config/<インスタンス名>.json` | ユーザー編集・エクスポート可能 |
| デプロイ設定 | `config/deploy.yaml` | バックエンド全体設定 |
| 業務データベース | SQLite 統合 DB | 統計、ドロップ履歴、ビジュアルスケジューラー等 |
| ドロップ記録 | `log/drop/` 等 | カテゴリ別の画像およびログ |
| エラー現場記録 | `log/error/<インスタンス名>/<タイムスタンプ>/` | スクリーンショット ＋ ログ抜粋 |

データベースは `module/persistence` が統括管理します。初回マイグレーション時は自動バックアップが行われ、不整合発生時は起動を安全に中断します。**モジュールのインポート時に勝手にデータベースが作成されることはありません**。

## <DocIcon name="handshake" /> 横断的アーキテクチャ規約

### 例外設計

すべての業務例外は `module/exception.py` で一元定義されています。スケジューラーは例外の型に基づいて復旧手順を決定するため、業務モジュール側で例外を握り潰してはなりません：

| 例外クラス | 意味 |
| --- | --- |
| `GameStuckError` | 画面が長時間遷移せずフリーズした |
| `GameTooManyClickError` | 同一ボタンへの連続タップ暴走を検知 |
| `GameNotRunningError` | ゲームプロセスが停止している |
| `EmulatorNotRunningError` | デバイス（エミュレーター）がオフライン |
| `RequestHumanTakeover` | 自動復旧不能。人間の介入が必要 |
| `ScriptError` | コード上の不具合・バグ |
| `TaskEnd` | タスクの自律的な正常完了通知 |

### ロギング規約

- `logger.hr()` で処理フェーズを区切り、`logger.attr()` で変数値を出力します。
- ログは `log/<日付>_<インスタンス名>.txt` に保存されます。
- パスワード、認証トークン、個人情報をログに出力しないでください。

### 画像アセット

- 4サーバー向けのアセットは `assets/{cn,en,jp,tw}/` に配置され、すべて 1280×720 を基準とします。
- テンプレートオブジェクトは `TEMPLATE_` プレフィックスを付与して命名します。
- ボタンリソースを変更した後は `uv run -m dev_tools.button_extract` を実行してください。

## <DocIcon name="map" /> 開発者向け関連ドキュメント

<ul class="ap-linklist">
<li><a href="/ja/azurpilot/developer/scheduler">スケジューラーのライフサイクル<span class="desc">loop / run / 復旧マトリクス</span></a></li>
<li><a href="/ja/azurpilot/developer/config">設定システム<span class="desc">YAML から実行時への展開</span></a></li>
<li><a href="/ja/azurpilot/developer/webui-backend">WebUI バックエンド<span class="desc">API とプロセス管理</span></a></li>
<li><a href="/ja/azurpilot/developer/module-dev">新規タスクの追加<span class="desc">完全な実装サンプル</span></a></li>
</ul>
