---
title: ユーティリティタスク
description: システム設定、退役と強化、コンディション（士気）管理、ログとドロップ記録、スキャン、ベンチマーク、半自動ツール。
updated: 2026-10-20
---

# ユーティリティタスク

「ツール」グループ配下のタスクはゲーム内資材を直接産出するものではなく、各種データのスキャン、パフォーマンステスト、半自動タップ補助、またはシステム全体の共通挙動を制御する役割を担います。システム設定（`Alas`、`General`、`Restart`）も特定のゲームコンテンツに依存しないため、本ページで併せて解説します。

## <DocIcon name="settings" /> システム基本設定（`Alas`）

### <DocIcon name="monitor" /> エミュレーターとエラー処理

| グループ名 | 主要フィールド | 機能と役割 |
| --- | --- | --- |
| `Emulator` | `Serial`、`PackageName`、`ScreenshotMethod`、`ControlMethod` | デバイス接続設定。[エミュレーター接続](/ja/azurpilot/user/device)を参照 |
| `Error` | `HandleError`、`StrictRestart`、`TaskRestartLimit`、`LowPushMode` | エラーリカバリ方針およびプッシュ通知条件 |
| `Optimization` | `OcrDevice`、`ScreenshotInterval`、`TaskHoardingDuration`、`WarmupEnable` | 推論デバイス、画面取得ペース、まとめ実行、プリヒート |
| `EmulatorManagement` | `ScheduledEmulatorRestart`、`RestartIntervalHours`、`DeepRestartAfterFailures` | 定期再起動および強制ディープ再起動 |
| `Backup` | `Enable`、`KeepDays` | 日次自動バックアップ |
| `DailySummary` | `Enable`、`TriggerTime` | デイリーサマリー日報の集計と送信 |
| `DropRecord` | `SaveFolder`、`RetentionDays`、各ドロップ記録スイッチ | ドロップ画面の保存と統計 |

### <DocIcon name="gift" /> ドロップ記録（`DropRecord`）

海域出撃、研究、委託、大世界、指揮ニャ箱などから得られたドロップ画面をスクリーンショットおよび構造化ログとして保存します。`RetentionDays` で保持日数を制御し、期限切れデータは自動的に圧縮または削除されます。

## <DocIcon name="pencil" /> 全般共通設定（`General`）

### <DocIcon name="circle-off" /> 自動退役（`Retirement` / `OneClickRetire` / `OldRetire`）

| 設定項目 | 説明 |
| --- | --- |
| `Retirement.RetireMode` | 退役方式の選択（一括退役 / レガシーな1隻ずつ選択） |
| `OneClickRetire.KeepLimitBreak` | 限界突破が完了していない艦船を保護保持 |
| `OldRetire.N/R/SR/SSR` | 各レアリティごとの退役対象指定 |
| `OldRetire.RetireAmount` | 1回あたりに退役させる最大隻数 |

スクリプト側の退役ロジックは、ゲーム内の一括退役設定と整合している必要があります。

::: danger 退役操作は元に戻せません
初回設定時は誤退役を防ぐため、`RetireAmount` を 1 に設定して少数の艦船でテストを行い、選択される対象が意図通りであることを必ず確認してください。
:::

### <DocIcon name="zap" /> 自動強化（`Enhance`）

| 設定項目 | 説明 |
| --- | --- |
| `ShipToEnhance` | 強化対象とする艦船の指定 |
| `Filter` | 強化素材として消費するノーマル艦船のフィルタ |
| `KeepCommonCV` | コモン軽空母・空母を素材にせず保護（別用途用） |

### <DocIcon name="sparkles" /> コンディション（士気）共有管理（`PublicEmotion`）

複数の出撃タスク間で艦隊の疲労度（コンディション）を共有管理します：

| 設定項目 | 説明 |
| --- | --- |
| `Enable` | コンディション管理を有効化 |
| `Tasks` | 管理対象とする出撃タスク |
| `FleetValue` / `FleetRecord` | 艦隊コンディションの計算値と推移 |
| `FleetRecoveryState` / `FleetRecover` | 回復状態の判定と待機ポリシー |
| `FleetOath` / `FleetOnsen` | ケッコン補正および温泉枠の反映 |

疲労度が危険水準に達した場合、タスクは自律的にスリープ待機に入り、好感度低下を防ぎます。

