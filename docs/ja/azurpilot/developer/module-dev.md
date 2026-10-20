---
title: 新規タスクの追加
description: 設定定義から alas.py でのディスパッチ、業務実装、単体テスト、ドキュメント作成までの完全な新規タスク開発フロー。
updated: 2026-10-20
---

# 新規タスクの追加

新規タスクを追加する本質は**3箇所の同名定義**です：`task.yaml` での定義、`alas.py` でのメソッド定義、そして業務モジュールクラスの実装です。ここでは架空の `MyFeature` という機能を例題として、一連の開発パイプラインを解説します。

## <DocIcon name="lightbulb" /> 0. 実装前の設計確認

| 検討事項 | なぜ重要か |
| --- | --- |
| どのような設定パラメータが必要か？ | `argument.yaml` のオプショングループとフィールド設計を決定 |
| いつ実行すべきタスクか？ | `Scheduler` グループのデフォルトインターバルと優先順位を決定 |
| 失敗時に自動リカバリ可能か？ | 適切な例外クラスを選択（例外を安易に握り潰さない） |
| 周回結果の統計を記録するか？ | `Storage` グループへの紐付け要否を決定 |

## <DocIcon name="pencil" /> 1. タスクとメニューの登録

`module/config/argument/task.yaml` を開き、適切なメニューグループ配下に追加します：

```yaml
Reward:
  menu: collapse
  page: setting
  tasks:
    MyFeature:
      - Scheduler
      - MyFeature
      - Storage
```

- リストの記述順がそのまま WebUI 上での設定グループの表示順序になります。
- `Scheduler` グループは有効化、次回実行時刻、インターバル間隔などの共通フィールドを提供します。
- `Storage` グループは周回統計の記録先テーブルを定義します。

## <DocIcon name="settings" /> 2. パラメータの定義

`module/config/argument/argument.yaml` にパラメータグループを追加します：

```yaml
MyFeature:
  Mode:
    value: normal
    option: [normal, deep]
  TargetCount:
    value: 3
    validate: [1, 20]
  EnableExtra:
    type: checkbox
    value: false
    option: [true, false]
```

| フィールド | 説明 |
| --- | --- |
| `value` | デフォルト初期値 |
| `option` | ドロップダウンの選択肢一覧 |
| `validate` | 数値入力の許容範囲 `[min, max]` |
| `type` | UI コントロール種別（省略時は値から自動推論） |

特定タスクにおいて初期値のみを変更したい場合は `default.yaml` に記述します：

```yaml
MyFeature:
  MyFeature:
    TargetCount: 5
```

特定タスクにおいて設定値を固定化しユーザーに変更させたくない場合は `override.yaml` に記述します：

```yaml
MyFeature:
  MyFeature:
    Mode:
      value: normal
      option: [normal]
```

## <DocIcon name="message-text" /> 3. 多言語翻訳の追加

後述のコードジェネレーターを実行すると、`module/config/i18n/*.json` に新しいキーが出力されます。各言語の辞書ファイルに翻訳文言を記述してください：

```json
{
  "Task": {
    "MyFeature": {
      "name": "マイカスタム機能",
      "help": "機能の概要および実行前提条件についての解説。"
    }
  },
  "MyFeature": {
    "_info": { "name": "マイカスタム機能", "help": "" },
    "Mode": {
      "name": "実行モード",
      "help": "normal は通常モード、deep は時間をかけて徹底的な処理を行います。",
      "normal": "通常",
      "deep": "深層"
    },
    "TargetCount": { "name": "目標回数", "help": "1回の実行で処理する上限回数。" },
    "EnableExtra": { "name": "追加処理を有効化", "help": "" }
  }
}
```

選択肢の値（`normal` / `deep`）に対する翻訳文言も忘れずに登録してください。

## <DocIcon name="box" /> 4. 業務モジュールの実装

`module/my_feature/my_feature.py` を作成し、`ModuleBase` を継承して実装します：

```python
from module.base.base import ModuleBase
from module.exception import RequestHumanTakeover
from module.logger import logger


class MyFeature(ModuleBase):
    """マイ機能の自動化ロジック。

    Pages:
        in: page_main
        out: page_main
    """

    def run(self):
        logger.hr('My Feature', level=1)
        self.ui_ensure(page_main)

        count = 0
        while count < self.config.MyFeature_TargetCount:
            if self.config.MyFeature_Mode == 'deep':
                self._deep_step()
            else:
                self._normal_step()
            count += 1

        self.config.task_delay(success=True)

    def _normal_step(self):
        """通常ステップの実行。

        Pages:
            in: page_main
            out: page_main
        """
        self.device.screenshot()
        if self.appear_then_click(MY_FEATURE_ENTRY, interval=2):
            pass
        # ... ステートループの処理

    def _deep_step(self):
        ...
```

### 遵守すべきステートループの記述規約

```python
def some_step(self, skip_first_screenshot=True):
    while True:
        if skip_first_screenshot:
            skip_first_screenshot = False
        else:
            self.device.screenshot()

        if self.appear(MY_END_CONDITION):
            break
        if self.appear_then_click(MY_BUTTON, interval=2):
            continue
        if self.handle_popup():
            continue
```

