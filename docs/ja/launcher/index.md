---
title: AzurPilot Launcher
description: Tauri 2 + Rust ベースのクロスプラットフォームデスクトップランチャー：uv と Python 内包、コード自動取得、プロセス管理。
updated: 2026-10-20
---

# AzurPilot Launcher

ランチャーは「Python の導入、依存関係の設定、コードの取得、サービスの起動」の4つの課題を解決します。ゲームロジック自体は含まず、コアプログラムを確実に起動させ、通常のデスクトップアプリケーションとして統合する役割を担います。

<div class="ap-meta">
<span><b>リポジトリ</b> wess09/AzurPilotLauncher</span>
<span><b>ブランチ</b> main</span>
<span><b>フレームワーク</b> Tauri 2 + Rust</span>
<span><b>ランタイム</b> Python 3.14.6（内包）</span>
<span><b>ライセンス</b> GPL-3.0</span>
</div>

![ランチャーによる AzurPilot 更新画面](/img/launcher-update.jpg)

<Figure caption="ランチャーの更新画面：ターゲットバージョン、デプロイ構成、進行状況が表示され、完了後に自動でメイン画面へ遷移します。" />

## <DocIcon name="wrench" /> ランチャーの処理フロー

```text
展開 → ランチャー起動 → スプラッシュ画面 → 環境自律構築（uv/Python/git/adb）
     → コアリポジトリの git 更新 → uv sync --frozen
       → gui.py 起動 → WebUI 表示（パスワードレス直接接続）→ システムトレイ常駐
```

| 機能 | 実装 |
| --- | --- |
| 環境自律構築 | uv を内包。Python 3.14.6 を取得し、再配置可能な `.venv` を自動構築 |
| ツールチェーン | git、adb を `.venv` 内に統合し、ホスト環境を汚染しない |
| コード更新 | `git pull` を実行（失敗時は最大20回リトライ） |
| 依存同期 | `uv.lock` に基づき `uv sync --frozen` で厳密同期 |
| プロセス管理 | ポート競合の解消、環境識別マーカーの注入、終了時の全プロセスクリーンアップ |
| 自己自動更新 | mTLS 検証 ＋ 複数ミラーへのフォールバック |
| システム統合 | システムトレイ、ネイティブ通知、単一インスタンス制御、OS 起動時自動開始 |
| 多言語対応 | 簡体字 / 繁体字 / 日本語 / 英語（OS の locale に連動） |

## <DocIcon name="handshake" /> コアプログラムとの関係

| 項目 | ランチャー | コアプログラム |
| --- | --- | --- |
| リポジトリ | AzurPilotLauncher | AzurPilot |
| 開発言語 | Rust / Tauri | Python / React |
| バージョン管理 | 独立したバージョン番号 | `master` ブランチのローリング更新 |
| 更新方式 | 自身の自動更新（mTLS） | `git pull` ＋ `uv sync` |
| ゲームロジックの内包 | なし | あり |

::: tip 2つのバージョン番号は独立しています
ランチャー 1.x は任意のコアプログラムのコミットと組み合わせて稼働できます。ランチャーをアップデートしてもコアプログラムのコードが巻き戻ることはなく、コアプログラムを更新してもランチャー本体には影響しません。
:::

## <DocIcon name="clipboard" /> 動作環境要件

| 項目 | 要件 |
| --- | --- |
| OS | Windows 10 以降、macOS、Linux（比較的新しい glibc） |
| WebView | Windows：WebView2、macOS：システム標準 WKWebView、Linux：`libwebkit2gtk-4.1` |
| 実行権限 | Windows は管理者権限が必要（ADB のインストール、システムディレクトリへの書き込み） |
| ネットワーク | 初回起動時は Python および依存関係取得のためインターネット接続必須 |
| ストレージ | 約 3〜5 GB（.venv およびリポジトリ全体を含む） |

## <DocIcon name="folder" /> ディレクトリ構成

```text
AzurLaneAutoScript/                 # Windows / Linux ルートディレクトリ
AzurPilot.app/Contents/AzurLaneAutoScript/   # macOS

├── alas-launcher.exe / alas-launcher
├── .venv/                          # Python + uv + git + adb
├── config/                         # インスタンス設定および deploy.yaml
├── frontend/                       # コアリポジトリのフロントエンド成果物
├── log/                            # 実行ログ
└── AzurPilot_Data_Backup/          # 自動バックアップ
```

ランチャーは子プロセスの環境変数 PATH を自動補正します：

| プラットフォーム | 追加される PATH |
| --- | --- |
| Unix | `.venv/bin` |
| Windows | `.venv/Scripts`、`.venv/Scripts/git/cmd` |

## <DocIcon name="scale" /> オリジナル版ランチャーとの差異

| 項目 | 本ランチャーの特徴 |
| --- | --- |
| 対応プラットフォーム | Windows / macOS / Linux クロスプラットフォーム対応 |
| 更新方針 | Git リポジトリのみを更新し、依存関係は `.venv` 内の uv で高速同期 |
| 依存関係のロック | `uv.lock` により厳密にバージョン固定し自動同期 |
| adb 管理 | 外部の既存 adb を勝手に再起動・置換しない |
| ツールの局所化 | 関連バイナリをすべて `.venv` 内に集約 |
| Node.js | Windows のみ：システム環境を検知し、未検出時は自動取得・導入（SHA-256 検証） |

## <DocIcon name="map" /> 関連マニュアル

<ul class="ap-linklist">
<li><a href="/ja/launcher/user/install">インストール<span class="desc">3つのプラットフォームでの導入手順</span></a></li>
<li><a href="/ja/launcher/user/first-run">初回起動<span class="desc">環境初期化で行われること</span></a></li>
<li><a href="/ja/launcher/user/maintenance">更新・修復・アンインストール<span class="desc">環境破損時のトラブル対応</span></a></li>
<li><a href="/ja/launcher/developer/architecture">Tauri と Rust アーキテクチャ<span class="desc">開発者向け内部解説</span></a></li>
</ul>
