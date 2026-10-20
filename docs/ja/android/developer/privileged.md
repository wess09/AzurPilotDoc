---
title: 特権サービスとネイティブブリッジ
description: 内蔵 ADB、Root、外部 Shizuku の3つのバックエンド実装、AIDL インターフェース、JNI ABI、仮想ディスプレイと SDK 画面回収。
updated: 2026-10-20
---

# 特权服务与原生桥

特権サービスがなければ、ホストアプリは画面の閲覧や操作を行えません：仮想ディスプレイの生成、フレームバッファの取得、タッチイベントの注入にはすべて Android の shell レベルの権限が必要です。このレイヤーは Android 版において最もセキュリティ要件が高く、注意を要する領域です。

## <DocIcon name="box" /> 3つのバックエンド実装

| バックエンド | 起動方式 | 認証方式 | プロセスの生存期間 |
| --- | --- | --- | --- |
| 内蔵 ADB | `adb shell app_process` | ワイヤレスデバッグペアリング ＋ RSA | 端末再起動まで |
| Root | `su -c app_process` | Superuser 認可 | 常駐 |
| 外部 Shizuku | Shizuku ユーザーサービス | マネージャーアプリによる認可 | マネージャーに依存 |

`PermissionManager` は外部に対して**Binder を含まないステートプロジェクション**を公開します：UI は「未アクティベート / アクティベート中 / 準備完了 / 失敗」のステートのみを監視し、生の Binder オブジェクトを直接保持しないため、古い接続の残存リークを防ぎます。プロセスの死亡通知は Binder ID に基づいて安全に処理されます。

### 内蔵 ADB の実装詳細