| 規約ルール | 理由 |
| --- | --- |
| 終了判定には `appear()` を使い、`interval` は設けない | 毎フレーム確実に終了条件をチェックするため |
| クリック操作には `appear_then_click(interval=2~5)` を使用 | 通信遅延時の連打暴走を防ぐため |
| ループ内部で無暗に `sleep()` を呼ばない | スリープ中は画面遷移の変化を検出できないため |
| 否定条件によるループ制御を行わない | 「X が見つからない間ループ」は未知画面で無限ループに陥るため |
| ステートループを多重にネストさせない | 分岐処理は親ループに統合してフラットに保つ |
| `handle_*()` メソッドは `bool` を返す | `True` は操作を実行したため次フレームの再撮影が必要であることを示す |

### 適切な例外の送出方法

| 発生状況 | 送出すべき例外クラス |
| --- | --- |
| 画面が長時間遷移せずフリーズした | `GameStuckError` |
| 同一ボタンへの連続タップ暴走を検知 | `GameTooManyClickError` |
| 安全な自己判断が不可能な状態 | `RequestHumanTakeover` |
| ゲームクライアントの再起動が必要 | `self.config.task_call('Restart')` を呼び出してリターン |

認識失敗を `try/except: pass` で安易に握り潰さないでください。上位スケジューラーの復旧ロジックは例外の型を識別して判断を下します。

### タスクの終了と次回実行スケジューリング

```python
self.config.task_delay(success=True)     # SuccessInterval に基づいて遅延
self.config.task_delay(success=False)    # FailureInterval に基づいて遅延
self.config.task_delay(minute=30)        # 指定した分数だけ遅延
```

`task_delay` を呼び出さずに終了したタスクは「期限到来状態」を維持し、次回のサイクルで即座に再実行されてしまいます。

## <DocIcon name="plug" /> 5. alas.py へのディスパッチ登録

`alas.py` 内にタスク名と同名のメソッドを追加します：

```python
def my_feature(self):
    from module.my_feature.my_feature import MyFeature
    MyFeature(config=self.config, device=self.device).run()
```

- メソッド名 ＝ タスクコマンドのキャメルケースをスネークケースへ変換した名前。
- 実装クラスは必ずメソッド内で遅延インポートしてください。
- 業務ロジックはすべてモジュールクラス側に持たせ、`alas.py` 内には記述しないでください。

## <DocIcon name="refresh" /> 6. コードジェネレーターの実行

```bash
uv run -m module.config.config_updater
```

`args.json`、`menu.json`、`config_generated.py`、`template.json`、`i18n/*.json` が更新されます。これらの自動生成ファイルを YAML と一緒にコミットしてください。

## <DocIcon name="crown" /> 7. デフォルト優先順位の設定（任意）

複数タスクが同時に期限を迎えた際に優先して実行させたい場合は、`module/config/config_manual.py` の `_DEFAULT_SCHEDULER_PRIORITY` 配下にコマンド名を追加してください。

## <DocIcon name="folder" /> 8. ボタン画像の作成と登録

新規ボタン画像を登録する手順：

1. 1280×720 解像度でスクリーンショットを撮影し、ボタン領域を切り抜く。
2. `assets/<対象サーバー>/` ディレクトリに配置。
3. `uv run -m dev_tools.button_extract` を実行して `assets.py` を更新。

## <DocIcon name="flask" /> 9. 単体テストの記述

```bash
# インポートスモークテスト（モジュールが正常にロード可能か検証）
uv run python -m dev_tools.import_smoke_test

# 設定バッチ整合性テスト
uv run python -m unittest tests.test_config_batch

# 新規作成したモジュールのテスト
uv run python -m unittest tests.test_my_feature
```

テストコードでは、実アカウントや実機エミュレーターを直接操作せず、ダミーのスクリーンショット画像やモック設定を使用してください。

## <DocIcon name="file" /> 10. ドキュメントの整備

- `docs/modules/` 配下にモジュールドキュメントを追加（20章構成）。
- ユーザーに公開する新機能である場合は、当ドキュメントサイトのタスクマニュアルに解説を追加。

## <DocIcon name="circle-check" /> 実装チェックリスト

- [ ] `task.yaml` にタスクが登録され、引数グループの順序が適切か
- [ ] `argument.yaml` に型定義、デフォルト値、バリデーションが明記されているか
- [ ] 各言語の i18n 辞書に翻訳テキストが追加されているか
- [ ] `alas.py` 内でメソッド名が一致し、遅延インポートされているか
- [ ] 業務モジュールが `run()` を実装し、ステートループ規約に準拠しているか
- [ ] 例外の型が適切であり、例外の握り潰しがないか
- [ ] 処理終了時に `task_delay` が確実に呼び出されているか
- [ ] `config_updater` を実行し、生成成果物がコミットに含まれているか
- [ ] ボタンリソースが各サーバー向けに揃い、`button_extract` を実行したか
- [ ] インポートスモークテストを通過しているか

## <DocIcon name="circle-alert" /> よくある開発トラブル

| 現象 | 主な原因 |
| --- | --- |
| WebUI 上にタスクが表示されない | コードジェネレーター未実行、または `task.yaml` のインデントエラー |
| タスク実行時に `AttributeError` | `alas.py` のメソッド名とコマンド識別子の不一致 |
| 設定プロパティが読み取れない | `task.yaml` への引数グループ未登録、またはプロパティ名のタイポ |
| タスクが無限に連続実行される | `task_delay` の呼び出し忘れ |
| 連打により意図しない画面へ遷移 | `appear_then_click` の `interval` 未指定 |
| CI で成果物 diff エラーが発生 | YAML を改変した後にコードジェネレーターを実行していない |
