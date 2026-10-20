---
title: AzurPilot for Android
description: スマートフォン実機で AzurPilot をローカル実行：Kotlin ホスト ＋ PRoot Linux Runtime ＋ 仮想画面、またはリモートクライアントとしての利用。
updated: 2026-10-20
---

# AzurPilot for Android

Android 版は単なる「スマホ用の簡易版」ではありません。Python 3.14、各種依存関係、OCR モデル、WebUI フロントエンドを含む**完全なコアプログラム**を APK 内に内包し、PRoot により Root 権限不要の環境下で稼働させ、バックグラウンドの仮想ディスプレイ上でゲームを自動周回させます。

<div class="ap-meta">
<span><b>リポジトリ</b> wess09/AzurPilot-for-Android</span>
<span><b>ブランチ</b> main</span>
<span><b>対象 OS</b> Android 9.0 以降（API 28）</span>
<span><b>アーキテクチャ</b> ARM64-v8a / x86_64</span>
<span><b>ライセンス</b> AGPL-3.0</span>
</div>

![AzurPilot for Android ホーム画面](/img/android-home.jpg)

<Figure caption="Android ホストのホーム画面：Runtime の状態、インストールエントリ、ローカル/リモートモードの切り替え。画像出典：Android リポジトリ docs/screenshots。" />

## <DocIcon name="smartphone" /> 2つの異なる利用形態

| 動作モード | ゲームの動作環境 | 本機 Runtime | 必要権限 | 適用シナリオ |
| --- | --- | --- | --- | --- |
| **ローカル実行** | スマートフォン本体 | 必要 | 内蔵 ADB または Root アクティベーションが必要 | 常時起動 PC がない、または旧端末を周回専用機にしたい場合 |
| **リモートクライアント** | 他のマシン（自宅 PC 等） | 不要 | 不要 | スマートフォンから自宅 PC 上のインスタンスを確認・操作したい場合 |

::: warning 2つのモードの混同にご注意ください
リモートクライアントモードでは端末内の Runtime は起動せず、Shizuku 等のアクティベーションも不要です。`AzurPilotGateway` を外部インスタンスの接続先に向け、ネイティブ UI で操作するクライアント機能です。詳細は[リモートクライアントとしての利用](/ja/android/user/remote-client)を参照してください。
:::

## <DocIcon name="box" /> レイヤー構造

<AndroidStack />

<Figure caption="App シェル層が Runtime の stdin を保持し、stdin のクローズにより Runtime プロセスグループ全体を一括回収して孤児プロセスの残存を防止します。" />

| レイヤー | 採用技術 | 責務と役割 |
| --- | --- | --- |
| App シェル層 | Kotlin + Compose (Material / Miuix) | 画面 UI、Runtime デプロイ管理、ゲートウェイ購読、フローティングウィンドウ |
| PRoot | jniLibs ネイティブライブラリ一式 | Root 不要のシステムコールエミュレーション |
| Runtime | Ubuntu 24.04 + Python 3.14 | アップストリームのコアプログラムおよび WebUI の実行環境 |
| 特権サービス | app_process + AIDL + JNI | 仮想ディスプレイの生成、画面キャプチャ、タッチイベントの注入 |
| OCR ワーカープロセス | `:ocr` 独立プロセス | 推論 API（`127.0.0.1:22302`）の提供 |

3つのプロセス境界：

- <DocIcon name="monitor" /> **メインプロセス**：Compose UI、設定管理、ゲートウェイ通信。
- <DocIcon name="brain" /> **`:ocr` プロセス**：LiteRT / MNN 推論ライブラリを実行。万一クラッシュしてもメイン画面は影響を受けません。
- <DocIcon name="lock-keyhole" /> **特権プロセス**：内蔵 ADB、Shizuku、または Root により起動され、仮想ディスプレイとネイティブブリッジを管理。

## <DocIcon name="zap" /> 機能一覧

