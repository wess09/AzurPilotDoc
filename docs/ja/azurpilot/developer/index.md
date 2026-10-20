---
title: 開発者ポータル
description: AzurPilot 開発環境の構築、リポジトリ構成の理解、最初の改修コードの特定、PR 提出前のチェックリスト。
updated: 2026-10-20
---

# 開発者ポータル

このドキュメントは、Python の基本知識を持ちつつも、本リポジトリの内部構造には不慣れな開発者を対象としています。30分以内にローカルで動作させ、コードの場所を特定し、検証可能な最初の改修を行えるようにすることを目的としています。

## <DocIcon name="laptop" /> 開発環境要件

| ツール | 必要バージョン | 説明 |
| --- | --- | --- |
| Python | **3.14** | `pyproject.toml` の `requires-python` 仕様に準拠 |
| uv | 最新版 | 依存関係および仮想環境の管理に使用 |
| Node.js | `frontend/package.json` 参照 | フロントエンド開発時のみ必要 |
| ADB | 任意のバージョン | 実機またはエミュレーターでの実機検証時のみ必要 |

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
uv sync --frozen            # 開発用依存を含む同期
npm ci --prefix frontend    # フロントエンド依存のロック取得
```

### よく使われる開発コマンド

| 用途 | コマンド |
| --- | --- |
| WebUI サーバーの起動 | `uv run python gui.py` |
| 単一インスタンススケジューラーの起動 | `uv run python alas.py <インスタンス名>` |
| ターミナルコンソール（TUI） | `uv run python tui.py` |
| 独立 MCP SSE サーバーの起動 | `uv run python mcp_server_sse.py` |
| Python 単体テストの実行 | `uv run python -m unittest discover -s tests` |
| 特定テストモジュールの実行 | `uv run python -m unittest tests.test_api` |
| pytest によるテスト | `uv run pytest tests/shop_event` |
| 基本的なコード静的検査 | `uv run ruff check . --select E9,F63,F7,F82 --ignore F821,F722` |
| フロントエンド型検査 | `npm run typecheck --prefix frontend` |
| フロントエンド単体テスト | `npm test --prefix frontend` |
| E2E テスト | `npm run test:e2e --prefix frontend` |
| インポートスモークテスト | `uv run python -m dev_tools.import_smoke_test` |

## <DocIcon name="map" /> リポジトリ全体マップ

```text
AzurPilot/
├── alas.py                  # スケジューラー：タスクループ、エラー復旧、タスクディスパッチ
├── gui.py                   # WebUI バックエンド（uvicorn ＋ プロセス監視）
├── mcp_server_sse.py        # 独立 MCP SSE サービス
├── tui.py                   # ターミナル操作画面
├── module/
│   ├── api/                 # WebSocket ルーティングと RPC メソッド
│   ├── runtime/             # プロセス管理、アップデート、リモートアクセス、認証
│   ├── config/              # 設定スキーマ定義と自動生成スクリプト
│   ├── device/              # スクリーンショット、タップ、エミュレーター制御
│   ├── ui/                  # 画面遷移グラフと UI コントロール
│   ├── ocr/                 # OCR モデルと推論ラッパー
│   ├── map/ map_detection/  # マップグリッド認識と経路探索
│   ├── combat/              # 戦闘ループ処理とリザルト
│   ├── campaign/            # 出撃海域エントリ
│   ├── os*/                 # セイレーン作戦（大世界）
│   ├── <玩法>/              # 各コンテンツ（research, commission, island 等）
│   └── persistence/         # SQLite 統合データベース
├── campaign/                # 海域マップ定義および戦闘定義（Python）
├── frontend/                # React + TypeScript + Vite フロントエンド
├── assets/                  # 4サーバー別の画像認識リソース（自動生成アセット中心）
├── deploy/                  # インストール、起動、デプロイ補助
├── dev_tools/               # コード生成ツールおよびデバッグ支援
├── docs/modules/            # 内部モジュールドキュメント（20章構成）
└── tests/                   # Python 単体テストコード群
```

## <DocIcon name="compass" /> 目的別のコード探索ガイド

| 実装したいこと | 最初に参照すべきドキュメント / ディレクトリ |
| --- | --- |
| 新しい自動化タスクを追加したい | [新規タスクの追加](/ja/azurpilot/developer/module-dev) |
| スケジューラーの実行順序・復旧仕様を変更したい | [スケジューラーのライフサイクル](/ja/azurpilot/developer/scheduler) |
| 新しい設定項目を追加したい | [設定システム](/ja/azurpilot/developer/config) |
| WebUI の画面やコンポーネントを修正したい | [React フロントエンド](/ja/azurpilot/developer/frontend) |
| 新しい API メソッドを追加したい | [WebUI バックエンド](/ja/azurpilot/developer/webui-backend) |
| 画像認識の精度や判定処理を調整したい | [デバイス・認識・戦闘](/ja/azurpilot/developer/device-vision) |
| イベント海域のマップ定義を修正したい | `campaign/` 配下の該当ファイル ＋ `campaign/Readme.md` |

## <DocIcon name="shield" /> 厳格に遵守すべき3つのルール

### 1. ゲーム操作はステートループで記述し、sleep に頼らない

```python
def some_function(self, skip_first_screenshot=True):
    while True:
        if skip_first_screenshot:
            skip_first_screenshot = False
        else:
            self.device.screenshot()

        if self.appear(END_CONDITION):
            break
        if self.appear_then_click(BUTTON_A, interval=2):
            continue
        if self.handle_popup():
            continue
