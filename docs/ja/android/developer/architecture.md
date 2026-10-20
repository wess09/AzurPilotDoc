---
title: ホストアーキテクチャとモジュール
description: App シェル層、PRoot Runtime、特権サービス、ゲートウェイプロトコルのレイヤー分離、責務別ソースコードマップ。
updated: 2026-10-20
---

# ホストアーキテクチャとモジュール

<AndroidStack />

## <DocIcon name="box" /> レイヤー構造

| レイヤー | 実行プロセス | 主要クラス | 責務と役割 |
| --- | --- | --- | --- |
| App シェル層 | メインプロセス | `AzurPilotApp`、`MainActivity`、`AppRoot` | 初期化、Compose UI、Runtime 制御 |
| デプロイ管理 | メインプロセス | `RootfsProvisioner` | 初回デプロイ、整合性検証、環境更新 |
| PRoot | 子プロセス | `ProotHost` | セッション起動、クラッシュバックオフ、stdin 保活 |
| ゲートウェイ | メインプロセス | `AzurPilotGateway` | 唯一の `/api/v1/ws` 購読者 |
| 特権サービス | 独立プロセス | `RemoteServiceImpl`、`bridge/` | 仮想ディスプレイ、画面キャプチャ、入力注入 |
| OCR | `:ocr` プロセス | プライベートバインドサービス | 推論 API の提供 |

## <DocIcon name="rocket" /> 起動シーケンス

```text
Application.onCreate
  → メインプロセスのみ完全な初期化を実行（:daemon は最小限の初期化のみ）
  → 設定のロード（DataStore）
  → postCreate で依存順に従い常駐サービスを順次起動
      → ログシステムのセットアップ
      → 権限マネージャー（ADB / Root / Shizuku のプローブ）
      → Runtime 制御の初期化（rootfs 既存時）
      → フローティングウィンドウ / 保活マネージャー / フォアグラウンドサービス
```

Activity はスプラッシュ表示、エッジトゥエッジ描画、常時点灯の制御のみを担当します。業務状態は ViewModel / repository / StateFlow が管理し、Activity 内には状態を保持しません。

## <DocIcon name="settings" /> 依存性注入（Koin）

Koin の設定はドメインごとに分割定義されています：

| モジュール名 | バインドされるサービス |
| --- | --- |
| `CoreModule` | アプリケーションスコープのシングルトン、クロック、ディスパッチャー |
| `HostModule` | ホスト制御サービス、設定ストア |
| `LogModule` | ログライター |
| `OverlayModule` | フローティングウィンドウおよびスクリーンセーバー |
| `PrivilegedModule` | 権限マネージャー、リモートサービス接続 |
| `ProvisionModule` | デプロイメントマネージャー |
| `ProotModule` | PRoot セッションおよびリポジトリ |
| `ViewModelModule` | 各画面の ViewModel |

新規依存関係を追加する際は、必ずインターフェースまたはポートを先に定義してからモジュールに登録してください。`AppCoroutineScope` はプロセスレベルの監視スコープであり、UI のライフサイクルに紐づく処理を配置してはなりません。

## <DocIcon name="map" /> ソースコードマップ

### Runtime と PRoot 関連

| 責務 | エントリポイント | 制約事項 |
| --- | --- | --- |
| 初回デプロイとアップグレード | `provision/RootfsProvisioner.kt`、`RuntimeArch.kt` | rootfs はイミュータブルな成果物であり、ABI 別に配信 |
| PRoot セッション管理 | `proot/ProotHost.kt` | App が stdin を保持。stdin の切断＝Runtime プロセスグループの回収シグナル |
| 実行制御 | `proot/AzurPilotRunController.kt` | 起動・停止ステートマシンの制御 |
| ゲートウェイ | `proot/AzurPilotGateway.kt` | 唯一の購読者（上流の購読プロトコルは全体置換セマンティクス） |
| 設定編集 | `proot/AzurPilotConfigEditor.kt` | リモート設定の書き込み制御 |
| オーバーレイとシード | `rootfs/overlays/`、`rootfs/seeds/` | 互換性の差異のみを吸収し、ユーザー設定を上書きしない |

### 特権サービスとネイティブブリッジ

| 責務 | エントリポイント | 制約事項 |
| --- | --- | --- |
| バックエンド選択と認可 | `privileged/PermissionManager.kt` | 統合ステートマシン。期限切れ接続は Binder ID に基づいて破棄 |
| Shizuku 接続 | `privileged/RemoteServiceManager.kt` | 外部接続と内蔵接続の2経路 |
| Root 起動 | `root/RootServiceStarter.kt` | `app_process` ＋ ワンタイムトークンによるコールバック検証 |
| 特権 IPC | `remote/RemoteServiceImpl.kt` | 仮想ディスプレイ、ウィンドウ/電源、ブリッジサービスを統括 |
| JNI ブリッジ | `bridge/`、`native/bridge.h` | フレームロックおよび操作コードは厳格なバイナリ ABI |
| Root ランチャー | `native/launcher.c` | 必ず `liblauncher.so` としてビルド出力 |

