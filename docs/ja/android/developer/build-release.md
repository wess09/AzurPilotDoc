---
title: ビルド・署名・リリース
description: Android ホストのバージョン採番規則、署名構成、CI ビルドマトリクス、配布マニフェストとミラー設定。
updated: 2026-10-20
---

# ビルド・署名・リリース

Android 版のリリースは「1つのソースコードベースから複数の配布成果物を生成する」パイプラインを採用しています：ABI 別の完全版 APK、デュアル ABI の軽量版 APK、ABI 別の Runtime rootfs パッケージが、単一の固定 Release タグ配下に集約されて配信されます。

## <DocIcon name="package" /> ビルド成果物の種類

| 成果物名 | ビルド用 Gradle 引数 | 含まれる内容 |
| --- | --- | --- |
| 完全版 APK（単一 ABI） | `assembleRelease -Pazurpilot.releaseAbi=<abi>` | 対象 ABI の rootfs を内包 |
| 完全版 APK（デュアル ABI） | `assembleRelease` | ABI 引数を省略（全アーキテクチャを含む） |
| 軽量版 APK | `assembleDebug/Release -Pazurpilot.slimApk=true` | rootfs なし、デュアル ABI |
| Runtime パッケージ | CI ワークフロー `rootfs.yml` | `rootfs-<abi>.tar.xz` ＋ `BUILD_MANIFEST` |

```bash
cd app
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime
./gradlew assembleDebug -Pazurpilot.slimApk=true
./gradlew assembleRelease -Pazurpilot.releaseAbi=arm64-v8a
```

Release ビルドでは R8 難読化・コード縮小が有効化されます。`assembleRelease` の末尾では自動的に `verifyReleaseR8Keeps` が実行され、リフレクションや JNI のエントリポイントが誤って削除されていないかを検証します。

## <DocIcon name="medal" /> バージョン番号の採番規則

| 項目 | 算出ルール |
| --- | --- |
| `versionCode` | 当該リポジトリの HEAD コミットのタイムスタンプ（緊急時は `APP_VERSION_CODE` で手動固定可） |
| `versionName` | `1.<series>.<X>`（`X = 総コミット数 − ベースライン`） |
| ベースライン | `GitVersion.kt` 内で定義され、CI の `resolve` ステップと同一の計算式を使用 |

::: warning 2箇所の同期必須
`GitVersion.kt` のベースライン定義と、`.github/workflows/rootfs.yml` 内の正規表現・計算式は必ずセットで更新してください。片側のみを変更するとローカルビルドと CI のバージョン番号にズレが生じます。リポジトリ文書内に古い履歴が残っている場合がありますが、**現行の `GitVersion.kt` の記述を正とします**。
:::

CI では `git diff --quiet "$app_commit" HEAD -- app` を実行し、Android プロジェクト側のソースに変更があるかを判定します：

- 変更なし → 既存のリリース済み App バージョン番号を維持し、Runtime のみ新規ビルドして公開可能。
- 変更あり → `versionCode = max(旧値 + 1, HEAD タイムスタンプ)` を算出し、新バージョンとしてビルド。

「App のコードに変更がない」ことと「Runtime の再ビルドが不要である」ことは同義ではありません。上流のコミット更新や rootfs ビルドスクリプトの変更によっても成果物の再構築がトリガーされます。

## <DocIcon name="key" /> 署名鍵の設定

| シナリオ | 使用するキーストア | 概要 |
| --- | --- | --- |
| Release | 外部保護されたキーストア（GitHub Secrets より注入） | v1 ＋ v2 ＋ v3 署名をすべて適用 |
| Debug | リポジトリ内にコミットされた `debug.keystore` | 異なる開発機間でビルドされた debug パッケージの相互上書きを担保 |

4つの設定変数：`KEYSTORE_PATH` / `KEYSTORE_PASSWORD` / `KEY_ALIAS` / `KEY_PASSWORD`。環境変数の設定が優先され、`app/local.properties` がフォールバックとして参照されます。

キーストアが設定されていない場合、release タスクは未署名パッケージを生成します。ビルド自体は成功しますが端末へのインストールは拒否されるため、コンパイル検査用としてのみ機能します。

::: danger 署名鍵の不一致＝アンインストール必須
`INSTALL_FAILED_UPDATE_INCOMPATIBLE` が発生した場合、既存データを引き継ぐことはできません。debug ビルドと release ビルドを切り替える前には、必ず設定データをエクスポートしてください。
:::

## <DocIcon name="cloud" /> CI リリースパイプライン