[shizuku-m](https://github.com/wess09/shizuku-m)（Apache-2.0、commit `bcb2b62`）をベースに移植されています：

```text
ワイヤレスデバッグペアリング（SPAKE2 認証）
  → RSA 鍵の生成・再利用（Android Keystore AES-GCM 暗号化）
    → adb connect 127.0.0.1:5555
      → app_process を介して RemoteServiceImpl を起動
        → ブートストラッププロバイダ経由で Binder をコールバック注入
          → shell UID およびワンタイムトークンを厳密に照合検証
```

主要な設計方針：

- **汎用の Shizuku サービスは公開しない**。認証済みの shell を使用して本プロジェクト自身のサービスのみを起動し、他アプリへの権限委譲は行いません。
- **Context-only での初期化**。`ShellServiceStarter` は MediaTek 端末特有の `LoadedApk.makeApplication` へのシステムフックをバイパスし、MTK 端末での起動時クラッシュを防止します。
- **`setsid` によるセッション分離完了後に復帰**。これを行わないと、起動用 adb コマンドの終了と同時に立ち上げたサービスが道連れ終了されてしまいます。
- **ワンタイムトークンによる保護**。タイムアウト、キャンセル、アンバインド時に即時失効し、App プロセスが死亡した際は特権子プロセスも確実に終了されます。

::: danger 5555 ポートの取り扱い
システムの adbd がポート 5555 で待機している場合、同一 LAN 内からアクセス可能になるリスクがあります。クライアントは常に `127.0.0.1` にのみ接続しますが、公共ネットワーク等で不要にワイヤレスデバッグを常時開放し続けないよう注意してください。
:::

### Root バックエンドの実装

`RootServiceStarter` は `app_process` を介してサービスを起動し、Binder コールバック時は root/shell UID とワンタイムトークンのみを承認します。

`RootUserService` はセキュリティ検査をバイパスする特殊な Context を保持しますが、これは**特権子プロセス内にのみ限定して保持**され、通常のアプリプロセスへ漏洩させてはなりません。この Context を主プロセスへ戻すような改変は重大な脆弱性となります。

## <DocIcon name="plug" /> プロセス間通信とインターフェース

```text
メインプロセス ──AIDL──▶ 特権プロセス（RemoteServiceImpl）
                            ├── 仮想ディスプレイ管理
                            ├── ウィンドウ / 電源制御
                            ├── ブリッジ画面キャプチャ（libbridge.so）
                            └── 入力注入（libbridge.so）
```

| 境界 | 遵守すべきルール |
| --- | --- |
| AIDL | アプリ側は定義されたポートのみを経由して呼び出し、hidden API を直接叩かない |
| JNI | `libbridge.so` は特権プロセス内部でのみロード・実行 |
| フレームロック | `GetLockedPixels` と `UnlockPixels` は厳密にペアで呼び出し解放 |
| 入力操作 | 操作コードおよび JNI 登録関数名は言語間のバイナリ ABI であり、変更禁止 |
| ランチャーバイナリ | `launcher.c` は必ず `liblauncher.so` としてビルド（`nativeLibraryDir` への配置要件） |

::: warning フレームバッファポインタの生存期間
`GetLockedPixels` が返却したメモリポインタは、`UnlockPixels` を呼び出した瞬間に無効化されます。このポインタをフレームを跨いでキャッシュして再利用すると、不正メモリ参照やクラッシュの原因になります。
:::

## <DocIcon name="monitor" /> 仮想ディスプレイ（Virtual Display）

仮想ディスプレイはバックグラウンド周回の中核機能です：

- ゲームの Activity は専用の Virtual Display 上で実行され、端末の実画面は完全に自由に使用可能です。
- 描画フレームは共有メモリパイプライン（Unix 抽象ドメインソケット ＋ `SCM_RIGHTS` によるファイルディスクリプタ共有）を経由してホストへ転送されます。
- 入力イベントはブリッジ経由で仮想ディスプレイに直接注入されるため、実画面のタップ操作と干渉しません。

実測フレーム遅延：匿名共有メモリ方式で約 15.6 ms（従来の TCP ソケット経由の 47.2 ms と比較して大幅に低遅延）。データは RAM 上でのみ受け渡され、ストレージへの書き込みは発生しません。

### SDK ログイン画面の自動回収（Repatriation）

一部のカスタム ROM では、外部 SDK のログイン画面、年齢確認、課金決済用の Activity が強制的に実画面（デフォルトディスプレイ）へリダイレクトされる挙動が存在します。`SdkTaskRepatriator` はゲーム稼働中にこれらの画面を検知し、自動的に仮想ディスプレイ側へ引き戻します。

これは各社端末の OEM 挙動に深く依存するパッチであり、改変時はエミュレーターではなく実機での動作検証が必須となります。

## <DocIcon name="shield" /> セキュリティ境界

| 攻撃対象面 | 防御設計 |
| --- | --- |
| Binder コールバック | root/shell UID ＋ ワンタイムトークンのみを承認 |
| ペアリングコード | 当該操作時のみ一時使用。永続化およびログ記録の禁止 |
| RSA 秘密鍵 | Android Keystore の AES-GCM により暗号化。クラウドバックアップから除外 |
| 外部サービス連携 | 既存の認可範囲をそのまま流用し、不必要な特権昇格を行わない |
| デバッグポート | クライアントはローカルループバックのみに接続。利用終了後の無効化を推奨 |

## <DocIcon name="circle-check" /> 単体テストと検証手順

```bash
cd app

# Kotlin コードのコンパイル検証
./gradlew compileDebugKotlin -x verifyBundledAzurPilotRuntime

# ADB ランタイム単体テスト
./gradlew :adb-runtime:testDebugUnitTest

# 実機統合テスト（実機接続が必要）
./gradlew :app:connectedDebugAndroidTest -PembeddedAdbTestsOnly=true

# ネイティブブリッジのビルド
./gradlew assembleDebug -Pazurpilot.slimApk=true
```

実機テストのカバー範囲：暗号化キーの永続化、プラットフォーム TLS exporter、SPAKE2 ペアリングの正常系と異常系エラー拒否、shell UID の検証、ネイティブブリッジ、仮想ディスプレイの生成、アンバインドと再接続、サービス異常終了からの復旧。

## <DocIcon name="clipboard" /> 改修時チェックリスト

- [ ] 新規バックエンドが `PermissionManager` をバイパスせず統一ステートマシンに統合されているか
- [ ] Binder コールバックで UID とワンタイムトークンが検証されているか
- [ ] フレームバッファのロックが必ず対になって解放されているか
- [ ] 入力操作コードの定義が不変に維持されているか
- [ ] ネイティブライブラリが `lib*.so` 形式で出力されているか
- [ ] 単なるコンパイル確認だけでなく、実機上で動作検証を行ったか
- [ ] MediaTek、Xiaomi、Huawei などのメーカー製端末固有の差異を点検したか