### 設定と UI レイヤー

| 責務 | エントリポイント | 制約事項 |
| --- | --- | --- |
| アプリケーション設定 | `settings/AppSettings.kt` | `@PrefSchema` により snake_case キーを自動生成 |
| ユーザー構成 | `config/UserConfigurationStore.kt` | 独立した JSON DataStore（アプリ設定と混在させない） |
| Compose UI 画面 | `ui/settings/`、`ui/azurpilot/`、`ui/logs/` | 状態は VM / repository から一方向データフローで受給 |
| フローティングとセーバー | `overlay/` | 独立した Window。Activity の設定値は参照不可 |
| ホームウィジェット | `widget/` | 明示的な drawable リソースを使用し、`?attr` 動的属性に依存しない |

### 常駐保活とログ

| 責務 | エントリポイント |
| --- | --- |
| フォアグラウンドサービス | `service/RunForegroundService.kt` |
| 多重経路保活マネージャー | `keepalive/KeepAliveManager.kt` |
| ログシステム | `log/`、`constant/AppPaths.kt` |

保活サブシステムは何度でも繰り返し開始・停止が可能である必要があり、ユーザー設定のスイッチが最終判定となります。レシーバーやサービスが DI を経由しない経路で起動される可能性があるため、制御されたプロセスレベルのエントリを使用します。

## <DocIcon name="plug" /> ゲートウェイプロトコル

Runtime は `127.0.0.1:25548` において以下の3系統のインターフェースを公開します：

| インターフェース | 認証方式 | 用途 |
| --- | --- | --- |
| `/api/v1/ws` | セッショントークン | インスタンス、ダッシュボード、設定、ログ、統計 |
| `/android/*` | `X-AzurPilot-Android-Token` | ホストアプリ専用の薄型制御インターフェース |
| `/healthz` | なし | 稼働ヘルスチェック |

ポート番号は `deploy.yaml` の `WebuiPort` から取得されます。設定が変更された場合、アプリは次回の Runtime 起動時に新ポートを読み取り、ゲートウェイおよび制御接続先を同期して切り替えます。

単一の WebSocket 購読者しか許可されない理由：上流のイベント購読仕様が**全体置換セマンティクス**であるため、2つ以上の購読者が存在するとトピックを互いに消去し合ってしまいます。すべての UI 画面および業務ロジックは `AzurPilotRepository` の StateFlow を介してデータを共有します。

## <DocIcon name="refresh" /> 2つの更新チャネル

| チャネル | 更新対象 | 配布形式 |
| --- | --- | --- |
| App（APK） | ホストコード、UI、ネイティブブリッジ | 軽量 APK（デュアル ABI、rootfs なし） |
| Runtime | rootfs、Python、各種ライブラリ | `rootfs-<abi>.tar.xz` |

これらに加え、`uv.lock` に変更がない場合にソースコードと WebUI のみを置き換える「スクリプトホットアップデート」が提供されています。

## <DocIcon name="shield" /> 開発時のアーキテクチャ境界

| 禁止事項 | 理由 |
| --- | --- |
| Compose から JNI や `app_process` を直接呼び出す | 境界を越えるとテストやエラー復旧の制御が破綻します |
| PRoot の親子関係をバックグラウンド化で切り離す | 親プロセスの死亡検知プロトコルが失われ、ゾンビプロセスが残存します |
| 通常プロセスでセキュリティ検査無効の Context を使用する | 特権昇格の漏洩につながります |
| 入力操作コードの番号変更、JNI 登録名の勝手な改変 | 言語間をまたぐバイナリ ABI が破壊されます |
| フローティングパネルが Activity の状態を読めると仮定する | フローティングは完全に独立したシステム Window です |

## <DocIcon name="circle-plus" /> 新機能の追加手順

1. まず既存のアーキテクチャ境界（ポート、リポジトリ、StateFlow）を特定。
2. 実装レイヤー側で機能を追加。
3. 既存のインターフェースを経由して UI レイヤーへ露出。
4. 最小検証を実施：Kotlin コンパイル、ネイティブビルド、実機回帰テスト。

新しいレイヤー境界の追加が避けられない場合は、スレッド制約とライフサイクル制約を KDoc に明記した上で実装してください。
