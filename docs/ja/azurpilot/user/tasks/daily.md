---
title: デイリーとリソース
description: 委託、研究（科研）、寮舎、指揮ニャ、大艦隊、デイリー任務、演習、ショップ、開発ドックの設定と報酬受取ロジック。
updated: 2026-10-20
---

# デイリーとリソース

日常系タスクの特徴は、1回あたりの所要時間が極めて短く、失敗時のリスクも軽微である一方、実行を怠ると長期的損失が蓄積することです。すべて有効化し、サーバーの日付更新時刻に合わせてスケジュールすることを推奨します。

## <DocIcon name="gift" /> 一括回収（`Reward`）

メイン画面上から回収可能な資材・報酬をまとめて受領します。

| 設定項目 | 説明 |
| --- | --- |
| `CollectOil` | 燃料（石油）の回収 |
| `CollectCoin` | 資金の回収 |
| `CollectExp` | 経験値パックの回収 |
| `CollectMission` | 達成済み通常任務報酬の受取 |
| `CollectWeeklyMission` | ウィークリー任務報酬の受取 |

すべて有効化しておくことを推奨します。最も安全なタスクであり、導入直後の動作テストに最適です。

## <DocIcon name="scroll" /> 委託（`Commission`）

| 項目 | 詳細 |
| --- | --- |
| 用途 | 委託の自動派遣・完了受取。高価値な委託を自動判定 |
| 前提条件 | レベル到達により委託枠がアンロックされていること |
| 主要設定 | `PresetFilter`（プリセット選択）、`DynamicProgramming`（動的計画法による最適委託選定）、`DoMajorCommission`（大型委託の実施可否） |
| 高度な設定 | `TierValueRatio`、`DelayHalfLife`、`DeadlineFutureHorizon`（時間対効率の調整） |
| 通知機能 | `CommissionNotifyReward`、`DetectShipDrop`、`GemNotify`（ダイヤ委託等のプッシュ通知） |
| 動作検証 | 委託画面で新しい艦隊が派遣中になり、ログに受取と派遣が記録されること |

`NoFreeShipPolicy` および `AutoPickShip` はドック枠が圧迫された際の挙動を制御します。ドック容量に余裕がない場合は必ず設定してください。

## <DocIcon name="flask" /> 研究（`Research`）

| 項目 | 詳細 |
| --- | --- |
| 用途 | 研究プロジェクトの選定、完了受取、次期プロジェクトの即時開始 |
| 前提条件 | 科学研究室がアンロックされており、実行枠に空きがあること |
| 主要設定 | `UseCube`（キューブ消費の許可）、`UseCoin`（資金消費の許可）、`UsePart`（強化パーツ消費の許可） |
| プロジェクト選定 | `PresetFilter`（例：「指向解析優先」）、`CustomFilter`（カスタム条件） |
| 遅延待機 | `AllowDelay`（より良質なプロジェクトの出現を待つためにあえて空転を許可） |
| 動作検証 | 研究キューにプロジェクトがセットされ、ログに残余時間が表示されること |

::: tip ダイヤ消費設定はありません
`UseCube` はメンタルキューブを消費して短時間で完了させるプロジェクトの許可フラグであり、ダイヤ消費ではありません。無償・有償を問わずダイヤを自動消費する設定は存在しません。
:::

## <DocIcon name="brain" /> 戦術教室（`Tactical`）

| 設定項目 | 説明 |
| --- | --- |
| `TacticalFilter` | 優先して訓練したいスキルを指定 |
| `RapidTrainingSlot` | 快速訓練スロットを使用するかどうか |
| `SkillAutoSwitch` | スキル Lv が最大に達した際に自動で次のスキルへ切り替え |
| `ControlExpOverflow` | 教科書の経験値オーバーフロー制御（T4/T3/T2/T1 ごとに許可設定可） |
| `AddNewStudent` | スキル訓練完了時にドックから生徒を自動補充（`MinLevel` / `MaxLevel` で対象制限） |

## <DocIcon name="sparkles" /> 寮舎（`Dorm`）

| 設定項目 | 説明 |
| --- | --- |
| `Collect` | 寮舎のコインおよび好感度ハートの回収 |
| `Feed` | 食料の自動補充 |
| `FeedFilter` | 投入する食料の優先順位 |
| `ReserveFood` | 備蓄として残しておく食料の最低数 |
| `BuyFood` | 食料が尽きた場合の自動購入 |
| `BuyFurniture.Enable` | 快適度向上のための家具の自動購入（任意） |

