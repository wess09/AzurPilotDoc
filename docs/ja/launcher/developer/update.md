---
title: 更新パイプラインとミラー
description: Launcher 3.x の部品配置、コア更新、Stable／Canary、自動更新、mTLS とダウンロード元の切替。
updated: 2026-10-31
---

# 更新パイプラインとミラー

更新には**３つの独立した工程**があります：Git／ADB 起動部品の配置、AzurPilot コアの更新、ランチャー本体の更新です。

## 部品とコア

公開 `stable.json.runtime`（schema 2）から Git／ADB ZIP と `deploy/**` を取得し、部品を `.azurpilot/tools/` に保存します。「デプロイ」はここまでです。

「起動」は内蔵 uv によって Python 3.14.x を準備し、deploy スクリプトでコアの更新、依存関係の同期、WebUI の構築を行います。実装は `uv sync --no-dev --no-install-project` とミラーへの切替に対応します。以前の「常に `uv sync --frozen`」という記述は正しくありません。明示的な「環境修復」は部品を再取得し、`.venv` を再構築しますが、ユーザー設定を保持します。

## 正式版と Canary

ビルド時の `LAUNCHER_UPDATE_URL` は**公開更新清単**の URL です。`https://ap.launcher-update.nanoda.work/updata/stable.json` を予備として使用します。清単の取得に mTLS は不要です。GitHub 以外のペイロード取得では内蔵証明書を使用する場合があり、SHA-256 で検証します。

`updateChannel` は `stable`（既定）または `canary`。`updateSource` は `auto`、`official`、`github`、`cloudflare`。取得元の選択はペイロードの優先順位だけを変えます。自動設定では簡体字中国語かつ北京時間の環境で公式を優先し、それ以外は GitHub、Cloudflare、公式の順です。HTTP 429 では並列数の抑制と Retry-After による待機ができます。

約 10 分ごとに新しい更新を確認します。runtime、正式版、Canary は別の清単項目として管理されます。

[初回起動](/ja/launcher/user/first-run)と[リリース](/ja/launcher/developer/build-release)を参照してください。
