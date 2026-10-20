---
title: ランチャーのインストール
description: Windows、macOS、Linux でのダウンロード、展開、権限付与、実行手順、および WebView 依存関係の確認。
updated: 2026-10-20
---

# ランチャーのインストール

ランチャーはインストーラーウィザードのないポータブル圧縮アーカイブ形式で配布されています。実質的な「インストール」は初回起動時に自動実行され、ディレクトリ内に `.venv` が作成され、Python やコアリポジトリが自動取得されます。

## <DocIcon name="download" /> ダウンロード

| 配布チャネル | アドレス |
| --- | --- |
| GitHub Releases | `github.com/wess09/AzurPilotLauncher/releases/latest` |
| 公式サイトダウンロードページ | `azurpilot.com/download.html` |
| CNB | 中国本土ミラー |

お使いの **OS および CPU アーキテクチャに適合するパッケージ**を選択してください：

| ファイル名の特徴 | 対象環境 |
| --- | --- |
| `windows-x64` | 一般的な 64ビット Windows PC |
| `windows-arm64` | Windows on ARM 端末 |
| `macos` | Apple Silicon / Intel（リリースノート参照） |
| `linux-x64` / `linux-arm64` | 各 CPU アーキテクチャの Linux |
| `-cn` 表記あり | 中国本土ミラー向けデプロイ構成プリセット |

::: tip 国際版と CN 版の違いについて
両者のランチャー実行バイナリ自体は同一です。違いは初期設定内のダウンロード元 URL のみです（`-cn` は国内ミラーおよび PyPI ミラーを優先設定）。初回起動後でも設定ファイルから手動で切り替え可能です。
:::

## <DocIcon name="folder" /> 展開先の配置場所

アーカイブは**恒久的で、書き込み権限があり、シンプルなパス**のディレクトリに展開してください：

- ✅ `D:\AzurPilot\`
- ✅ `~/Applications/AzurPilot/`
- ❌ `C:\Program Files\`（一般ユーザー権限での書き込み不可）
- ❌ パス内にスペースや日本語、記号が含まれる場所（一部ツールチェーンの互換性低下）
- ❌ クラウド同期フォルダ（OneDrive / iCloud 等が `.venv` 内のファイルをロックする原因になります）

::: danger 一時フォルダへの展開禁止
ランチャーはコアリポジトリ、`.venv`、設定ファイル、ログをすべて自身のディレクトリ配下に生成します。一時フォルダ（Temp）に配置するとクリーンアップツール等に削除され、設定が消失します。
:::

## <DocIcon name="monitor" /> Windows

<Steps>
<Step title="アーカイブの展開">

7-Zip または OS 標準機能で展開します。アーカイブを開いた状態のまま直接内部の exe をダブルクリックして実行しないでください。

</Step>
<Step title="管理者権限の承認">

`alas-launcher.exe` のマニフェストには `requireAdministrator` が宣言されているため、起動時に UAC（ユーザーアカウント制御）プロンプトが表示されます。これは ADB の配置やシステムディレクトリ書き込みに必要となります。

</Step>
<Step title="SmartScreen の警告への対処">

署名のないバイナリのため SmartScreen にブロックされる場合があります。「詳細情報」をクリックし、「実行」を選択してください。

</Step>
<Step title="WebView2 の確認">

Windows 11 には標準搭載されています。Windows 10 で不足エラーが表示された場合は、[WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) を導入してください。

</Step>
</Steps>

## <DocIcon name="laptop" /> macOS

```bash
# 展開後、Applications フォルダへ配置
xattr -dr com.apple.quarantine /Applications/AzurPilot.app
open /Applications/AzurPilot.app
```

Apple の開発者署名がないため、初回起動時は Gatekeeper によりブロックされます。上記コマンドで Quarantine（隔離）属性を削除してから起動してください。

::: warning 「右クリック → 開く」の繰り返し操作は避けてください
一部の macOS バージョンでは拒否状態がキャッシュされます。`xattr` コマンドで属性を解除するのが最も確実です。
:::

## <DocIcon name="wrench" /> Linux

```bash
tar -xf azurpilot-launcher-linux-x64.tar.xz
cd AzurPilot
chmod +x alas-launcher
./alas-launcher
```

必要パッケージ：

| パッケージ | 概要 |
| --- | --- |
| `libwebkit2gtk-4.1` | WebView 描画エンジン |
| 新しめの glibc | CI ビルド環境は Ubuntu 22.04 を使用 |
| `libgtk-3` | ウィンドウ描画ライブラリ |

Debian / Ubuntu 系でのインストール：

```bash
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0
```

ディストリビューションが古くランチャーが動作しない場合でも、コアプログラム単体であれば `uv run python gui.py`（要 Python 3.14 + uv）として直接実行可能です。

## <DocIcon name="circle-check" /> 初回起動の正常性チェック

初回起動時は完全な環境自律初期化が実行されます。所要時間は通信速度に依存します。成功の判断基準：

| チェック項目 | 期待される動作 |
| --- | --- |
| スプラッシュ画面 | `.venv` 作成 → Python 取得 → リポジトリ更新 → 依存同期が順次表示される |
| ウィンドウ表示 | 完了後、ログイン画面を挟まずに直接 WebUI が表示される |
| ポート | デフォルトで `22267` が使用される |
| フォルダ | ディレクトリ内に `.venv/`、`config/`、`frontend/`、`log/` が生成されている |

## <DocIcon name="file-pen" /> 起動コマンドライン引数

| 引数 | 役割 |
| --- | --- |
| `--lang <zh-CN|zh-TW|ja|en>` | ランチャーの表示言語を強制指定 |
| `--skip-update` | リポジトリの更新確認をスキップ（オフライン時や障害調査用） |
| `--preview-crash` | エラー画面のプレビュー表示 |
| `--start-minimized` | 起動時にトレイへ最小化（OS 起動時自動実行用） |

## <DocIcon name="circle-off" /> アンインストール

ディレクトリごと削除するだけで完了します。スタートアップ登録を除き、レジストリやシステム領域へのファイル書き込みは行いません。

**削除前に必ず `config/` ディレクトリをバックアップ**してください。バックアップを行わない場合、インスタンス設定や統計データ、アカウントヴォールトが完全に失われます。

```text
保存が必要なデータ：config/、AzurPilot_Data_Backup/
削除してよいデータ：.venv/、frontend/、log/、cache/
```

## <DocIcon name="message" /> インストール時によくあるトラブル

| 現象 | 主な原因と対策 |
| --- | --- |
| ダブルクリックしても反応がない | UAC プロンプトで拒否された、またはセキュリティソフトによる隔離 |
| WebView2 の不足エラー | WebView2 ランタイムが未導入 |
| macOS で「壊れているため開けません」 | Quarantine 隔離属性が残存。`xattr` コマンドで解除 |
| Linux で `libwebkit2gtk` が見つからない | 4.1 バージョンのライブラリが未インストール |
| パスにスペースが含まれ異常終了 | スペースを含まないパスへ移動 |
| ランチャーが再起動を繰り返す | 環境初期化の失敗。[初回起動](/ja/launcher/user/first-run#初始化失败)を参照 |
