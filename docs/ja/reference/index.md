---
title: リファレンス目次
description: タスクコマンド一覧、設定フィールド索引、CLI および環境変数、ソースコードバージョン索引のエントリポイント。
updated: 2026-10-20
---

# リファレンス目次

このセクションはチュートリアルではなく、各種仕様や設定を「検索・照会する」ためのリファレンスです。機能の動作背景や詳細な解説が必要な場合は、各マニュアルページを参照してください。

| ドキュメント | 内容 | 適用対象 |
| --- | --- | --- |
| [タスクコマンド一覧](/ja/reference/tasks) | 102 個のタスクコマンド、引数グループ、マニュアル対照表 | タスク名や内部コマンドを特定したい場合 |
| [設定リファレンス](/ja/reference/config) | 階層パスのセマンティクス、スケジューラー設定項目、167 個のオプショングループ一覧 | 設定ファイルの直接編集やスキーマ確認 |
| [CLI・ポート・環境変数](/ja/reference/cli) | 起動引数、使用ポート一覧、影響を与える環境変数、終了コード | サービス運用、スクリプト作成、ポート競合調査 |
| [ソースコードバージョン索引](/ja/reference/versions) | 監査基準コミットハッシュ、未検証事項リスト、素材の権利情報 | ドキュメントの準拠バージョンや事実確認 |

## <DocIcon name="zap" /> よく使われるコマンドのクイックリファレンス

### コアプログラム

```bash
# 依存関係の同期（開発用依存を除く）
uv sync --frozen --no-dev

# WebUI の起動（デフォルト：0.0.0.0:25548）
uv run python gui.py

# 特定のポートとパスワードを指定してローカル限定起動
uv run python gui.py --host 127.0.0.1 -p 25548 -k "your-password"

# 単一インスタンスを CLI から直接起動
uv run python alas.py [インスタンス名]

# インポートスモークテストの実行
uv run python -m dev_tools.import_smoke_test

# 単体テストの実行
uv run python -m unittest discover -s tests

# TUI（ターミナルコンソール）の起動
uv run python tui.py

# 独立 MCP サーバーの起動
uv run python mcp_server_sse.py
```

### ドキュメントツール

```bash
npm run dev        # ドキュメントサイトのローカルプレビュー
npm run build      # 静的ビルド成果物の生成
npm run check      # リンク・ナビゲーション・SEO 検査
npm run test:e2e   # Playwright による自動検証
```
