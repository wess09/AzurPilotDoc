---
title: リモートアクセスとデバイスペアリング
description: LAN 直連または Cloudflare Quick Tunnel による WebUI への遠隔接続、ペアリングコード認証、Android クライアント連携。
updated: 2026-10-20
---

# リモートアクセスとデバイスペアリング

リモートアクセス機能は、「外出先や別室から稼働状況を確認・操作したい」という要求に応えます。セキュリティモデルの異なる2つの形態が用意されています：

| 接続形態 | 公開範囲 | 適用シナリオ |
| --- | --- | --- |
| LAN（ローカル直連） | 同一ルーター配下の内網 IP ＋ ポート | 自宅内での別 PC やスマホからのアクセス |
| Cloudflare Quick Tunnel | 一時的な公網ドメイン | 外出先からのアクセス、Android リモートクライアント接続 |

## <DocIcon name="laptop" /> LAN（ローカル直連）

1. <DocIcon name="file-pen" /> `config/deploy.yaml` の `WebuiHost` を `0.0.0.0` に設定します。
2. <DocIcon name="lock" /> `WebuiPassword` を設定するか、起動引数 `-k` を指定します。
3. <DocIcon name="refresh" /> バックエンドプロセスを再起動します。
4. <DocIcon name="monitor" /> 同一 Wi-Fi / ルーター内の端末から `http://<ローカルIP>:25548` にアクセスします。

::: danger パスワード未設定のまま 0.0.0.0 でリッスンしないでください
WebUI はタスクの開始・停止、スクリーンショットの閲覧、設定の変更が可能です。パスワード未設定で公網に公開すると、`password.txt` に自動生成パスワードが出力されるものの、不正アクセスの標的になりやすくなります。必ず強固なパスワードを手動設定してください。
:::

## <DocIcon name="cloud" /> Cloudflare Quick Tunnel

「設定 → 远程访问」でモードを `cloudflare` に設定し、WebUI パスワードを入力した上で機能を有効化して再起動します：

1. <DocIcon name="rocket" /> ローカルで `cloudflared` Quick Tunnel が起動し、一時的な `*.trycloudflare.com` アドレスを取得します。
2. <DocIcon name="key" /> デバイス固有キーを用いて、登録サービス（デフォルト：`https://remote.azurpilot.com`）へトンネルアドレスを登録します。
3. <DocIcon name="clock" /> 60秒ごとにリースを自動更新します（異常切断時は180秒後に失効）。
4. <DocIcon name="plug" /> 固定エントリ URL（`<registry>/d/<device_id>/`）が提供され、アクセス時に現在の Tunnel へ自動リダイレクト（301）されます。

デバイスの身元情報は `config/remote-access.json` に保存されます。固定 URL を維持したい場合はこのファイルをバックアップしてください（他者へ共有しないでください）。

::: warning Quick Tunnel の可用性について
Cloudflare は Quick Tunnel の恒常的な SLA を保証しておらず、同時接続数やロングポーリング等に制限があります。長時間の本格運用を行う場合は独自ドメインによる固定 Tunnel の運用も検討してください。
:::

## <DocIcon name="handshake" /> デバイスペアリングのフロー

<Steps>
<Step title="ホスト側でペアリングを開始">

リモートアクセスが準備完了になった後、「ペアリング」をクリックします。6桁の確認コード（先頭のゼロを保持）と QR コードが生成されます（有効期限5分）。

</Step>
<Step title="クライアント側で登録">

- QR コードスキャン：`azurpilot://pair?secret=<secret>` を読み取ります。
- 手動入力：6桁の確認コードを入力します。

ペアリングコードは1度しか消費できません。

</Step>
<Step title="クライアント側での認証情報保存">

Android クライアントは Keystore の AES-GCM を用いて固定接続先と認証トークンを暗号化保存します。

</Step>
<Step title="認可と取消">

ホスト側の「認可済み端末一覧」から特定のクライアントの認可を個別に取り消すことができます。次回通信時に直ちに接続が遮断されます。

</Step>
</Steps>

## <DocIcon name="shield" /> セキュリティ境界の設計

| 項目 | 設計方針 |
| --- | --- |
| ペアリングコード | 6桁コード ＋ 128ビットシークレット、5分で有効期限切れ、使い捨て |
| トークン管理 | サーバー側はハッシュ値のみを保持。クライアント側は Keystore で保護 |
| 端末単位の失効 | WebUI のマスターパスワードを変更することなく特定端末のみを切断可能 |
| 通信データの秘匿 | 登録サービスはトンネル URL のみを取り扱い、WebSocket や業務データは中継しない |

## <DocIcon name="smartphone" /> クライアントの利用形態

- <DocIcon name="monitor" /> **Web ブラウザ**：Tunnel アドレスに直接アクセスし、WebUI パスワードを入力してログイン。
- <DocIcon name="smartphone" /> **Android ホスト**：リモートクライアントモードを使用し、端末内に Runtime を構築することなくネイティブ UI から操作。詳細は[リモートクライアントとしての利用](/ja/android/user/remote-client)を参照。
- <DocIcon name="plug" /> **MCP クライアント**：`/mcp/sse` エンドポイントを使用し、Bearer Token として WebUI パスワードを付与。詳細は [MCP サービス](/ja/api/mcp) を参照。

## <DocIcon name="wrench" /> トラブルシューティング

| 現象 | 主な原因と対策 |
| --- | --- |
| 固定 URL が `/error` に 302 リダイレクト | マシンがオフライン、リース切れ、Tunnel の切断 |
| QR コードが読み取れない | 画面の明るさやスケーリングの調整 |
| ペアリングコードが期限切れと表示される | 5分を超過しています。ホスト側で再生成してください |
| 接続中のまま画面が進まない | 中継ネットワークで WebSocket がブロックされています |
| 更新後に Tunnel が起動しない | Runtime 内の `pyflared` の更新状態を確認 |
