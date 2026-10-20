---
title: デバイス・認識・戦闘
description: デバイスバックエンド、スクリーンショット正規化、画面遷移グラフ、OCR 推論、マップ検出、戦闘ステートループの実装。
updated: 2026-10-20
---

# デバイス・認識・戦闘

このレイヤーは「画面のどこを認識し、どこをタップするか」を担当する基盤部分です。すべての自動化機能の共通土台であり、座標が数ピクセルずれるだけで全タスクが連鎖的に失敗する原因となります。

## <DocIcon name="smartphone" /> デバイスレイヤー

`module/device/` は、ADB 接続、各種スクリーンショットバックエンド、操作注入バックエンド、アプリ管理、エミュレーター制御を統合して `Device` クラスを提供します。

```text
Device
├── Connection        # adb パス、serial、ポートフォワーディング
├── Screenshot mixin  # 設定に応じた screenshot_xxx へのディスパッチ
├── Control mixin     # click / swipe / drag
├── AppControl        # ゲーム起動、停止、フォアグラウンド検知、UI ダンプ
└── Platform          # OS 別のエミュレーター検出および起動停止制御
```

### バックエンドの動的ディスパッチ

スクリーンショットおよび操作の各方式は mixin クラスとして分離実装されており、設定に基づいて動的にメソッドが呼び出されます：

```python
# 実行時に設定からメソッドを解決
func = self.screenshot_methods[self.config.Emulator_ScreenshotMethod]
image = func(self)
```

スクリーンショット方式と操作方式は直交して独立しているため、自由に組み合わせ可能です（例：`nemu_ipc` スクリーンショット ＋ `MaaTouch` 操作）。

### 共通の画像後処理パイプライン

すべてのバックエンドから取得された生画像は、共通の後処理パイプラインを通過します：

1. **解像度の正規化**：1280×720 でない場合は、アセット空間へリサイズ縮小・拡大。
2. **画面の回転補正**。
3. **カラーディザリング除去**（`Emulator.ScreenshotDedithering` 有効時）。
4. **ブラックアウト検知および解像度検証**。

::: danger 1280×720 の変更禁止
認識テンプレート、タップ座標、OCR 抽出領域はすべて 1280×720 を絶対基準として作成されています。正規化ロジックを変更すると、すべてのテンプレートマッチングが破綻します。
:::

### 安定性監視

| 監視対象 | 実装メカニズム | 送出される例外 |
| --- | --- | --- |
| フリーズ（無反応） | 画像ハッシュ比較 ＋ 無変化タイマー | `GameStuckError` |
| 連打暴走 | 直近15回のタップ履歴の統計分析 | `GameTooManyClickError` |
| 単一ボタンへの連打 | 同一ボタンへの連続タップ回数監視（上限12回） | 同上 |

デバイスレイヤー自身は例外の送出のみを担当し、プロセスの再起動などのリカバリ判断は上位のスケジューラー（`alas.py`）に委譲されます。

## <DocIcon name="map" /> 画面遷移ナビゲーション（UI グラフ）

### 画面遷移グラフ

`module/ui/page.py` はインポート時に全画面と画面間の遷移エッジを静的に宣言します：

```python
page_main.link(button=MAIN_GOTO_CAMPAIGN, destination=page_campaign)
```

現行バージョンでは約 63 種類の画面が定義されています。新規画面を追加する手順：

1. `Page(check_button=...)` を定義。
2. `link()` を用いて最低1つの進入エッジと退出エッジを宣言。
3. `check_button` がその画面で一意かつ安定して検出可能であることを確認。

### 画面遷移 API

| メソッド | 用途 |
| --- | --- |
| `ui_goto(page)` | 画面遷移グラフを幅優先探索（BFS）で探索し最短経路で目的地へ遷移 |
| `ui_ensure(page)` | 目的地へ遷移した上で、画面の到達を確実に検証 |
| `ui_back()` | 戻るボタンをタップして前画面へ復帰 |
| `ui_ensure_index()` | 画面内のページ送りインデックスを目的の値まで切り替え |
| `ui_get_current_page()` | 現在の画面がどれであるかを判定 |
| `ui_additional()` | 遷移中に突発的に出現したポップアップダイアログを自動閉じる |

固定的なタップ手順をベタ書きしないでください。ゲームの UI 改修が入った際に固定シーケンスは即座に壊れますが、画面遷移グラフであればリンクを1本追加するだけで全タスクが自動追従できます。

## <DocIcon name="eye" /> OCR（光学文字認識）