食料切れは経験値獲得の停止に直結するため、`ReserveFood` は過度に高く設定しすぎないようにしてください。

## <DocIcon name="crown" /> 指揮ニャ（`Meowfficer`）

| 設定項目 | 説明 |
| --- | --- |
| `BuyAmount` | 毎日購入するネコ箱の数量 |
| `FortChoreMeowfficer` | 要塞や探索等で使用する指揮ニャの割り当て |
| `MeowfficerTrain.Enable` | 指揮ニャの自動訓練 |
| `MeowfficerTrain.Mode` | 訓練方針の指定 |
| `ScoreTalents` / `ScoreThreshold` | アビリティ（才能）のスコア評価に基づき基準値以下を整理 |
| `MaxFeedLevel` | 強化合成時の上限レベル |

## <DocIcon name="handshake" /> 大艦隊（`Guild`）

| 設定項目 | 説明 |
| --- | --- |
| `GuildLogistics.Enable` | 兵站補給任務の自動受託および提出 |
| `GuildLogistics.SelectNewMission` | 新規補給任務の自動選択 |
| `GuildOperation.Enable` | 大艦隊作戦への自動参加 |
| `GuildOperation.AttackBoss` | ボス拠点への自動攻撃 |
| `JoinThreshold` | 作戦に参加する最低人数の閾値 |

大艦隊に未加入の場合や権限がない場合は、これらのサブ機能をオフにしてください。

## <DocIcon name="zap" /> メンタル覚醒（`Awaken`）

| 設定項目 | 説明 |
| --- | --- |
| `LevelCap` | 覚醒目標とするレベル上限（Lv 105, 110, 115, 120 等） |
| `Favourite` | お気に入り登録された艦船のみを優先覚醒 |

メンタルユニットを消費して上限開放を行います。素材不足時は自動でスキップされます。

## <DocIcon name="user-check" /> 秘書艦（`Secretary`）

秘書艦の好感度を監視し、目標値に達した時点で自動的に次の艦船へローテーションします。

| 設定項目 | 説明 |
| --- | --- |
| `CustomFilter` | 交代候補となる艦船のフィルタ |
| `LowFavorabilityPriority` | 好感度の低い艦船を優先配属 |
| `FavouriteOnly` | お気に入り艦船のみを対象とする |
| `CheckInterval` | 好感度チェックの間隔 |
| `BackupEnable` | 元の秘書艦をバックアップ退避 |

## <DocIcon name="target" /> 作戦委託（`OperationHandover`）

作戦委託書を消費して作戦委託を一括消化します。

| 設定項目 | 説明 |
| --- | --- |
| `Count` | 1回あたりに消費・消化する委託数 |
| `UseHandoverBook` | 委託書を使用するかどうか |
| `ConsumeAllBook` | 所持している委託書を全消化（曜日や時刻を指定可） |
| `OilLimit` | 燃料下限値 |

## <DocIcon name="package" /> 倉庫統計（`StorageStatistics`）

倉庫内の金・虹色の特定素材アイテムを定期スキャンし、所持数を統計データベースへ記録します。

- デフォルトは無効（有効化時は7日ごとに自動実行、手動実行も可）。
- アイテムは一切消費せず、閲覧・計数のみを行います。

## <DocIcon name="calendar" /> デイリー任務（`Daily`）

| 設定項目 | 説明 |
| --- | --- |
| `UseDailySkip` | デイリー挑戦の即時完了チケットを使用 |
| `EscortMission` / `EscortMissionFleet` | 商路護衛および担当艦隊 |
| `AdvanceMission` / `AdvanceMissionFleet` | 海域掃討および担当艦隊 |
| `FierceAssault` / `FierceAssaultFleet` | 強襲作戦および担当艦隊 |
| `TacticalTraining` / `TacticalTrainingFleet` | 戦術研修および担当艦隊 |
| `SupplyLineDisruption` | 通商破壊潜水艦戦 |
| `ModuleDevelopment` | 特殊装備開発素材クエスト |

ゲーム内の「毎日」タブの各コンテンツに対応します。特定の項目で失敗する場合は、一度手動でクリアして編成を確認してください。

