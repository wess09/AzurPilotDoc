---
title: Android 開発者ポータル
description: Android ホストのビルド環境構築：JDK/NDK 要件、初回ビルドコマンド、自己検証手順、Logcat デバッグ手法、リポジトリ構成。
updated: 2026-10-20
---

# Android 開発者ポータル

このリポジトリは **Android ホスト**であり、ゲームロジックそのものではありません。ホスト側の改修を行う際は、Kotlin/Compose、JNI、PRoot セッション、Runtime rootfs イメージの4つのレイヤーを常に意識する必要があります。

## <DocIcon name="laptop" /> 開発環境要件

| ツール | 必要バージョン / 詳細 |
| --- | --- |
| Android Studio | プロジェクトのロードとデバッグ |
| JDK | 17（JVM ターゲット） |
| Android SDK | `compileSdk 37` / `targetSdk 36` / `minSdk 28` |
| NDK + CMake | 3.22.1（`libbridge.so` のコンパイル用） |
| Git | **完全なコミット履歴が必須**。バージョン番号がコミット数から算出されるため、シャロークローンでは誤計算されます |
| uv | Python スクリプトの実行および rootfs テストの実行 |
| adb | アプリのインストール、Logcat 採取、ポートフォワーディング |

Windows 環境での留意点：

- `python3` は Microsoft Store のプレースホルダーである可能性があるため、まず `python --version` で実体を特定してください。
- Python の `subprocess` 経由で呼び出される `bash` は Git Bash ではなく WSL にルーティングされる場合があります。Python スクリプトは `uv run` で実行してください。
- シェルスクリプトは Git Bash で実行し、`tools/watch-android-logs.ps1` は PowerShell で実行してください。

## <DocIcon name="package" /> 初回ビルド手順

```bash
git clone https://github.com/wess09/AzurPilot-for-Android.git
cd AzurPilot-for-Android/app

# Kotlin のみコンパイル（rootfs の存在検証をスキップ）
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# 軽量 debug パッケージのビルド（rootfs なし）
./gradlew assembleDebug -Pazurpilot.slimApk=true
```

ビルド成果物は `app/app/build/outputs/apk/debug/` に生成されます。

### なぜビルドが失敗するのか

`verifyBundledAzurPilotRuntime` タスクは `app/app/src/main/assets/rootfs/` 配下に `rootfs.tar.xz`（300 MB 以上）および `BUILD_MANIFEST` が存在するかを検証します。これらは CI の生成成果物であり、リポジトリにはコミットされていません。ローカル環境でこれらが欠落している場合、ランタイムを欠いた不完全な APK の生成を防ぐため、すべての `package*` / `assemble*` タスクは明示的に失敗します。

解決策（いずれかを選択）：

- CI のビルド成果物から `rootfs-<abi>` をダウンロードし、`assets/rootfs/` 配下に配置する。
- `-Pazurpilot.slimApk=true` フラグを付与して検証をスキップする。

また、x86_64 用の proot ライブラリもリポジトリに含まれていないため、必要な場合は以下を実行してください：

```bash
bash app/scripts/fetch-proot-libs.sh
```

arm64 のみをビルドしたい場合は、`app/local.properties` に `build.debugAbi=arm64-v8a` を記述してください。

## <DocIcon name="circle-check" /> 日常的な検証コマンド

| 変更領域 | 実行コマンド |
| --- | --- |
| Kotlin / Compose / AIDL | `cd app && ./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime` |
| ネイティブブリッジ / CMake | `cd app && ./gradlew assembleDebug -Pazurpilot.slimApk=true` |
| rootfs オーバーレイレイヤー | `uv run --with psutil python -m unittest discover -s rootfs/tests` |
| 文言リソース | `python app/scripts/check_i18n_strings.py` |
| Shell / PowerShell ツール | 構文チェックを行った上で、検証用実機上で制限付き実行 |

::: danger :app:testDebugUnitTest は実行しないでください
テストソースセット内に独立した孤立テストが存在しコンパイルが通りません。Kotlin コードの構文・型正当性は `compileDebugKotlin` で検証してください。これはリポジトリ内で合意された明確な開発ルールです。
:::

## <DocIcon name="smartphone" /> 実機インストールとデバッグ

```bash
adb install -r -d app/app/build/outputs/apk/debug/app-debug.apk

# logcat の監視
adb logcat -v time --pid=$(adb shell pidof com.azurpilot.ghio)

# WebUI ポートのフォワーディング
adb forward tcp:25548 tcp:25548
```

ログファイルの格納先：