### <DocIcon name="badge-dollar" /> 燃料調整と優先度設定

| 設定項目 | 説明 |
| --- | --- |
| `OilControl.Enable` / `Target` | 標準スケジュール下での燃料自動消費調整（デフォルト無効、目標値 24000） |
| `YukikazeTaskManager.TaskPriorityAdjustment` | カスタムタスク優先順位（1行に1つのコマンド名を記述） |

## <DocIcon name="clock" /> 実行タイミングパラメータ（`RunParams`）

システムが異常と判定するまでの待機タイムアウトを微調整するグループです：

| グループ名 | 主要フィールド | デフォルト値 | 役割 |
| --- | --- | --- | --- |
| `Watchdog` | `CheckInterval` | 30 秒 | 実行監視スレッドの検査周期 |
| `Reboot` | `Tries` | 3 回 | ゲーム起動リトライ回数 |
| `Reboot` | `FirstTryWaitSeconds` | 30 秒 | 初回起動時の描画待機時間 |
| `Device` | `Mumu12StopWaitTimeout` | 60 秒 | MuMu12 停止時の確認待機時間 |

マシンスペックが低くエミュレーターの起動に時間がかかる場合は、異常検知機能を無効化するのではなく、`Reboot` の待機時間を長めに調整してください。

## <DocIcon name="search" /> 情報収集・スキャン系ツール

### 艦隊スキャン（`FleetScan`）

現在ゲーム内で編制されている艦隊情報を読み取り、「艦隊情報」画面に出力します。ゲーム側の状態は一切変更しません。

### <DocIcon name="brain" /> メンタルユニット計算用ドックスキャン（`MindCalculatorScan`）

1280×720 解像度でドック画面を端から自動スクロールして艦船名とレベルを走査し、メンタルユニット計算機用のデータを出力します。

- 実行時にドックの絞り込みフィルタが自動リセットされます。
- 認識が不確実な艦船が存在する場合は警告を出力し、不完全なデータ保存を防ぎます。

### <DocIcon name="medal" /> 艦隊技術スキャン（`FleetTechScan`）

全所持艦船のレベルと限界突破状態をスキャンし、「艦隊技術」画面で技術ポイントの集計を行います。

### <DocIcon name="crown" /> 指揮ニャ才能評価（`MeowfficerScore`）

| 設定項目 | 説明 |
| --- | --- |
| `Source` / `Folder` | 画像取得元（エミュレーター画面またはローカルフォルダ） |
| `MaxImages` / `ScanLimit` | スキャンする最大件数 |
| `ReportPath` | 評価レポートの出力先パス |

指揮ニャのアビリティ（才能）を自動認識し、一般的な攻略セオリーに基づきスコアを算出してレポートを出力します。

## <DocIcon name="hand" /> 半自動操作・補助ツール

| タスク名 | 用途 | 留意点 |
| --- | --- | --- |
| `Daemon` | 半自動タップ補助：海域進入や戦闘開始のみを手動で行い、道中の単調タップを代行 | スクリプト未対応の特殊海域の攻略に最適 |
| `OpsiDaemon` | セイレーン作戦半自動：修理や特定敵選択を代行 | プレイヤーの目視確認を前提とした運用 |
| `EventStory` | イベントストーリーの自動スキップ送り | 会話イベントのみを高速回収 |
| `BoxDisassemble` | 装備箱の自動一括開封 | 金/紫/青箱ごとの開封上限を設定可 |
| `EmulatorManager` | エミュレーターの手動再起動コマンド実行 | SSH によるリモート再起動にも対応 |

### <DocIcon name="shield" /> 規制解除（`AzurLaneUncensored`）

クライアント内の特定アセットファイルを差し替えて規制解除を行います。ゲームファイルの改変を伴うためアカウント規約上のリスクがあり、自動化の動作とは直接関係ありません。利用の可否は自己責任で判断してください。

## <DocIcon name="flask" /> ベンチマークテスト

| タスク名 | 用途 |
| --- | --- |
| `Benchmark` | スクリーンショットおよび操作バックエンドの遅延・FPS 測定 |
| `OcrBenchmark` | OCR エンジンの推論速度テスト（CPU/GPU/NPU の選定支援） |

ベンチマーク実行時は、正確な測定結果を得るために他の並行タスクやインスタンスを停止してください。