| 機能 | 詳細 |
| --- | --- |
| バックグラウンド仮想画面 | 独立した Virtual Display 上でゲームを動作させ、実画面は他のアプリを自由に使用可能 |
| フローティング操作 | 画面上のオーバーレイパネルからタスクの開始・停止、キュー確認、ログ閲覧が可能 |
| 内蔵コンソール | 端末単体で完全な WebUI を描画・操作可能（PC 不要） |
| OCR ハードウェア加速 | Qualcomm QNN、MediaTek NeuroPilot、HiSilicon HiAI 対応（失敗時は CPU フォールバック） |
| 高速フレーム転送 | 共有メモリ ＋ SCM_RIGHTS による転送。実測 15.6 ms（TCP 経由の 47.2 ms から大幅短縮） |
| スクリーンセーバー | 画面焼き付き防止用の黒画面低輝度セーバー（30秒後から10秒おきに16dp微小ドリフト移動） |
| デュアル更新 | APK と Runtime を個別に更新可能。スクリプト単体であればトランザクション保護下でのホットアップデートに対応 |
| ログエクスポート | ホスト側と業務側のログを分離管理。7日間自動ローテーション、ワンタップで ZIP 出力 |

## <DocIcon name="clipboard" /> 動作環境要件

| 項目 | 最低要件 | 推奨環境 |
| --- | --- | --- |
| OS | Android 9.0（API 28） | Android 12〜15 |
| アーキテクチャ | ARM64-v8a / x86_64 | ARM64-v8a |
| ストレージ | 空き 2.5 GB 以上 | 5 GB 以上 |
| メモリ | 4 GB | 6 GB 以上 |
| 権限 | 内蔵 ADB ワイヤレスペアリング / Root / 外部 Shizuku | 内蔵 ADB |

32ビット専用端末には非対応です。x86_64 は主に PC 上のエミュレーター用であり、一般的な実機は ARM64 です。

## <DocIcon name="download" /> インストールパッケージの選び方

| パッケージ種別 | Runtime 内包 | 初回起動時の動作 | 適用対象 |
| --- | --- | --- | --- |
| 完全版 APK | 内包あり | ローカルで 1〜3 分で展開完了（通信不要） | 初回インストール時（推奨） |
| 軽量増分 APK | なし | 初回起動時に約 1 GB の Runtime をダウンロード | すでに完全版を導入済みで、ホストコードのみ更新する場合 |

軽量版 APK を上書きインストールした場合、既存の Runtime や設定データはそのまま維持されます。

## <DocIcon name="monitor" /> 主要画面

![AzurPilot for Android 概要](/img/android-overview.jpg)

<Figure caption="Runtime 概要画面：インスタンスのステータス、スケジューラー、WebUI へのエントリ。" />

| 画面 | 主な機能 |
| --- | --- |
| ホーム | Runtime の状態確認、ダウンロード/展開、起動および停止 |
| 周回 | 仮想画面のプレビュー、インスタンス選択、タスク開始/停止 |
| コンソール | 内蔵 WebUI による完全な設定・タスク管理 |
| ログ | ホストログとスクリプトログの閲覧、ZIP エクスポート |
| 設定 | 外観テーマ、ダウンロードソース、保活設定、OCR、スクリーンセーバー、リモート接続設定 |

ダークテーマおよび Material / Miuix の2種類のデザインスタイルに対応しています。詳細は[コンソール・フローティング・スクリーンセーバー](/ja/android/user/console)を参照してください。

## <DocIcon name="map" /> 関連マニュアル

<ul class="ap-linklist">
<li><a href="/ja/android/user/install">インストールとアーキテクチャ選択<span class="desc">APK・アーキテクチャ・配布元</span></a></li>
<li><a href="/ja/android/user/first-run">初回起動と Runtime<span class="desc">展開・権限付与・初インスタンス</span></a></li>
<li><a href="/ja/android/user/activation">権限のアクティベーション<span class="desc">内蔵 ADB・Root・外部 Shizuku</span></a></li>
<li><a href="/ja/android/developer/architecture">ホストアーキテクチャとモジュール<span class="desc">モジュールとプロセス境界</span></a></li>
</ul>