`module/ocr/` は、文字認識処理を宣言的なインターフェースとして集約しています：

```python
# 業務ロジック側は認識結果の数値のみを受け取る
count = self.ocr_quantity(OCR_SHOP_ITEM, amount=1)
```

### 前処理パイプライン

グレースケール画像を直接認識モデルに渡すのではなく、以下の前処理を行います：

1. `Button` で定義された領域をクロップ。
2. 既知の文字色（デフォルトは白文字）を抽出し、黒地に白文字（または白地に黒文字）の二値化画像を生成。
3. 二値化画像を認識モデルへ入力。

これにより、ボタンのグラデーション、フチ取り線、背景画像のノイズが完全に排除され、同一のモデルで多様な UI 画面に対応できます。

### モデル構成と推論エンジン

- モデル：PP-OCRv6 シリーズ（lite / standard / pro の3グレード）。言語ごとに最適化された辞書を使用。
- 旧モデル：`alocr_en_v2_6`、`alocr_cn_v3` がフォールバックとして保持されています。
- 推論バックエンド：ONNX Runtime（RapidOCR）、NCNN。Windows では DirectML / QNN / OpenVINO、macOS では CoreML ANE をサポート。
- UI 上の文字領域は事前に座標が確定しているため、検出モデルをスキップして認識モデルのみを直接実行（`RecOnlyOCR`）し高速化しています。

## <DocIcon name="target" /> マップ認識と戦闘

| モジュール | 担当領域 | エントリ |
| --- | --- | --- |
| `module/map` | グリッド感知、透視変換、A* 経路探索 | `Map` |
| `module/map_detection` | マップ上のマス目・障害物の画像検出 | `map_detection` |
| `module/combat` | 戦闘ステートループ、リザルト処理、艦隊配置 | `Combat` |
| `module/campaign` | 海域選択、出撃準備、周回実行制御 | `CampaignRun` |
| `campaign/` | 具体的な海域ごとのマップおよび敵配置定義 | Python ファイル |

### 戦闘ステートループ

```text
戦闘開始画面を検知 → 戦闘終了リザルトの待機 → 判定結果の取得
  ├── 勝利 → 次の敵艦探索 / 海域離脱
  ├── 敗北 → DefeatWithdraw ポリシーに従い処理（撤退 / 艦隊交代 / 停止）
  └── タイムアウト → GameStuckError を送出し上位スケジューラーへ復旧を要求
```

敗北時のハンドリングは `module/defeat_handling.py` に集約されています。

## <DocIcon name="compass" /> 大世界ナビゲーション {#大世界导航}

`module/os/` は高度に抽象化された大世界専用モジュール群です：

```text
OSMap(MapEventResumeMixin, OSFleet, Map, GlobeCamera, StorageHandler, StrategicSearchHandler)
```

- `globe_goto(zone)`：全球球面マップと局所海域マップをシームレスに横断移動。
- `OSGrid`：セイレーン作戦専用のクォータービュー視角に特化したグリッド座標変換。
- 17 種類のサブタスク群が `tasks/` に配置され、`OSMap` を継承してナビゲーション能力を利用します。

内部仕様の詳細は[セイレーン作戦（大世界）](/ja/azurpilot/user/tasks/opsi)のマニュアルおよび `docs/modules/os/index.md` を参照してください。

## <DocIcon name="pencil" /> アセット修正時の定石

### ボタン画像の差し替え

1. 1280×720 解像度で該当ボタンの領域を切り抜く。
2. `assets/<対象サーバー>/` 配下に画像を配置。
3. `assets.py` 内の `Button` 定義から参照。
4. `uv run -m dev_tools.button_extract` を実行してリソースコードを更新。

### 新規画面の登録

```python
page_my_feature = Page(check_button=OCR_MY_FEATURE_TITLE)
page_main.link(button=MAIN_GOTO_MY_FEATURE, destination=page_my_feature)
page_my_feature.link(button=BACK_ARROW, destination=page_main)
```

## <DocIcon name="flask" /> テストコマンド

```bash
# インポートスモークテスト
uv run python -m dev_tools.import_smoke_test

# 戦闘およびマップ探索の単体テスト
uv run python -m unittest tests.test_combat_results tests.test_auto_search_defeat tests.test_opsi_map_event_resume

# OCR 設定およびスレッド制限テスト
uv run python -m unittest tests.test_ocr_settings tests.test_ocr_thread_limits
```

実際の画像認識精度は実機エミュレーター上でのみ検証可能です。静的テストの通過は単にコード構文が正常であることを示すにすぎません。
