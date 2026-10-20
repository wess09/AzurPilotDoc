---
title: ランチャー開発者ポータル
description: Tauri 2 + Rust プロジェクトのモジュール構成、ビルドコマンド、ビルド時環境変数、クロスプラットフォーム開発規約。
updated: 2026-10-20
---

# ランチャー開発者ポータル

ランチャープロジェクトには独立したフロントエンドディレクトリが存在しません。すべての「画面」は Rust バイナリ内に埋め込まれた HTML であり、カスタム URI プロトコルを介してロードされます。UI の改変は React プロジェクトの編集ではなく、Rust に埋め込まれる静的リソースの変更として行われます。

## <DocIcon name="laptop" /> 開発環境要件

| ツール | 必要バージョン |
| --- | --- |
| Rust | stable（edition 2021） |
| Node.js | Tauri CLI（`cargo tauri`）の実行時のみ使用 |
| システム依存ライブラリ | Windows：WebView2、Linux：`libwebkit2gtk-4.1`、`libgtk-3`、macOS：Xcode CLI |

```bash
cargo build              # デバッグビルド
cargo build --release    # リリースビルド（LTO ＋ strip 有効）
cargo tauri dev          # 開発時ホットリロード実行
cargo test               # 全単体テストの実行
cargo check              # コンパイルチェックのみ実行
```

::: warning Windows 環境では管理者権限のターミナルが必要です
マニフェストファイルで `requireAdministrator` が宣言されているため、非特権ターミナルで実行するとエラー 740 で起動に失敗し、`cargo test` にも影響を及ぼします。
:::

## <DocIcon name="box" /> モジュール設計

| モジュール | 責務と役割 |
| --- | --- |
| `main.rs` | Tauri のエントリポイント：スプラッシュ/メインウィンドウ、トレイ、タイトルバー注入、エラー画面、コマンド登録、タイムボム |
| `setup.rs` | 環境自律構築：Python/uv/adb/git の配置、Git リポジトリ更新（20回リトライ）、`uv sync`、`deploy.yaml` のマイグレーション |
| `backend.rs` | `gui.py` 子プロセスのライフサイクル管理、ポート競合の解消、環境変数マーカーによるフォールバッククリーンアップ |
| `backend_process.rs` | Windows Job Object および Unix プロセスグループの制御 |
| `nodejs.rs` | **Windows 専用**：システム上の Node.js を検出し、未検出時は自動取得・配置（SHA256 検証） |
| `notify.rs` | SSE 通知ストリーム（`/api/notify_stream`）の受信と OS ネイティブ通知の送出 |
| `launcher_control.rs` | リバースコントロールストリーム（`/api/launcher/stream`）：バックエンドからの終了/再起動/自動起動指令の処理 |
| `autostart.rs` | OS 起動時自動開始の管理（Windows レジストリの Run キーに `--start-minimized` を登録） |
| `i18n.rs` | ロケール検出：`--lang` 引数 > システムロケール > `en` |
| `window_util.rs` | Windows `CREATE_NO_WINDOW` フラグの付与による黒いコンソールウィンドウの抑止 |

## <DocIcon name="settings" /> ビルド時環境変数

`build.rs` によりコンパイル時に読み込まれる環境変数：

| 環境変数名 | 役割 | 未設定時の動作 |
| --- | --- | --- |
| `ALAS_BOOTSTRAP_UV` | 内包する uv バイナリのパス | 空のプレースホルダーとなり、実行時に PATH から探索 |
| `ALAS_LAUNCHER_MTLS_IDENTITY_PEM_B64` | 自己更新用 mTLS クライアント証明書（Base64） | リポジトリルートの `证书.txt` を探索（未コミット） |
| `LAUNCHER_UPDATE_URL` | 自己更新マニフェストの参照先上書き | `https://launcher-api.azurpilot.com/updata/stable.json` |

::: danger 証明書ファイルをリポジトリにコミットしないでください
`证书.txt` や Base64 エンコードされた PEM ファイルは機密情報です。CI 実行時は GitHub Secrets から注入し、ローカル開発時にコミットしないよう注意してください。
:::

## <DocIcon name="key" /> 主要な定数

| 定数 | 設定値 |
| --- | --- |
| WebUI ポート番号 | `22267` |
| 内包 Python バージョン | `3.14.6` |
| バックエンド準備完了待機時間 | 60 秒 |
| SSE 再接続インターバル | 3 秒 |
| Tauri identifier | `moe.taiho.alas-launcher` |
| プロダクト名 | `AzurPilot` |

タイムボム機能は `Cargo.toml` の `[package.metadata.alas-launcher.time-bomb]` で管理されており、現在は `enabled = false` に設定されています。

## <DocIcon name="shield" /> 開発上の基本規約

| 規約事項 | 詳細 |
| --- | --- |
| 多言語対応（i18n） | `locales/{zh-CN,zh-TW,ja,en}.yml` の4ファイルを管理。`zh-CN.yml` を基准とし、新規文言は4ファイル同時に追加 |
| プラットフォーム分岐 | プロセス、ウィンドウ、通知、パスは3プラットフォームすべてを考慮し、`#[cfg(target_os)]` で分岐 |
| 子プロセスの生成 | Windows では必ず `CreateNoWindow` を付与し、黒画面のフラッシュを防止 |
| ロギング規約 | `tracing` クレートを使用し、`log/{date}_launcher.txt` へ出力。`println!` は使用禁止 |
| バージョン同期 | リリース時は `Cargo.toml`、`tauri.conf.json`、`CHANGELOG.md` の3箇所を同期 |
| デプロイ構成 | 6つの `deploy.*.yaml` は実行時設定ファイルであり、修正時は `-cn` バリアントとの整合性を維持 |

## <DocIcon name="flask" /> テストの実行

```bash
cargo check --locked --all-targets
cargo test --locked --all-targets
cargo test --locked backend_process::tests
```

CI ワークフロー（`test.yml`）は Linux、macOS、Windows x64/ARM64 上で自動実行され、リリース署名鍵なしで通過可能です。

## <DocIcon name="map" /> 開発者向け関連ドキュメント

<ul class="ap-linklist">
<li><a href="/ja/launcher/developer/architecture">Tauri と Rust アーキテクチャ<span class="desc">ウィンドウ・プロトコル・トレイ</span></a></li>
<li><a href="/ja/launcher/developer/backend-lifecycle">バックエンドプロセスのライフサイクル<span class="desc">Job Object とプロセス回収</span></a></li>
<li><a href="/ja/launcher/developer/update">更新パイプラインとミラー<span class="desc">git・uv・mTLS</span></a></li>
<li><a href="/ja/launcher/developer/build-release">ビルドとリリース<span class="desc">3プラットフォーム向けビルド</span></a></li>
</ul>