## <DocIcon name="circle-alert" /> ハード海域（`Hard`）

| 設定項目 | 説明 |
| --- | --- |
| `HardStage` | 周回対象のハード海域番号（例：12-4） |
| `HardFleet` | 出撃艦隊 |

1日の回数制限（通常3回）をサーバー更新後に消化します。編成条件（艦種制限・ステータス制限）を満たしているか事前に確認してください。

## <DocIcon name="medal" /> 演習（`Exercise`）

| 設定項目 | 説明 |
| --- | --- |
| `OpponentChooseMode` | 対戦相手の選択ロジック（戦力最低優先、勝率優先等） |
| `OpponentTrial` | 事前にお試し対戦を実施するかどうか |
| `ExerciseStrategy` | 攻撃陣形と戦術 |
| `DelayUntilHoursBeforeNextUpdate` | リセット直前まで実行を遅延（強敵回避） |
| `LowHpThreshold` | 撤退・リセット判定用 HP 閾値 |

## <DocIcon name="trophy" /> 限界挑戦（`LimitChallenge`）

毎月開催される限界挑戦海域を目標難易度まで順次攻略します。

| 設定項目 | 説明 |
| --- | --- |
| `TargetLevel` | 目標とする難易度レベル |
| `Month` / `CompletedLevel` / `AttemptedLevel` | 進捗状態（自動管理） |

あらかじめゲーム内で専用の限界挑戦用編成を組んでおく必要があります。

## <DocIcon name="badge-dollar" /> 各種ショップ（購買部）

### <DocIcon name="badge-dollar" /> 補給ショップ（`ShopFrequent`）

| 設定項目 | 説明 |
| --- | --- |
| `Enable` | 有効化 |
| `UseGems` | ダイヤ商品の購入許可（原則オフ推奨） |
| `Refresh` | 無料更新枠の利用 |
| `ConsumeCoins` | 資金の消費許可 |
| `Filter` | 購入対象アイテムの優先度リスト |

### <DocIcon name="box" /> 定期交換ショップ（`ShopOnce`）

大艦隊ショップ、勲章ショップ、演習功勲ショップ、コアショップを一括処理します：

```text
GuildShop / MedalShop2 / MeritShop / CoreShop
```

`BuyUnobtainedShip` を有効にすると、図鑑未登録の艦船を優先的に交換します。

### <DocIcon name="wrench" /> 開発ドック（`Shipyard`）

| 設定項目 | 説明 |
| --- | --- |
| `ResearchSeries` | 対象とする特別計画艦の期数（PR1〜PR6 等） |
| `ShipIndex` | 対象艦船 |
| `BuyAmount` | 強化ユニットの購入数量 |

## <DocIcon name="circle-plus" /> デイリー建造（`Gacha`）

| 設定項目 | 説明 |
| --- | --- |
| `Pool` | 対象建造プール（小型、大型、特型など） |
| `Amount` | 建造回数（デイリー消化時は 1 回） |
| `UseTicket` | 建造支援チケットの使用優先 |

## <DocIcon name="circle-dollar" /> 無料配布・ログインボーナス（`Freebies`）

| 項目 | 処理内容 |
| --- | --- |
| `BattlePass.Collect` | クルーズパス報酬の一括受取 |
| `DataKey.Collect` | 作戦履歴データキーの毎日補充受取 |
| `Mail.*` | メールボックスの受取と自動整理 |
| `SupplyPack.Collect` | 定期無料補給パックの受領 |

## <DocIcon name="video" /> ミニゲーム（`Minigame`）

ゲーム内イベント等でミニゲームチケットが溢れないよう、上限に達する前に自動でミニゲームを消化します。

## <DocIcon name="sparkles" /> ケッコン・温泉（`PrivateQuarters`）

| 設定項目 | 説明 |
| --- | --- |
| `BuyRoses` / `BuyCake` | プレゼント用アイテムの購入 |
| `TargetInteract` / `TargetShip` | 交流対象の指定 |

## <DocIcon name="lightbulb" /> 推奨されるタスク実行パイプライン

```text
Reward → Commission → Research → Dorm → Meowfficer → Guild
      → Daily → Hard → Exercise → ShopFrequent → ShopOnce → Freebies
```

この順序で組むことで、資材受取後に建造やショップ購入が行われ、画面遷移の無駄な往復を最小限に抑えることができます。