| ファイル | 記録内容 |
| --- | --- |
| `files/log/app.log` | アプリシェル全体のログ（Timber 出力） |
| `files/log/proot/session.log` | PRoot の標準出力/標準エラー出力および WebUI ログ |
| `debug/embedded_adb_launch.log` | 内蔵 ADB 起動パイプラインのログ |

実機ストレージパス：`/sdcard/Android/data/com.azurpilot.ghio/files/log/`。

## <DocIcon name="folder" /> リポジトリ構成

```text
AzurPilot-for-Android/
├── app/
│   ├── app/                 # メインモジュール：Compose UI、proot、privileged、bridge
│   ├── adb-runtime/         # 内蔵 Shizuku-m の ADB ランタイム
│   ├── download-core/       # OkHttp ダウンローダー（セグメント取得・検証）
│   ├── build-logic/         # Gradle 規約プラグイン（SDK、ABI、署名、R8）
│   ├── annotation-api/      # @PrefSchema アノテーション
│   ├── ksp-processor/       # 設定アクセサーの自動生成
│   ├── hidden-api/          # コンパイル時 hidden API スタブ
│   ├── navigation-runtime/  # 画面遷移アニメーション
│   └── miuix-runtime/       # Miuix スタイルアダプター
├── rootfs/                  # overlay、seeds、ビルドスクリプト、ゲスト OS テスト
├── server/                  # device-report、remote-access ゲートウェイ
├── tools/                   # 実機テストおよびベンチマークスクリプト
├── doc/                     # 設計仕様およびプロトコル定義ドキュメント
└── docs/screenshots/        # 公式スクリーンショット
```

## <DocIcon name="shield" /> 厳格な設計ルール

| ルール | 制定理由 |
| --- | --- |
| ネイティブライブラリは必ず `lib*.so` と命名し `jniLibs` / `prootLibs` に配置 | targetSdk 35+ において `execve` が許可される唯一の領域であるため |
| PRoot セッションは必ず stdin をオープンに保つ | stdin のクローズが親プロセス死亡通知プロトコルであるため |
| `GetLockedPixels` と `UnlockPixels` を厳密にペアで呼び出す | ロックされたフレームバッファポインタはアンロック後に即時無効化されるため |
| 入力操作コードと JNI 登録関数名は改変禁止 | 言語間をまたぐバイナリ ABI であるため |
| 設定キー名は `camelToSnakeCase` を使用 | `@PrefSchema` の自動生成規則に準拠 |
| 文言追加時は必ず `values/`（zh-CN 基軸）を先行改定 | 他言語のリソースはここから派生生成されるため |
| 新規依存関係はインターフェースを定義してから DI モジュールにバインド | Compose と JNI が直接結合するのを防止するため |

## <DocIcon name="map" /> 開発者向けドキュメントマップ

| ドキュメント | 主題 |
| --- | --- |
| [ホストアーキテクチャ](/ja/android/developer/architecture) | レイヤー構造、モジュール設計、プロセス境界 |
| [Runtime と PRoot](/ja/android/developer/runtime) | セッション管理、デプロイ状態マシン、ホットアップデートトランザクション |
| [特権サービスとネイティブブリッジ](/ja/android/developer/privileged) | ADB/Root、AIDL、JNI、仮想ディスプレイ |
| [OCR と画像認識パイプライン](/ja/android/developer/ocr) | `:ocr` 独立プロセス、NPU 加速、共有メモリ |
| [ビルド・署名・リリース](/ja/android/developer/build-release) | バージョニング、署名設定、CI マトリクス、配布マニフェスト |

リポジトリ内にはさらに詳細な `doc/` ドキュメントが存在します：

```text
doc/architecture.md             アーキテクチャとゲートウェイ
doc/module-reference.md         責務別ソースコードマップ
doc/privileged-bridge-protocol.md
doc/runtime-provisioning.md
doc/hot-update.md
doc/release-channel.md
doc/multi-arch.md
doc/ocr-acceleration.md
doc/development-guide.md
```

## <DocIcon name="flask" /> 改修時の最小検証項目

| 改変範囲 | 必須検証手順 |
| --- | --- |
| Kotlin / Koin / Compose | `compileDebugKotlin` |
| ネイティブブリッジ / CMake | `assembleDebug -Pazurpilot.slimApk=true` |
| rootfs Python コード | `unittest discover -s rootfs/tests` |
| UI テキスト | `check_i18n_strings.py` |
| 特権 / フローティング / ウィジェット / 保活 | **実機でのフル回帰テスト ＋ 画面キャプチャの目視確認** |

エミュレーター上での通過やビルド通過だけでは、メーカー製端末特有の OEM 挙動差異を担保できません。
