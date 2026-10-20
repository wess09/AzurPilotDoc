---
title: インストール
description: デスクトップランチャー、Android APK、Docker、またはソースコード経由での AzurPilot の導入手順と検証方法。
updated: 2026-10-20
---

# インストール

インストール前に[動作環境と互換性](/ja/guide/requirements)をご確認ください。以下の4つのルートは「推奨度順」に並んでいます。一般的なユーザーはデスクトップランチャーの利用を推奨します。

## <DocIcon name="download" /> デスクトップランチャー（推奨）

### ダウンロード

[公式サイトダウンロードページ](https://azurpilot.com/download.html) または [GitHub Releases](https://github.com/wess09/AzurPilotLauncher/releases/latest) から、お使いの OS および CPU アーキテクチャに対応する圧縮アーカイブを取得してください。中国本土ネットワーク環境では `-cn` の付いたミラー版を選択してください。

### 展開と実行

<Steps>
<Step title="恒久的なディレクトリに展開">

ランチャーは自身のディレクトリ内に `.venv` を作成し、コアリポジトリを取得して設定を保存します。一時ディレクトリや書き込み権限のない場所、クラウド同期フォルダなどパスの互換性に問題が生じやすい場所には配置しないでください。

</Step>
<Step title="ランチャーの起動">

- <DocIcon name="monitor" /> **Windows**：`alas-launcher.exe` をダブルクリックします。管理者権限（ADB のインストールおよびシステムディレクトリへの書き込み）が必要なため、UAC プロンプトが表示されます。
- <DocIcon name="laptop" /> **macOS**：`AzurPilot.app` を開きます。署名のないアプリケーションのため Gatekeeper にブロックされる場合があります。後述の説明を参照してください。
- <DocIcon name="wrench" /> **Linux**：`chmod +x alas-launcher && ./alas-launcher` を実行します。

</Step>
<Step title="環境の初期化待機">

起動スプラッシュ画面に進行状況が表示されます：`.venv` の作成 → Python 3.14.6 のダウンロード → リポジトリの更新 → `uv sync --frozen`。初回起動時はネットワーク接続が必須であり、通常数分程度かかります。

</Step>
<Step title="WebUI へのアクセス">

ウィンドウが表示された時点でログイン処理は完了しており、AzurPilot WebUI が直接表示されます。デフォルトポートは `22267` です（ランチャーがポートを指定して起動します。コアプログラム単体のデフォルトポートは `25548` です）。

</Step>
</Steps>

::: warning macOS での初回起動失敗時
本プログラムは Apple の開発者署名を受けていません。「開発元を検証できない」という警告が表示された場合は、ターミナルで以下を実行してください：

```bash
xattr -dr com.apple.quarantine /Applications/AzurPilot.app
```

実行後、再度アプリケーションを開いてください。「システム設定 → プライバシーとセキュリティ」から「このまま開く」を繰り返しクリックする方法は推奨しません。
:::

::: tip Windows で WebView2 が不足している場合
Tauri は WebView2 に依存しています。Windows 11 には標準搭載されていますが、Windows 10 で不足エラーが出る場合は、[Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) をインストールして再試行してください。
:::

## <DocIcon name="smartphone" /> Android

完全な手順は [Android のインストールとアーキテクチャ選択](/ja/android/user/install) を参照してください。概要の流れは以下のとおりです：

1. <DocIcon name="clipboard" /> デバイスが Android 9.0 以上、ARM64 または x86_64 であることを確認します。
2. <DocIcon name="download" /> アーキテクチャに適合する**完全版 APK**（Runtime 内包）または**軽量増分 APK**（初回起動時に約 1GB の Runtime をダウンロード）を取得します。
3. <DocIcon name="clock" /> インストールして起動し、rootfs の展開完了（1〜3分）を待機します。
4. <DocIcon name="lock" /> 画面の指示に従い、ADB（ワイヤレスペアリング機能内蔵）または Root で権限をアクティベートします。
5. <DocIcon name="settings" /> アプリ内で AzurPilot コンソールを開き、インスタンスを設定します。

## <DocIcon name="box" /> Docker

NAS、サーバー、GUI のない環境に適しています。コンテナ上では WebUI とスケジューラーのみが動作し、エミュレーターはホスト側で実行します：

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
docker compose up -d --build
```

`docker-compose.yml` は `network_mode: host` を使用し、コンテナ内では `.venv/bin/python gui.py` として起動します。中国本土ネットワークでは Dockerfile を `deploy/docker/Dockerfile.cn` に差し替え、`UV_INDEX_URL` でミラーを指定可能です。

::: tip 初回ビルドの所要時間
イメージは2段階でビルドされます：Node 24 でフロントエンドをビルドし、Python 3.14 でランタイム依存関係をインストールします。初回の `--build` はダウンロード量が多いため時間を要しますが、次回以降の再構築時はキャッシュが再利用されます。
:::

## <DocIcon name="laptop" /> ソースコード実行 {#源码运行}

開発、デバッグ、カスタマイズに適しています。

### 必要環境

- <DocIcon name="circle-check" /> Python **3.14**（厳密な要件は `pyproject.toml` に準拠）
- <DocIcon name="circle-check" /> [uv](https://github.com/astral-sh/uv)
- <DocIcon name="circle-check" /> Node.js（フロントエンドのビルド用。`frontend/dist` が存在しない場合、`gui.py` が自動的に依存関係をインストールしてビルドします）

### セットアップ手順

```bash
git clone https://github.com/wess09/AzurPilot.git
cd AzurPilot
uv sync --frozen --no-dev
uv run python gui.py
```

ブラウザで `http://127.0.0.1:25548` にアクセスします。デフォルトでは `0.0.0.0` をリッスンし、ポートとリッスンアドレスは `config/deploy.yaml` の `WebuiHost` / `WebuiPort` から読み込まれます。

主要な起動オプション：

```bash
uv run python gui.py --port 25548 --host 127.0.0.1 --key "your-password"
```

| 引数 | 機能 |
| --- | --- |
| `--host` | `WebuiHost` の設定を上書き |
| `-p, --port` | `WebuiPort` の設定を上書き |
| `-k, --key` | アクセス認証パスワードを設定 |
| `--ssl-key` / `--ssl-cert` | HTTPS 通信を有効化 |
| `--run <インスタンス名>` | 起動と同時に指定したインスタンスを実行 |

### インストールの検証

```bash
# インポートスモークテスト：エミュレーターに接続せず、モジュールがロード可能かを検証
uv run python -m dev_tools.import_smoke_test

# Python 単体テストの実行
uv run python -m unittest discover -s tests
```

WebUI が正常に開き、タスク一覧が描画され、ログに traceback が出力されていなければ、バックエンドの環境構築は完了です。次のステップとしてデバイス接続に進んでください。

## <DocIcon name="circle-check" /> インストール完了後の手順

<ul class="ap-linklist">
<li><a href="/ja/guide/first-run">初回実行<span class="desc">エミュレーターを接続してタスクを1つ実行</span></a></li>
<li><a href="/ja/azurpilot/user/device">エミュレーターと ADB の接続<span class="desc">Serial・スクリーンショット・操作方式の設定</span></a></li>
<li><a href="/ja/troubleshooting/">トラブルシューティング<span class="desc">初期化失敗や環境破損への対処</span></a></li>
</ul>
