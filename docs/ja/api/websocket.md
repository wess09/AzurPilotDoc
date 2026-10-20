---
title: WebSocket API v1
description: コアプログラムの WebSocket API v1：メッセージ形式、セッション確立、購読トピック、エラー定義、および 72 種の全メソッド仕様。
updated: 2026-10-20
---

# WebSocket API v1

エンドポイント：

```text
ws://127.0.0.1:25548/api/v1/ws
wss://<リモートアクセスURL>/api/v1/ws
```

プロトコルバージョンは `v=1` です。すべてのメッセージは JSON テキストフレームとして送受信されます。

## <DocIcon name="file" /> メッセージエンベロープ

### リクエスト

```json
{
  "v": 1,
  "type": "request",
  "id": "req-001",
  "method": "instances.list",
  "params": {}
}
```

| フィールド | 制約事項 |
| --- | --- |
| `v` | `1` 固定 |
| `type` | `request` |
| `id` | 1〜100文字。同一セッション内で一意であること |
| `method` | 登録済みのメソッド名 |
| `params` | 厳格なスキーマ。未定義フィールドの混入は禁止 |

### 成功レスポンス

```json
{ "v": 1, "type": "response", "id": "req-001", "ok": true, "result": [] }
```

### 失敗レスポンス

```json
{
  "v": 1,
  "type": "response",
  "id": "req-001",
  "ok": false,
  "error": { "code": "INVALID_PARAMS", "message": "リクエスト形式またはパラメータが不正です", "details": [] }
}
```

### イベント通知

```json
{ "v": 1, "type": "event", "topic": "overview", "data": {} }
```

## <DocIcon name="handshake" /> セッション管理

接続確立後、サーバーから初期イベントがプッシュされます：

```json
{
  "v": 1,
  "type": "event",
  "topic": "session",
  "data": { "authRequired": true, "protocolVersion": 1 }
}
```

- `authRequired: false` の場合、ループバック接続かつパスワード未設定であるため、そのままメソッドを呼び出し可能です。
- 未認証状態の読み取りタイムアウトは30秒、認証後は60秒です。

### ログイン

```json
{
  "v": 1, "type": "request", "id": "a1", "method": "auth.login",
  "params": { "password": "<WebUI パスワード>" }
}
```

リモートペアリングクライアントはマスターパスワードではなくペアリング認証情報を送信します。ペアリングが取り消された場合、次回のリクエスト（15秒ごとのハートビートを含む）で `UNAUTHORIZED` が返却されます。

## <DocIcon name="megaphone" /> イベント購読

```json
{
  "v": 1, "type": "request", "id": "s1", "method": "events.subscribe",
  "params": { "instance": "ap", "topics": ["overview", "logs", "statistics"] }
}
```

| トピック | 配信データ内容 | サンプリング周期 |
| --- | --- | --- |
| `instances` | インスタンス一覧と実行ステータス | 2秒 |
| `overview` | 現在実行中のタスク、保有資材 | 1秒 |
| `logs` | 増分ログ | 変更時即時プッシュ |
| `preview` | スクリーンショットプレビュー | 変更時即時プッシュ |
| `statistics` | 統計レポート | 1秒 |
| `notifications` | 通知ストリーム | イベント発生時 |
| `stock` | 取引所・交換情報 | イベント発生時 |

::: warning 購読は全体上書き方式です
再度購読を実行すると以前の購読トピックはすべて解除されます。Android ホストはこの仕様上、グローバルな購読者を1つのみ保持します。外部ツールとフロントエンドが同一インスタンスを同時に購読して競合させないようご注意ください。
:::

## <DocIcon name="circle-alert" /> 制限事項とエラーコード

| 項目 | 上限値 |
| --- | --- |
| 単一メッセージサイズ | ≤ 8 MiB |
| 通常リクエストサイズ | ≤ 1 MiB |
| 大容量リクエストの例外 | `mind.import`、`mind.recognize`、`mind.save`、`mind.calculate` |
| レート制限 | 30 リクエスト / 秒 |

| エラーコード | 意味 |
| --- | --- |
| `INVALID_REQUEST` | メッセージエンベロープまたはサイズが不正 |
| `INVALID_PARAMS` | パラメータのバリデーションに失敗 |
| `UNAUTHORIZED` | 未認証、またはペアリング失効 |
| `TLS_REQUIRED` | リモート経由のアカウント操作で WSS が未使用 |
| `RATE_LIMITED` | リクエストレート超過 |
| `DUPLICATE_REQUEST` | リクエスト ID の重複 |
| `INTERNAL_ERROR` | サーバー内部エラー（詳細は秘匿） |

パラメータエラー時はフィールドのパスと期待される型のみが返却され、入力値はエコーバックされません。

## <DocIcon name="zap" /> 代表的なリクエストフロー

### インスタンス一覧の取得と概要の確認

```json
{"v":1,"type":"request","id":"1","method":"instances.list","params":{}}
{"v":1,"type":"request","id":"2","method":"overview.get","params":{"instance":"ap"}}
```

### スケジューラーの開始と停止

```json
{"v":1,"type":"request","id":"3","method":"scheduler.start","params":{"instance":"ap"}}
{"v":1,"type":"request","id":"4","method":"scheduler.stop","params":{"instance":"ap"}}
```

### 設定の変更

```json
{
  "v": 1, "type": "request", "id": "5", "method": "config.patch",
  "params": {
    "instance": "ap",
    "revision": "<前回取得した revision>",
    "changes": [{ "path": "Research.Scheduler.Enable", "value": true }]
  }
}
```

`revision` による楽観的排他制御が行われます。現在のバージョンと一致しない場合はコンフリクトエラーが返るため、再度 `config.get` で取得し直して送信する必要があります。

### タスクの即時実行

```json
{"v":1,"type":"request","id":"6","method":"tasks.run","params":{"instance":"ap","task":"Research"}}
```

これは「スケジュールをバイパスして即座に実行する」処理であり、`NextRun` の値は更新されません。

### ログの増分取得

```json
{"v":1,"type":"request","id":"7","method":"logs.get","params":{"instance":"ap","after":128}}
```

`after` にカーソル番号を指定することで、それ以降の増分ログエントリを取得できます。

## <DocIcon name="clipboard" /> メソッド一覧

以下のテーブルは `frontend/src/api/contract.json` から自動生成されています。各行を展開するとパラメータの型定義と制約を確認できます。

<ApiTable />

## <DocIcon name="lightbulb" /> クライアント実装のベストプラクティス

1. 接続後は直ちにリクエストを送信せず、まず `session` イベントを受信してからログイン要否を判定してください。
2. リクエスト `id` は単調増加番号または UUID を使用し、絶対に再利用しないでください。
3. 切断時は指数バックオフにより再接続を試み、トピックを再購読してください。
4. 購読開始時はまず `overview.get` で全量を一度取得し、以後はイベントによる増分同期を行ってください。
5. 書き込み操作後は成功を前提とせず、状態を再読込して確認してください。
6. パスワードを URL に含めないでください（カスタムヘッダーを設定できないクライアント向けの MCP `?key=` は例外です）。

## <DocIcon name="shield" /> セキュリティ上の推奨事項

- リモートアクセス時は必ず WSS を使用してください。ローカル外からのアカウント操作時は TLS が強制されます。
- WebSocket アドレスとパスワードが写り込んだスクリーンショットを公開・共有しないでください。
- 独自開発のモニタリングダッシュボード等では読み取り専用メソッドのみを利用し、`scheduler.stop` などの破壊的操作の誤実行を防いでください。
