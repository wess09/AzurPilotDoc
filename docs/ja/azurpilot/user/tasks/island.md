---
title: 島開発計画
description: 赤石計画（島開発）全 17 種のタスク：シーズン設定、5店舗の自動経営、農園・牧場、製造、デイリー採掘、真珠取引。
updated: 2026-10-20
---

# 島開発計画

島開発（ゲーム内コンテンツ「赤石計画」、タスクグループ `Island`）は、独立したシミュレーション経営型コンテンツです：農業、牧畜、鉱山採掘、店舗経営、デイリー注文の消化。通常出撃やセイレーン作戦と異なり燃料（石油）を消費しませんが、UI 操作体系や画像認識リソースは完全に専用のものが使用されます。

## <DocIcon name="clipboard" /> 事前準備と前提条件

- ゲーム内で島開発コンテンツがアンロックされていること。
- 現在のゲーム内シーズンと `IslandPlan.Season` の設定が一致していること（シーズン切り替えに伴い商品や移動ルートが変化します）。
- 一部のタスクはドラッグ操作を伴うため、操作方式として `minitouch`、`MaaTouch`、`uiautomator2`、または `azurpilot_android` のいずれかが必要です（標準 `ADB` は非対応）。

::: tip まず「全体構成（IslandPlan）」を実行してください
`IslandPlan` は単なる周回タスクではなく、選択された各巡回ルートを島内で実際に走破し、**キャラクターが障害物に引っかからずに目的地へ到達できるかを事前検証**します。検証完了後、タスクは翌日まで自動遅延されます。
:::

## <DocIcon name="settings" /> 全体構成（`IslandPlan`）

| 設定項目 | 説明 |
| --- | --- |
| `Season` | 現在のゲーム内シーズン設定（商品とマップ座標に影響） |
| `IslandWalk.*` | 各ポイントへの移動経路スイッチ（空中投下、デイリー採取地、真珠港など） |
| `IslandWalk.*Enable` | 当該ルートの移動検証を行うかどうか |

シーズン切り替え時は、まずこの全体構成を実行して各移動ポイントへの到達可能性を再検証してください。

## <DocIcon name="box" /> 店舗経営モジュール（`IslandBusiness`）

島内の5店舗を自動管理します：レストラン、カフェ、バーベキュー、軽食店、ドリンクスタンド。

| 設定項目 | 説明 |
| --- | --- |
| `BatchEnabled` | 分割経営モード（1回あたりの所要時間を短縮） |
| `Batch1Shops` / `Batch2Shops` | グループごとの担当店舗割り当て |
| `SeasonalReplaceEnabled` / `SeasonalThreshold` | シーズン限定メニューへの自動差し替え |
| `IslandBusinessShop1..5` | 各店舗の店員配置（`Char1/2`）および提供メニュー（`Product1..5`） |
| `BoostReplaceFilter` | バフ効果に応じたメニュー自動変更 |

各店舗の商品は 1 → 8 の順序で生産され、前段の目標数量が達成されて初めて次段の生産へ移行します。

## <DocIcon name="sparkles" /> 農園・果樹園・苗床（`IslandFarm`）

3種類の耕作地を管理します：

| サブグループ | 主要フィールド | 管理内容 |
| --- | --- | --- |
| `IslandFarm` | `Positions`、`WorkerFilter`、`MinFarm`、`PlantPotatoes` | 通常農園と作業員の配属 |
| `IslandOrchard` | `MinOrchard`、`IgnoreAvocado`、`PlantRubber` | 果樹園とゴムの栽培 |
| `IslandNursery` | `MinNursery`、`IgnorePineapple`、`PlantLavender` | 苗床とラベンダーの栽培 |

`Min*` は最小保持下限数であり、在庫がこの数値を下回った際に自動で再作付けが行われます。

## <DocIcon name="circle-check" /> 牧場（`IslandRancher`）

家畜への自動給餌と畜産物の自動回収。対象の飼育スロットがアンロックされており、飼料が十分に確保されている必要があります。

## <DocIcon name="drive" /> 鉱山・林場（`IslandMineForest`）

鉱石の採掘と木材の伐採を自動化します。道具の耐久値がゼロになった場合は自動停止するため、ゲーム内で適宜補充してください。

## <DocIcon name="wrench" /> 製造業（`IslandManufacture`）

| 項目 | 詳細 |
| --- | --- |
| 用途 | レシピに基づき中間素材・高次加工品を製造 |
| 前提条件 | レシピ開放済み、十分な原材料の確保 |
| 主要設定 | 製造キューと目標生産数量 |
| 動作検証 | 製造ラインにタスクが入り、倉庫素材が増加すること |
| 留意点 | 原材料が不足すると空転するため、農園や鉱山とセットで運用 |

## <DocIcon name="calendar" /> デイリー採取（`IslandDailyGather`）

管理手帳の採取タブをシミュレート操作し、毎日の採掘・伐採を自動完了します。

- 実行タイミング：**深夜 03:10** および **夕方 18:00**。
- 操作手順：採取対象選択 → スイッチ切替 → 担当キャラ配属 → 出発。

## <DocIcon name="gift" /> 空中投下補給（`IslandAirDrop`）

自身の島の物資箱を回収し、さらにフレンドの島を巡回して支援物資を回収します。

## <DocIcon name="package" /> 貨物準備（`IslandCargoPreparation`）

島外への貨物輸送注文を自動納品します：

1. 完了済み貨物便の報酬を受取。
2. 牛乳など枯渇しやすいブラックリスト指定物資の納品を回避。
3. 納品可能な資材を積載して発送。

## <DocIcon name="scroll" /> デイリー注文（`IslandDailyOrder`）

注文タイプ（緊急 / 挑戦 / 簡単）を自動判別し、指定資材を納品します。

::: warning 「標準」注文の非サポート
「標準」タイプの注文は自動処理されません。当日提示された注文が標準タイプのみの場合はスキップされます。
:::

## <DocIcon name="clipboard" /> 住民・施設インタラクト（`IslandDailyInteract`）

4種類のデイリー交流操作を代行：

- 猫のブラッシング（ふれあい）
- JUU 急便の配達
- 商業エリアへのデリバリー代行
- ウィークリー写真撮影ミッション

## <DocIcon name="badge-dollar" /> 週次真珠取引（`IslandPearlSell`）

毎週火曜日の **01:00** に真珠の売買を自動執行します：当週の真珠を購入し、既存の真珠を高値で売却。

| 設定項目 | 説明 |
| --- | --- |
| `BuyPrice` / `SellPrice` | 売買を実行する価格しきい値 |
| `BuyNextRun` / `NextPearlTradeTime` | 次回取引時刻（自動管理） |
| `DailyPriceRefresh` | 毎日の価格変動データの取得 |

::: danger 最低所持金の要件
真珠の買い付けには、最低でも 200×220 コイン相当の十分な所持資金が必要です。資金不足時はエラーとなります。
:::

## <DocIcon name="lightbulb" /> 推奨されるタスク有効化順序

```text
1. IslandPlan        （ルート検証、初回のみ）
2. IslandFarm        （農園 / 果樹園 / 苗床）
3. IslandRancher     （牧場）
4. IslandMineForest  （鉱山 / 林場）
5. IslandManufacture （製造ライン）
6. IslandBusiness    （店舗経営）
7. IslandDailyGather / IslandAirDrop / IslandDailyOrder / IslandDailyInteract
8. IslandCargoPreparation / IslandPearlSell
```

まず第一次産業（農業・採鉱）で原材料を確保し、次に加工・店舗を稼働させ、最後にデイリー交流タスクを回すのが最も効率的です。
