---
title: API 概要
description: AzurPilot が外部に公開する3系統のインターフェース：WebSocket RPC、Android 薄型インターフェース、MCP サービスの仕様と境界。
updated: 2026-10-20
---

# API 概要

コアプログラムが外部へ公開するインターフェースは大きく3系統に分かれます。これらは共通の設定とプロセスモデルを共有していますが、プロトコル、認証方式、適用シナリオが異なります。

| インターフェース | エンドポイント | プロトコル | 認証 | 用途 |
| --- | --- | --- | --- | --- |
| WebSocket API | `/api/v1/ws` | JSON RPC over WS | セッションパスワード / ペアリング認証情報 | フロントエンド、Android、独自ダッシュボード |
| Android 薄型インターフェース | `/android/*` | HTTP | ローカルループバック ＋ ヘッダー Token | Android ホスト |
| MCP サービス | `/mcp/sse` または独立ポート `:22268` | MCP SSE | Bearer（WebUI パスワード） | AI クライアント |

このほかに稼働確認用の `/healthz` が用意されています（認証不要、業務データなし）。

## <DocIcon name="shield" /> 安定性の境界

::: warning 登録されたメソッドのみが公開 API です
`module/api/router.py` に登録された 72 個のメソッドが公式の公開インターフェース規約であり、`dev_tools.export_api_schema` により型定義が生成されます。業務モジュール内部の Python 関数は API ではないため、フロントエンドや外部ツールから直接呼び出さないでください。
:::

| レイヤー | 安定性 |
| --- | --- |
| `router.py` 登録メソッド | 公開。パラメータモデルは厳密にバリデーション |
| `/android/*` | アプリ専用。ホストのバージョン更新に伴い変更 |
| MCP ツール | 公開。ツールの個数やセマンティクスはバージョン依存 |
| 内部 service / モジュール関数 | プライベート。予告なく改変される可能性あり |

## <DocIcon name="plug" /> ポート一覧

| ポート | 用途 | 設定元 |
| --- | --- | --- |
| `25548` | WebUI ＋ WebSocket | `deploy.yaml` の `WebuiPort` |
| `22267` | ランチャー起動時の WebUI | ランチャーにより指定 |
| `22268` | 独立 MCP / OCR サービス | `OcrServerPort` |
| `22302` | Android OCR テンソル API | Android `:ocr` |
| `22300` / `22400` | レガシーホストプロセス検出 | Android 互換性チェック |

::: tip 22268 は共用ポートです
MCP 独立サービスと OCR サービスはデフォルトでどちらも 22268 ポートを使用します。同一マシン上で両者を同時に動作させると競合するため、事前にいずれか一方のポート番号を変更してください。
:::

## <DocIcon name="key" /> 認証方式

| 利用シーン | 認証手段 |
| --- | --- |
| ローカルループバック接続・パスワード未設定 | 認証不要 |
| ブラウザ / LAN からのアクセス | `auth.login` で WebUI パスワードを送信 |
| Android リモートクライアント | ペアリング認証情報（マスターパスワードから独立） |
| Android ローカルホスト | `X-AzurPilot-Android-Token`（ループバック必須） |
| MCP | `Authorization: Bearer <WebUI パスワード>` または `?key=` |

パスワードの設定元：起動時の `--key` 引数、`config/deploy.yaml` の `Password`、または自動生成された `password.txt`。

## <DocIcon name="file" /> 最小リクエスト例

WebSocket：

```json
{"v":1,"type":"request","id":"1","method":"system.ping","params":{}}
{"v":1,"type":"response","id":"1","ok":true,"result":{"pong":true}}
```

HTTP：

```bash
curl -s http://127.0.0.1:25548/healthz
```

MCP：

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

## <DocIcon name="map" /> 関連マニュアル

<ul class="ap-linklist">
<li><a href="/ja/api/websocket">WebSocket API<span class="desc">メッセージ形式・認証・72のメソッド</span></a></li>
<li><a href="/ja/api/android">Android 薄型インターフェース<span class="desc">ホストと Runtime 間の連携規約</span></a></li>
<li><a href="/ja/api/mcp">MCP サービス<span class="desc">18のツールとクライアント連携</span></a></li>
<li><a href="/ja/azurpilot/developer/webui-backend">WebUI バックエンド<span class="desc">実装の詳細</span></a></li>
</ul>
