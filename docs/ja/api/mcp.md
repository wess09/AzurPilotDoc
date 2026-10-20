---
title: MCP サービス
description: 18 個の MCP ツールの用途、マウント方式、認証、クライアント接続設定、および WebSocket API との境界。
updated: 2026-10-20
---

# MCP サービス

MCP（Model Context Protocol）は、同プロトコルをサポートするクライアント（エディタ、AI Agent ツール）から AzurPilot を直接操作・問い合わせするためのインターフェースです。これは**外部連携用の別系統のエントリポイント**であり、WebSocket API を代替するものではありません。

## <DocIcon name="rocket" /> 2つの稼働形態

| 形態 | エンドポイント | 説明 |
| --- | --- | --- |
| WebUI 同梱マウント | `http://<host>:25548/mcp/sse` | デフォルト構成。WebUI プロセスと同一ポートを共有 |
| 独立サービス | `python mcp_server_sse.py`（ポート `22268`） | デバッグ時やプロセス分離環境向け |

::: warning 22268 ポートの OCR との競合
MCP 独立サーバーと OCR サービスはデフォルトでどちらも 22268 ポートを使用します。同一マシン上で両者を動作させる場合は、事前にいずれかのポート番号を変更してください。
:::

## <DocIcon name="key" /> 認証方式

MCP は WebUI の認証パスワード（`--key` または `deploy.yaml` の `Password`）を流用します：

| 方式 | 記法 |
| --- | --- |
| リクエストヘッダー（推奨） | `Authorization: Bearer <パスワード>` |
| 互換ヘッダー | `X-API-Key: <パスワード>` |
| クエリパラメータ | `?key=<パスワード>`（カスタムヘッダー非対応のクライアント限定） |

認証情報が欠落している場合は `401` が返却されます。パスワード変更を反映するには WebUI の再起動が必要です。

::: danger クエリパラメータは認証情報そのものです
`?key=` はサーバーアクセスログやブラウザ履歴、スクリーンショット等に記録される危険があります。環境が許す限りヘッダー方式を利用してください。
:::

## <DocIcon name="settings" /> クライアント設定例

ローカル環境：

```json
{
  "mcpServers": {
    "azurpilot": {
      "url": "http://127.0.0.1:25548/mcp/sse",
      "headers": { "Authorization": "Bearer <WebUI パスワード>" }
    }
  }
}
```

リモートまたは LAN 経由：

```json
{
  "mcpServers": {
    "azurpilot": {
      "url": "http://<IP_ADDRESS>:25548/mcp/sse",
      "headers": { "Authorization": "Bearer <WebUI パスワード>" }
    }
  }
}
```

ポート番号を変更している場合は適宜 URL を置き換えてください。

## <DocIcon name="clipboard" /> 提供ツール一覧

合計 18 種類のツールが提供されています。

| カテゴリ | ツール名 | 機能概要 |
| --- | --- | --- |
| インスタンス | `list_instances` | 全インスタンスの一覧を取得 |
| インスタンス | `get_status` | インスタンスの実行状態を取得 |
| インスタンス | `start_instance` | インスタンスを起動 |
| インスタンス | `stop_instance` | インスタンスを停止 |
| タスク | `list_tasks` | 全タスクの一覧を取得 |
| タスク | `get_task_help` | タスクのヘルプ情報を取得 |
| タスク | `trigger_task` | タスクを即座にトリガー実行 |
| タスク | `get_scheduler_queue` | スケジューラーのキュー一覧を取得 |
| タスク | `clear_scheduler_queue` | スケジューラーのキューをクリア |
| 監視 | `get_current_running_task` | 現在実行中のタスク情報を取得 |
| 監視 | `get_resources` | 保有リソース（燃料・資金等）の状態を取得 |
| 監視 | `get_config` | インスタンスの設定を取得 |
| 監視 | `get_recent_logs` | 直近のログを取得 |
| 監視 | `get_screenshot` | 現在の画面スクリーンショットを取得 |
| 設定 | `update_config` | インスタンスの設定を更新 |
| メンテナンス | `restart_emulator` | エミュレーターを再起動 |
| メンテナンス | `restart_adb` | ADB サーバーを再起動 |
| メンテナンス | `update_alas` | AzurPilot 本体のコードを更新 |

::: tip パラメータの仕様はサーバー側の宣言に準拠します
MCP クライアントは `tools/list` を介して各ツールの完全な JSON Schema を取得します。ここでは目的と機能概要のみを記載し、頻繁に更新される詳細パラメータ定義は省略しています。
:::

## <DocIcon name="lightbulb" /> 代表的な利用シナリオ

### AI Agent による定期パトロール

```text
1. list_instances           → 登録インスタンスの確認
2. get_status(instance)     → 稼働状態・現在タスクの確認
3. get_recent_logs(...)     → エラーログの有無の検知
4. get_resources(...)       → 燃料や資金が枯渇していないか判定
```

### 手動トラブルシューティング介入

```text
trigger_task(instance, task)   → 特定タスクの即時テスト
clear_scheduler_queue(...)     → キューに溜まったタスクの一括リセット
restart_adb(...)               → ADB 接続切断時の自動復帰
```

### 注意を要する操作

`update_alas`、`restart_emulator`、`clear_scheduler_queue` は実行中のタスクを強制中断します。Agent に自律実行させる前に、その影響範囲を確認してください。

::: danger Agent による無制限な設定変更の回避
`update_config` は設定を直接ディスクに永続化し、今後のスケジューリングに影響を及ぼします。楽観的ロック（revision）が存在しない外部からの変更は、ユーザーの手動編集を上書きするリスクがあります。
:::

## <DocIcon name="scale" /> WebSocket との役割分担

| 機能 | MCP | WebSocket |
| --- | --- | --- |
| インスタンスの一覧・起動・停止 | ✅ | ✅ |
| 詳細な設定スキーマの読み書き | 一部限定（`update_config`） | ✅ 完全対応 |
| リアルタイムストリーミング購読 | ❌ | ✅ |
| スケジュールキューの詳細編集 | ❌ | ✅ |
| AI クライアント向けプロトコル | ✅ | 独自開発が必要 |

MCP は「AI Agent のためのコンパクトなインターフェース」、WebSocket は「GUI フロントエンドのための完全なインターフェース」として設計されています。

## <DocIcon name="shield" /> セキュリティ上の推奨事項

1. 必要時のみ有効化し、公網へ恒常的にポートを開放しないでください。
2. WebUI には強力なパスワードを設定し、ゲームアカウントのパスワードと共通化しないでください。
3. リモート運用時は WSS や Cloudflare Tunnel 等を経由し、ポート 25548 を生でインターネットに公開しないでください。
4. Agent が実行したツール呼び出し履歴（特に書き込み・更新操作）を定期的に監査してください。
5. 長期間利用しない場合は WebUI を再起動し、認証パスワードを変更してください。

## <DocIcon name="wrench" /> トラブルシューティング

| 現象 | 主な原因と対策 |
| --- | --- |
| 401 Unauthorized | 認証ヘッダーの欠落、パスワード間違い、パスワード変更後の WebUI 未再起動 |
| 接続が拒否される | ポート番号の不一致、または WebUI 起動時に MCP が無効化されている |
| ツール呼び出しがタイムアウト | インスタンスが重い処理を実行中でバックエンドの応答が遅延 |
| 古い設定値が返却される | 設定キャッシュの影響。再度 `get_config` を呼び出してください |
| 独立サービスが起動しない | ポート 22268 が OCR サービスに占有されています |
