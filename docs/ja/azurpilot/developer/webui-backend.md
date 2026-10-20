---
title: WebUI バックエンド
description: gui.py のプロセス監視、WebSocket RPC プロトコル、メソッド登録、認証とレート制限、新規 API メソッドの追加手順。
updated: 2026-10-20
---

# WebUI バックエンド

バックエンドは2つの主要コンポーネントで構成されています：`gui.py` がプロセス管理と全体のライフサイクルを担当し、`module/api/` がプロトコル処理と業務ロジックメソッドを担当します。ゲームの操作ロジックは直接持たず、すべての操作は設定ファイルの更新またはスケジューラーワーカーへの制御コマンドとして伝達されます。

## <DocIcon name="zap" /> gui.py の役割

起動時の実行順序：

1. コマンドライン引数の解析（`--host`、`--port`、`--key`、`--ssl-key`、`--ssl-cert`、`--run`、`--electron`）。
2. `ensure_frontend()`：`frontend/dist` の存在を検査し、欠落している場合は自動で依存を導入してビルドを実行。
3. `State`（デプロイ設定、各種パス、データベース）の初期化。
4. uvicorn サーバーの起動（必要に応じて MCP および OCR サービスも並行起動）。
5. 監視ループへ突入し、各インスタンスの worker プロセスおよびアップデートトランザクションを統括。

### プロセス監視ループ

- 各ワーカーは `ProcessManager` により生成され、停止シグナルは `State.manager.Event()` によりプロセス間をまたいで注入されます。
- システム更新時はまずワーカーを停止させて `stop_event` をセットし、`loop()` をエラー終了ではなく「更新終了」として正常に收尾させます。
- 起動時に `worker_registry` をスキャンし、前回の異常終了で残存した孤児プロセスを一括回収します。
- 終了コードには明確なセマンティクス（「更新終了」「設定異常終了」等）が割り当てられており、親プロセスはこれに基づいて自動再起動の要否を判断します。

::: tip kill -9 を日常的な停止手段にしないでください
ワーカーを `SIGKILL` で強制終了すると終了処理がスキップされ、ファイルロックや孤児プロセスが残存します。WebUI の停止ボタンは設計された正規のシグナルパイプラインを経由します。
:::

## <DocIcon name="clipboard" /> メソッド登録テーブル

`module/api/router.py` はリフレクションに頼らず、明示的なディスパッチテーブルを用いてメソッドを登録します：

```python
self.methods = {
    'system.ping': Method(p.Params, lambda _: {'pong': True}),
    'instances.list': Method(p.Params, lambda _: runtime.instances()),
    'config.patch': Method(p.PatchParams, lambda x: configs.patch(...), True),
}
```

`Method(params, handler, mutates)` のパラメータ構成：

| 属性 | 役割と責務 |
| --- | --- |
| `params` | Pydantic モデル。厳格な型バリデーションを実行（未定義フィールドは禁止） |
| `handler` | 実際の処理ロジックを担当する関数 |
| `mutates` | 状態を変更するかどうか。フロントエンドはこれに基づいて自動再読込を判定 |

現行バージョンでは **72 個のメソッド** が登録されており、インスタンス管理、設定、スケジューラー、ログ、統計、メンタル計算機、艦隊技術、取引所、リモートペアリング、アカウント、更新、お知らせ、壁紙ライブラリを網羅しています。

## <DocIcon name="plug" /> WebSocket プロトコル仕様

エンドポイント：`/api/v1/ws`。

### メッセージエンベロープ形式

```json
{ "v": 1, "type": "request", "id": "req-1", "method": "instances.list", "params": {} }
{ "v": 1, "type": "response", "id": "req-1", "ok": true, "result": [] }
{ "v": 1, "type": "response", "id": "req-1", "ok": false,
  "error": { "code": "INVALID_PARAMS", "message": "リクエスト形式またはパラメータが不正です", "details": [] } }
{ "v": 1, "type": "event", "topic": "overview", "data": {} }
```

### セッションの確立

クライアントが接続すると、サーバーから最初に `session` イベントがプッシュされます：

```json
{ "v": 1, "type": "event", "topic": "session",
  "data": { "authRequired": true, "protocolVersion": 1 } }
```

ローカルループバック接続かつパスワード未設定の場合、`authRequired` は `false` となり、追加認証なしで直ちに利用可能です。

### 認証（ログイン）

```json
{ "v": 1, "type": "request", "id": "auth", "method": "auth.login",
  "params": { "password": "<WebUI パスワードまたはペアリング認証情報>" } }
```

- パスワードは起動引数 `--key`、`config/deploy.yaml` の `Password`、または自動生成された `password.txt` を参照します。
- リモートペアリング端末は個別のペアリング認証情報を送信し、ホスト側で認可が取り消されると次回のハートビートで即座に失効します。
- 機密操作（`accounts.manage` など）は非ローカル接続時において WSS 通信が必須であり、プレーンテキスト接続では `TLS_REQUIRED` エラーとなります。

### イベントトピックの購読

```json
{ "v": 1, "type": "request", "id": "sub", "method": "events.subscribe",
  "params": { "instance": "ap", "topics": ["overview", "logs", "statistics"] } }
```

