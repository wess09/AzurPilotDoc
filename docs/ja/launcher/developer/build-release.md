---
title: ビルドとリリース
description: Launcher 3.0.4 の共通 React 成果物、Tauri パッケージ、runtime schema 2、署名、Stable／Canary の CI。
updated: 2026-10-31
---

# ビルドとリリース

現在の正式版基準は **3.0.4** です。リリースには Tauri／Rust 本体と React UI、起動用 uv を含みますが、コア全体や完全な Python 環境を内蔵しません。

## ローカル確認

```bash
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
```

## CI と配布

`.github/workflows/package.yml` は Git／ADB 部品の ZIP を作成・検証し、`stable.json.runtime`（schema 2）を更新します。`frontend/dist` は**一度だけビルド**して各 OS の Tauri パッケージで共有します。Windows では Inno Setup とコード署名も使用します。

正式版は Git タグのバージョンで公開されます。対象の `main` ビルドは基本 patch を 1 増やし、`-canary.<短い SHA>.<UTC 時刻>` を加えたテスト版として別の `canary` 項目へ配布します。

更新パッケージの `url`、`github_url`、`cloudflare_url` と SHA-256 を確認してください。清単は公開されていますが、GitHub 以外の更新ペイロード配信で mTLS が使われる場合があります。秘密鍵や署名認証情報はリポジトリに置きません。

[更新パイプライン](/ja/launcher/developer/update)と[構成](/ja/launcher/developer/architecture)も参照してください。