`.github/workflows/rootfs.yml` は、`main` へのプッシュまたは手動ディスパッチにより起動します：

| ステージ | 実行タスク |
| --- | --- |
| `resolve` | 上流 AzurPilot の最新コミットを取得し、差分を比較してビルドスキップ可否を判定 |
| `build` | ABI マトリクスに従い、ネイティブランナー上で rootfs を構築（`rootfs/build/build-azurpilot.sh`） |
| `apk` | `fetch-proot-libs.sh` を実行後、ABI 別の完全版 APK および汎用軽量版 APK を生成 |
| `publish` | 固定タグ `azurpilot-android-latest` に成果物をアップロードし、`latest.json` を更新 |

また、上流リポジトリの更新を定期監視する `.github/workflows/check-upstream.yml` も配備されています。

### ローカル環境での Release パッケージ再現手順

1. 成功した CI 実行結果から `rootfs-<abi>` 成果物をダウンロード。
2. `rootfs.tar.xz` と `BUILD_MANIFEST` を `app/app/src/main/assets/rootfs/` に配置。
3. `KEYSTORE_*` 関連の署名設定を構成。
4. `cd app && ./gradlew assembleRelease -Pazurpilot.releaseAbi=arm64-v8a` を実行。

## <DocIcon name="clipboard" /> 配布マニフェスト（latest.json）

固定 Release に配置される `latest.json` のスキーマ：

| フィールド名 | 説明 |
| --- | --- |
| `versionCode` / `versionName` | 最新 App 本体のバージョン情報 |
| `appCommit` | APK がビルドされたコミットハッシュ |
| `azurpilotCommit` | Runtime 内に内包されている上流コミット |
| `androidHostCommit` | Runtime を構築した際のホスト側コミット |
| `apkUrl` / `apkSha256` / `apkSize` | 汎用軽量版 APK の取得先と検証情報 |
| `updateApks.<abi>` | ABI 別軽量版 APK の配布情報 |
| `runtimes.<abi>` | ABI 別 Runtime rootfs の配布情報 |
| `fullApks.<abi>` | ABI 別完全版 APK の配布情報 |
| `rootfs*` | 旧版アプリ向けの後方互換フィールド（常に arm64 を参照） |

互換性配慮：旧バージョンのアプリはフラットな `rootfs*` キーのみを参照するため、これらのエントリは常に有効な状態を維持する必要があります。

## <DocIcon name="smartphone" /> マルチアーキテクチャのサポート

| ABI | 主な用途 | 留意事項 |
| --- | --- | --- |
| `arm64-v8a` | 実機スマートフォン・タブレット | 最も主要なビルド対象 |
| `x86_64` | PC 上のエミュレーター環境 | proot ライブラリの個別取得が必要 |

32ビット（armeabi-v7a 等）はサポート外です。詳細は `doc/multi-arch.md` を参照してください。

## <DocIcon name="download" /> ミラーと配布ネットワーク

- GitHub および CNB の双方が固定タグを同期維持し、ファイルサイズおよび SHA-256 は完全一致します。
- 新規インストール時のデフォルトダウンロードソースは `cnb` に設定されています。
- 設定画面には5つの ghproxy 形式のミラーがプリセットされており、カスタムプレフィックスの指定も可能です。
- `gh-proxy.net` は CAPTCHA チャレンジ画面を返すため利用できません。

## <DocIcon name="settings" /> ビルドプロファイル（build profiles）

`doc/build-profiles.md` にはパッケージング構成や身元識別情報の上書き方法が定義されています。パッケージ名のサフィックスを変更したプロファイルを使用する場合は、`tools/watch-android-logs.ps1` 内の `$package` 変数も同期して変更してください。

## <DocIcon name="circle-check" /> リリース前チェックリスト

- [ ] `GitVersion.kt` と CI のバージョン計算式が完全に一致していること
- [ ] `Cargo.toml` や `tauri.conf.json` は対象外（これらはランチャー用）
- [ ] `CHANGELOG.md` が更新されていること
- [ ] rootfs が対象 ABI ごとに正常にビルドされていること
- [ ] 完全版 APK と軽量版 APK の双方が正しく出力されていること
- [ ] apksigner による署名検証を通過していること
- [ ] `latest.json` の各フィールドが欠落なく記述され、後方互換フィールドが arm64 を指していること
- [ ] 少なくとも1台の ARM64 実機と1台の x86_64 エミュレーターでインストールおよび起動検証を通過していること
- [ ] ホットアップデート判定 API が期待通りのレスポンス（`enabled` / `requiresRuntimeUpdate`）を返すこと
