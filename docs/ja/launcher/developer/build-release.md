---
title: ビルドとリリース
description: ランチャーの3プラットフォーム向けビルド手順、ビルド時環境変数、CI ビルドマトリクス、成果物の配布形式。
updated: 2026-10-20
---

# ビルドとリリース

ランチャーの配布パッケージは単純な単一バイナリではありません。Python、uv、git、adb をアーカイブ内にあらかじめ内包し、「展開するだけで即座に稼働可能」な状態を実現しています。

## <DocIcon name="laptop" /> ローカルビルド手順

```bash
cargo build              # デバッグビルド
cargo build --release    # リリースビルド（LTO ＋ strip、バイナリサイズ最適化）
cargo tauri dev          # 開発時実行
cargo check --locked --all-targets
cargo test --locked --all-targets
```

### ビルド時注入パラメータ

| 環境変数名 | 役割 | 未設定時の動作 |
| --- | --- | --- |
| `ALAS_BOOTSTRAP_UV` | 内包する uv バイナリのパス | 実行時にシステムの PATH 内の uv にフォールバック |
| `ALAS_LAUNCHER_MTLS_IDENTITY_PEM_B64` | 自己自動更新用 mTLS 証明書 | ルートの `证书.txt` を探索。欠落時は自己更新無効 |
| `LAUNCHER_UPDATE_URL` | 更新マニフェスト URL の上書き | デフォルトの `launcher-api.azurpilot.com` を使用 |

一般的なローカル開発では `ALAS_BOOTSTRAP_UV` のみを設定し、自己自動更新のテストはスキップします。

::: danger Windows ローカル実行時の UAC プロンプト
`build.rs` によりマニフェスト内に `requireAdministrator` が埋め込まれます。プロセス管理関連のコードをテストする際は、必ず管理者権限で実行されたターミナルを使用してください。
:::

## <DocIcon name="cloud" /> CI パッケージングワークフロー

`.github/workflows/package.yml` は Git タグのプッシュまたは手動トリガーにより実行されます：

| ステージ | 実行内容 |
| --- | --- |
| バージョン検証 | タグは `2.0.6` 形式である必要があります（`v2.0.6` は拒否されます）。手動実行時はパラメータで指定 |
| 依存関係の準備 | OS プラットフォームごとに Python、git、adb、uv をキャッシュから展開 |
| ビルド | `cargo build --release`（ランナーごとに独立してキャッシュ管理） |
| アーカイブ作成 | `tar.xz` 形式（プリセット 9 ＋ extreme 圧縮） |
| リリース公開 | GitHub Release へ成果物をアップロードし、更新マニフェストを配信 |

3プラットフォームのマトリクスビルドが実行され、OS と CPU アーキテクチャごとに国際版と `-cn` 版が生成されます：

```text
AP-<OS>-<arch>.tar.xz
AP-CN-<OS>-<arch>.tar.xz
```

Windows 環境向けには別途 Inno Setup によるインストーラー（`install.iss`、管理者権限、簡体字中国語）も生成されます。

## <DocIcon name="flask" /> テストワークフロー

`.github/workflows/test.yml` は `main` へのプッシュ、PR 作成時、手動トリガー時に自動実行されます：

| 対象プラットフォーム | 実行コマンド |
| --- | --- |
| Linux / macOS / Windows x64 / ARM64 | `cargo check --locked --all-targets` |
| 同上 | `cargo test --locked --all-targets` |

リリース署名鍵を必要としないため、Fork リポジトリ上でもそのまま動作します。

## <DocIcon name="refresh" /> バージョン番号の同期

リリース前には必ず以下の3箇所でバージョン番号を一致させてください：

```text
Cargo.toml           version = "2.2.5"
tauri.conf.json      "version": "2.2.5"
CHANGELOG.md         対応するバージョンの更新履歴
```

::: warning バージョン番号不一致の影響
`tauri.conf.json` に記載されたバージョン番号はパッケージメタデータおよび自動更新の比較に使用されます。`Cargo.toml` のみを書き換えると、「アップデートしたのに依然として新版の通知が出る」または「インストールしてもバージョン表記が変わらない」といった不具合が発生します。
:::

Git タグの命名規則として `v` プレフィックスは使用できません。タグ名は `v2.2.5` ではなく `2.2.5` としてください。

## <DocIcon name="package" /> 配布成果物一覧

| 成果物名 | 用途 |
| --- | --- |
| `AP-*.tar.xz` | 国際版。展開するだけで即座に利用可能 |
| `AP-CN-*.tar.xz` | 中国本土ミラー版 |
| Windows インストーラー | スタートメニュー登録やアンインストーラーを含むインストーラー |
| `stable.json` | 自動更新用マニフェスト |
| ランチャーペイロード | Cloudflare R2 ＋ CNB Release 上のアーカイブ |

マニフェストは Cloudflare の静的アセットとしてホスティングされ、ダウンロードエントリは 302 リダイレクトにより実体に誘導されます。

## <DocIcon name="circle-check" /> リリース前チェックリスト {#发布检查清单}

- [ ] `Cargo.toml` / `tauri.conf.json` / `CHANGELOG.md` のバージョン番号が完全に一致していること
- [ ] `cargo check --locked --all-targets` をパスすること
- [ ] `cargo test --locked --all-targets` をパスすること（管理者権限ターミナルで実行）
- [ ] 3プラットフォームそれぞれで起動確認を行い、環境自律構築が成功することを確認
- [ ] Windows で UAC ダイアログおよびシステムトレイの挙動を確認
- [ ] macOS で `xattr` 解除後の初回起動が正常に行えることを確認
- [ ] Linux で `libwebkit2gtk-4.1` 依存関係が正常に解決されることを確認
- [ ] 国際版および CN 版の双方でダウンロード元の疎通を確認
- [ ] 自己自動更新機能：旧バージョンから新バージョンが検出され正常に置換されることを確認
- [ ] ロールバック機能：旧バージョンのアーカイブで上書き後も正常に起動できることを確認
- [ ] ランチャー終了後もエミュレーターが道連れ終了せず稼働を継続すること（プロセスライフサイクル）
- [ ] アンインストール時に不要なレジストリエントリが残存しないことを確認（自動起動設定を除く）

## <DocIcon name="megaphone" /> リリース完了後の対応

| アクション | 説明 |
| --- | --- |
| `stable.json` の更新 | 自己自動更新が新バージョンを検出できるようにマニフェストを更新 |
| R2 および CNB へのアップロード | 両方の配布元ストレージに成果物を配置 |
| 302 リダイレクトの検証 | `launcher-download` が正しいペイロードへリダイレクトされることを確認 |
| Issue の監視 | リリース初日に報告される起動障害やクラッシュの監視 |

## <DocIcon name="monitor" /> プラットフォーム別留意事項

| プラットフォーム | 注意事項 |
| --- | --- |
| Windows | WebView2 の要件、UAC 権限昇格、Toast 通知、`CREATE_NO_WINDOW` フラグの適用 |
| macOS | コード署名なしの挙動、WKWebView の仕様、`additionalBrowserArgs` の非サポート |
| Linux | glibc の互換性、`libwebkit2gtk-4.1` の要件、デスクトップ環境ごとのトレイ実装差異 |

プロセス、ウィンドウ、通知に関連するプラットフォーム固有の実装は、`cargo check` のみで済ませず、実機または対応する CI ランナー上で必ず動作検証を行ってください。
