---
title: Tauri と Rust の構成
description: Launcher 3.x の React フロントエンド、Tauri／Rust、デプロイ状態、WebSocket v2、各 OS の安全境界。
updated: 2026-11-12
---

# Tauri と Rust の構成

Launcher 3.x は **React + Tauri 2 + Rust** で実装されています。旧版の「フロントエンド工程がない」「バックエンドとの通信は HTTP SSE」という説明は現行コードに一致しません。

## 主要なコード

| ファイル | 役割 |
| --- | --- |
| `frontend/src/App.tsx` | ホーム、デプロイ、起動、更新、キャンセル、エラー |
| `frontend/src/SettingsDialog.tsx` | 更新チャンネル、ミラー、表示と電源設定 |
| `src/launcher.rs` | 実行状態とキャンセル処理 |
| `src/components.rs` | Git／ADB 部品、検証、復元 |
| `src/setup.rs` | Python、コア更新、依存関係 |
| `src/settings.rs` | SQLite 設定 |
| `src/backend.rs` | Python プロセス管理 |
| `src/launcher_control.rs` | 認証付き WebSocket v2 |
| `src/updater.rs` | ランチャー自体の更新 |
| `src/power.rs` | システムのスリープ抑止 |

## 実行フローと通信

初回は **「デプロイ」** で Git、ADB と deploy スクリプトのみを取得します。その後の **「起動」** で uv が Python 3.14.x を準備し、コアの取得、依存関係と WebUI の構築を経て `gui.py` を起動します。標準ポートは `22267` です。

ランチャーは `ws://127.0.0.1:<WebuiPort>/api/v2/launcher/ws` に `Authorization: Bearer <AP_WEBUI_TRUST_SECRET>` で接続します。ここは通知、自動起動命令、一度限りのログイン票を扱う専用チャンネルです。ブラウザーの業務 API `/api/v1/ws`（`v:1`）とは別物です。60 秒有効な `launcherTicket` を WebUI が消費してログインするため、パスワードを URL に渡しません。旧 HTTP SSE インターフェースは廃止されています。

Windows は Job Object、Unix はプロセスグループを使って後端を管理します。終了時はワーカーを回収しつつ、独立したエミュレーターは残す設計です。

## トレイとコンテキストメニューの実装

| モジュール | ソース入口 | 役割 |
| --- | --- | --- |
| トレイイベント | `src/main.rs`、`src/launcher.rs` | トレイイベント、OS 分岐、メニューアクション、IPC コマンドを登録 |
| Windows トレイポップアップ | `src/tray_menu.rs`、`frontend/src/TrayMenu.tsx` | 透明 WebView ウィンドウを事前生成し、DPI とポインター位置に合わせて表示。ホーム、表示 / 非表示、終了を提供 |
| 画面内コンテキストメニュー | `frontend/src/ContextMenu.tsx`、`frontend/src/contextMenu.module.css` | WebView の既定メニューを置き換え、選択範囲と入力フォーカスに応じて更新、コピー、貼り付け、全選択を有効化 |
| 権限とテスト | `capabilities/tray-menu.json`、`frontend/src/menus.test.tsx`、`frontend/src/focusRing.css` | トレイウィンドウの IPC 権限を制限し、操作をテスト。キーボードフォーカスを表示 |

Windows は Fluent の自作トレイポップアップ、macOS はネイティブ NSMenu を使用します。Linux では現在トレイアイコンを作成しません。Windows のポップアップは起動時に非表示で事前生成され、右クリック時にポインターの近くへ表示されます。フォーカス喪失、Esc、短時間内の再右クリックで閉じます。メニューアクションは `handle_tray_menu_action` を共有します。

画面内メニューは WebView2 / WKWebView のブラウザー既定メニューを置き換えます。コピーはテキスト選択時のみ、貼り付けと全選択は入力欄にフォーカスがある場合のみ有効です。外側のクリック、フォーカス喪失、Esc で閉じます。

main ブランチの状態と利用方法は[更新・修復・アンインストール](/ja/launcher/user/maintenance)を参照してください。

## 確認

```bash
npm --prefix frontend test
npm --prefix frontend run build
cargo check --locked --all-targets
cargo test --locked --all-targets
cargo test --locked --test launcher_ws
```

[初回起動](/ja/launcher/user/first-run)と[ビルドと公開](/ja/launcher/developer/build-release)も参照してください。