| トピック名 | 配信内容 | サンプリング周期 |
| --- | --- | --- |
| `instances` | インスタンス一覧と実行ステータス | 2 秒 |
| `overview` | 現在実行中のタスク、保有資材 | 1 秒 |
| `logs` | 増分ログ | 変更時即時プッシュ |
| `preview` | スクリーンショットプレビュー | 変更時即時プッシュ |
| `statistics` | 統計データ | 1 秒 |
| `notifications` | システム通知ストリーム | イベント発生時 |
| `stock` | 取引所データ | イベント発生時 |

購読処理は**全体置換セマンティクス**です：新しいトピックで購読を要求すると、以前の購読リストはすべて上書きクリアされます。

### 通信制限ルール

| 制限項目 | しきい値 |
| --- | --- |
| 単一メッセージ上限サイズ | 8 MiB |
| 通常リクエスト上限サイズ | 1 MiB（メンタルインポート/認識/保存/計算は例外） |
| レート制限 | ウィンドウあたり 30 リクエスト（超過時は `RATE_LIMITED`） |
| リクエスト ID 重複 | `DUPLICATE_REQUEST` エラー |
| 未認証接続のタイムアウト | 30 秒 |

## <DocIcon name="circle-alert" /> エラーコード定義

| エラーコード | 発生事由 |
| --- | --- |
| `INVALID_REQUEST` | エンベロープ構造またはサイズが不正 |
| `INVALID_PARAMS` | パラメータのバリデーションに失敗 |
| `UNAUTHORIZED` | 未ログイン、またはペアリング失効 |
| `TLS_REQUIRED` | 機密操作において WSS 通信が未使用 |
| `RATE_LIMITED` | リクエストレートの上限超過 |
| `DUPLICATE_REQUEST` | リクエスト ID の重複 |
| `INTERNAL_ERROR` | サーバー内部例外（セキュリティ上詳細は返却されない） |

パラメータ検証エラー時のレスポンスには、フィールドのパスと期待される型定義のみが含まれ、入力値自体はエコーバックされません（パスワードや個人情報の漏洩を防止）。

## <DocIcon name="cloud" /> 提供される HTTP エンドポイント

WebSocket のほか、補助的な HTTP ルーティングも提供されます：

| パス | 用途 |
| --- | --- |
| `/healthz` | ヘルスチェック（Android 版の起動待機プローブ用） |
| `/android/*` | Android ホスト専用の軽量制御インターフェース（要 `X-AzurPilot-Android-Token`） |
| `/api/v1/pairings/*` | リモートペアリング登録サービス |
| 静的アセット | `frontend/dist` をローカルから直接配信 |

## <DocIcon name="drive" /> ランタイムとデータ永続化

| モジュール | 担当領域 |
| --- | --- |
| `module/runtime/process_manager.py` | ワーカープロセスの生成・停止・ゾンビ回収 |
| `module/runtime/updater.py` | アップデートの確認およびコミット適用 |
| `module/runtime/remote_access.py` | Quick Tunnel のライフサイクル制御 |
| `module/runtime/account_vault.py` | アカウントヴォールトの暗号化管理 |
| `module/persistence/` | SQLite 統合データベース、マイグレーション、データ整合性保証 |

業務データベースは `module/persistence` が一元管理し、API 層が直接生 SQL を組み立てることはありません。

## <DocIcon name="circle-plus" /> 新規 API メソッドの追加手順

<Steps>
<Step title="パラメータモデルの定義">

`module/api/protocol.py` に Pydantic モデルを追加します（`Params` を継承し、`extra='forbid'`、`strict=True` を指定）。

</Step>
<Step title="サービスロジックの実装">

業務処理は `module/api/<domain>_service.py` に実装し、ルーター内に長大な処理をベタ書きしないでください。

</Step>
<Step title="メソッドの登録">

`router.py` の `self.methods` に登録し、状態変更の有無（`mutates`）を指定します。

</Step>
<Step title="API 規約スキーマのエクスポート">

```bash
uv run python -m dev_tools.export_api_schema
```

`frontend/src/api/generated.ts` および `contract.json` が同期更新されます。

</Step>
<Step title="フロントエンドからの呼び出し">

`frontend/src` 側で `api.request('your.method', params)` を呼び出します。型定義は自動生成されたコードから補完されます。

</Step>
<Step title="単体テストの記述">

```bash
uv run python -m unittest tests.test_api
```

正常系、パラメータ検証失敗、未認証時の拒否、リクエスト ID 重複の各ケースを網羅してください。

</Step>
</Steps>

::: warning 内部関数の露出禁止
router に登録されたメソッドのみが公式の公開規約です。業務モジュールの内部関数は API ではないため、フロントエンドから直接呼び出すような設計は避けてください。
:::

## <DocIcon name="map" /> 関連ドキュメント

<ul class="ap-linklist">
<li><a href="/ja/api/websocket">WebSocket API リファレンス<span class="desc">全メソッドとパラメータ定義</span></a></li>
<li><a href="/ja/azurpilot/developer/frontend">React フロントエンド<span class="desc">API 規約の消費方法</span></a></li>
<li><a href="/ja/api/android">Android 薄型インターフェース<span class="desc">プロセス間通信仕様</span></a></li>
</ul>
