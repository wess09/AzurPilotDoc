---
title: Tauri と Rust アーキテクチャ
description: デュアルウィンドウ、カスタム URI プロトコル、起動ステートマシン、トレイと通知、WebView と Rust 間の通信境界。
updated: 2026-10-20
---

# Tauri と Rust アーキテクチャ

ランチャーは「GUI を備えたインストーラー 兼 プロセススーパーバイザー」として構成されています。独立したフロントエンドプロジェクトを持たず、WebView は Rust 内部に埋め込まれた HTML をロードし、`tauri://` とは別のカスタムプロトコルを介して画面を提供します。

## <DocIcon name="monitor" /> ウィンドウ構成

| ウィンドウ | サイズ | 特徴 |
| --- | --- | --- |
| `main` | 1280×880 | リサイズ可能。初期状態は非表示で、バックエンドの準備完了後に表示 |
| `splash` | 800×450 | 枠なし（ボーダーレス）、リサイズ不可。メインウィンドウに先立ち表示 |

WebView のパラメータでは以下の挙動が明示的にカスタマイズされています：

```text
--enable-features=msWebView2EnableDraggableRegions
--disable-features=ElasticOverscroll,msWebOOUI,msPdfOOUI,msSmartScreenProtection
--no-proxy-server
```

- `--no-proxy-server`：ローカルの WebUI への接続時にシステムプロキシをバイパスし、プロキシソフトによる `127.0.0.1` の誤遮断を防止。
- SmartScreen 保護の無効化：内包されたローカル HTML であるため、外部サイト向けの誤警告を防止。

::: tip macOS の WKWebView
Windows 向けの `additionalBrowserArgs` は macOS では効果を持ちません。プラットフォーム間の差異は共通パラメータを仮定せず、`#[cfg]` マクロにより適切にハンドリングしてください。
:::

## <DocIcon name="plug" /> カスタム URI プロトコル

| プロトコル | 提供内容 |
| --- | --- |
| `alas-splash://` | スプラッシュ画面（進捗状況、各フェーズの案内テキスト） |
| `alas-error://` | エラー表示画面（エラー事由、ログファイルのパス、再試行ボタン） |

画面は Rust 内部の埋め込み文字列と `splash-progress.js` により制御されます。進捗情報は Tauri のイベントシステムを介して Rust から WebView へプッシュされ、JavaScript 側は描画処理のみを担当します。

UI 改変時の正しい手順：

1. `main.rs` 内の HTML テンプレートまたは `splash-progress.js` を改変。
2. 4言語の `locales/*.yml` を同期更新。
3. `--preview-crash` オプションでエラー画面をプレビュー確認。
4. 3プラットフォームそれぞれでスクリーンショットを撮影して表示崩れがないか確認。

## <DocIcon name="rocket" /> 起動ステートマシン

```text
Idle
 → Splash（スプラッシュ画面の表示）
   → Provisioning（環境自律構築）
     → Updating（git pull ＋ uv sync）
       → StartingBackend（ポート競合解消、gui.py 起動）
         → Waiting（最大60秒の準備完了待機）
           → Ready（メインウィンドウ表示、認証トークン注入）
             → Running（システムトレイ常駐）
```

いずれかのステップでエラーが発生した場合は `Error` ステートへ遷移し、`alas-error://` 画面が表示されてログのパスと再試行ボタンが提示されます。

## <DocIcon name="handshake" /> WebView と Rust 間の通信境界

| 通信方向 | 採用技術 | 用途 |
| --- | --- | --- |
| Rust → WebView | Tauri event | 起動進捗、エラー通知、テーマ切り替え |
| WebView → Rust | `#[tauri::command]` | 再試行処理、ログディレクトリを開く、アプリ終了 |
| バックエンド → ランチャー | HTTP SSE `/api/notify_stream` | 周回タスクの通知情報 |
| バックエンド → ランチャー | HTTP `/api/launcher/stream` | 終了、再起動、OS 起動時自動開始の命令 |

バックエンドプロセスはランチャー内部の関数を直接呼び出すことはできません。HTTP ストリーム経由でコマンドを送信し、ランチャー側がパースして実行します。この厳密な境界により、バックエンドの不具合によってランチャーのプロセス管理が破壊される事態を防ぎます。

## <DocIcon name="box" /> システムトレイと通知

| 機能 | 実装方式 |
| --- | --- |
| システムトレイ | Tauri の `tray-icon` 機能を使用 |
| トレイメニュー | メイン画面の表示、バックエンドの再起動、ログフォルダを開く、終了 |
| 通知システム | Windows Toast / macOS / Linux ネイティブ通知 |
| 単一インスタンス | 既存プロセスへのフォーカス移動 |
| 自動起動 | Windows レジストリの Run キー（`--start-minimized` を付与） |

通知テキストは SSE ストリームから受信され、表示言語はランチャーの現在ロケールに連動します。

## <DocIcon name="message-text" /> 国際化（i18n）

```text
locales/zh-CN.yml   # 基軸ファイル
locales/zh-TW.yml
locales/ja.yml
locales/en.yml
```

Rust コード内では `t!("module.key")` マクロを使用し、パラメータを埋め込む場合は `t!("k", p = v)` として YAML 内に `%{p}` と記述します。文言を追加する際は必ず4言語同時に追加してください。キーが存在しない場合はキー名自体がそのまま UI に露出します。

## <DocIcon name="shield" /> セキュリティ境界

| 領域 | 対策 |
| --- | --- |
| 管理者権限 | Windows マニフェストに `requireAdministrator` を明記 |
| 自己自動更新 | mTLS クライアント証明書による相互認証（証明書は非公開） |
| ローカル WebUI | `--no-proxy-server` の適用、ワンタイム認証トークンの利用 |
| 子プロセスの制御 | `CREATE_NO_WINDOW` によるコンソール画面の完全非表示化 |
| プロセスクリーンアップ | 環境変数マーカー ＋ Job Object による終了時の一括走査回収 |
| ログの安全性 | パスワードや機密トークンをログファイルに出力しない |

## <DocIcon name="shield" /> 開発時の禁止事項

| 禁止事項 | 理由 |
| --- | --- |
| macOS 環境での `additionalBrowserArgs` への依存 | WKWebView はこの引数を受け付けません |
| `println!` によるログ出力 | GUI モードでは標準出力が表示されず、ログファイルにも記録されません |
| バックエンドプロセスの直接 `kill` | Job Object / プロセスグループのクリーンアップがスキップされ、ゾンビプロセスが残存します |
| 1言語のみの YAML 編集 | 他言語環境で生のキー名が露出します |
| uv のパスのハードコード | 内包 uv が見つからない場合の PATH フォールバックを阻害します |

## <DocIcon name="map" /> 関連ドキュメント

<ul class="ap-linklist">
<li><a href="/ja/launcher/developer/backend-lifecycle">バックエンドプロセスのライフサイクル<span class="desc">最も注意を要するプロセス管理仕様</span></a></li>
<li><a href="/ja/launcher/developer/update">更新パイプラインとミラー<span class="desc">git・uv・mTLS</span></a></li>
<li><a href="/ja/launcher/developer/build-release">ビルドとリリース<span class="desc">3プラットフォームの成果物生成</span></a></li>
</ul>