```

- ループの終了判定には `appear()` を使用し、`interval` は指定しません。
- タップ操作には `appear_then_click()` を使用し、連続タップ暴走を防ぐため `interval` は通常 2〜5 秒を設定します。
- ループ内部で無暗に `sleep()` を呼び出さないでください。否定条件による制御や、ステートループの多重ネストも禁止です。
- `handle_*()` メソッドは `bool` を返し、`True` は「何らかの画面操作を実行したため次フレームの再キャプチャが必要である」ことを示します。

### 2. 自動生成ファイルを手作業で直接編集しない

| 自動生成成果物 | 再生成コマンド |
| --- | --- |
| `module/config/argument/args.json`、`menu.json`、`config_generated.py`、`config/template.json` | `uv run -m module.config.config_updater` |
| `assets/*/assets.py`（ボタンリソース） | `uv run -m dev_tools.button_extract` |
| `frontend/src/api/generated.ts`、`contract.json` | `uv run python -m dev_tools.export_api_schema` |

CI パイプラインはこれらのコマンドを再実行し、差分（diff）が存在する場合はビルドを失敗させます。

### 3. タスクメソッドは遅延インポートを維持する

```python
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

起動時はスケジューラーと設定スキーマのみを読み込み、タスクモジュールは初回実行時に初めてインポートされます。これにより起動時の初速を高め、特定モジュールのインポートエラーがシステム全体に波及するのを防ぎます。

## <DocIcon name="file" /> 内部モジュールドキュメントの活用

`docs/modules/` 配下には、スケジューラー、設定、デバイス、認識、戦闘、大世界、WebUI などの各モジュールを解説した20章構成の詳細ドキュメントが配置されています。改修を行う際は該当ドキュメントを事前に参照し、仕様変更時は同期して更新してください。

## <DocIcon name="handshake" /> Pull Request（PR）の提出規約

1. `master` ブランチから分岐し、単一の明確なトピックに絞って改修してください。
2. 変更に関連するテストを実行してください。3つ以上のモジュールにまたがる大規模な仕様改変時のみ全量テストが必要です。
3. 自動生成成果物は、元となる定義ファイルとセットでコミットしてください。
4. `.github/PULL_REQUEST_TEMPLATE.md` に従って変更内容と検証結果を記述してください。
5. 実施していないテスト項目にチェックを入れないでください。

## <DocIcon name="wrench" /> 開発デバッグのTips

| 利用シーン | 推奨手法 |
| --- | --- |
| 特定モジュールのみを単独実行 | モジュールファイル末尾の `if __name__ == '__main__':` ブロックを使用 |
| エミュレーター未接続でのインポート検証 | `uv run python -m dev_tools.import_smoke_test` |
| API 規約スキーマの確認 | `frontend/src/api/contract.json` を参照 |
| 設定項目のフィールド構造確認 | WebUI の開発者ツール、または `args.json` を参照 |
| デバッグサービスの起動 | `ALAS_DEBUG_SERVER=1`（ローカルループバック限定） |
