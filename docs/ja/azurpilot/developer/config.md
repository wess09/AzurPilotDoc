---
title: 設定システム
description: YAML 定義から args.json、config_generated.py、実行時プロパティバインドへの完全パイプラインと新規設定項目の追加手順。
updated: 2026-10-20
---

# 設定システム

設定システムは4つの要求を同時に満たす必要があります：ゲームロジックからの直感的なプロパティ読み取り、スケジューラーによるタスクキュー管理、WebUI による動的フォーム描画、開発者による宣言的な拡張性。これらは「**YAML による定義 → コードジェネレーター → 実行時バインド**」の3段構成によって実現されています。

```text
task.yaml  argument.yaml  default.yaml  override.yaml  gui.yaml  dashboard.yaml
      │            │             │            │           │          │
      └────────────┴─────────────┴────────────┴───────────┴──────────┘
                                   │
                    uv run -m module.config.config_updater
                                   │
     ┌──────────────┬──────────────┼──────────────┬──────────────┐
     ▼              ▼              ▼              ▼              ▼
  args.json     menu.json   config_generated.py  template.json  i18n/*.json
     │              │              │
     ▼              ▼              ▼
  WebUI フォーム  サイドバーメニュー  Python デフォルト値クラス
                                   │
                                   ▼
                          AzurLaneConfig（実行時）
```

## <DocIcon name="file" /> 定義レイヤー：6つの YAML

| ファイル名 | 役割と責務 | 編集権限 |
| --- | --- | --- |
| `task.yaml` | タスク定義、オプショングループの割り当て、メニュー階層構造 | 開発者 |
| `argument.yaml` | パラメータのデータ型、デフォルト値、選択肢、バリデーション規約 | 開発者 |
| `default.yaml` | タスク固有の変更可能なデフォルト値 | 開発者 |
| `override.yaml` | 設定値の強制上書き、`display`、`type` の強制 | 開発者 |
| `gui.yaml` | WebUI 用のテキスト翻訳キー | 開発者 |
| `dashboard.yaml` | ダッシュボードに表示する資材リソースの定義 | 開発者 |

`default.yaml` と `override.yaml` の差異は極めて重要です：

- `default.yaml` は単なる**初期値**であり、ユーザーは WebUI 上で値を自由に変更できます。
- `override.yaml` は**強制上書き**であり、ユーザーによる変更は保存時に拒否または無効化されます（特定タスクで固定すべきパラメータや内部隠しフィールドに使用）。

## <DocIcon name="eye" /> パラメータ定義の記法例

```yaml
Campaign:
  Name: 12-4
  Mode:
    value: normal
    option: [normal, hard]
  UseAutoSearch: true
```

| 属性キー | 役割 |
| --- | --- |
| `value` | デフォルト初期値 |
| `type` | UI コントロール種別：`checkbox`、`input`、`textarea`、`datetime`、`stored` 等 |
| `option` | ドロップダウンの選択肢一覧 |
| `validate` | 数値の許容範囲 `[min, max]` |
| `display` | `hide` で非表示、`stored` で内部ステータスとして永続化 |
| `valuetype` | 型キャスト（`str`、`int` 等） |

## <DocIcon name="refresh" /> 生成レイヤー

```bash
uv run -m module.config.config_updater
```

生成される成果物：

| 成果物ファイル | 利用者・用途 |
| --- | --- |
| `module/config/argument/args.json` | WebUI のオプションツリー描画およびバックエンドバリデーション |
| `module/config/argument/menu.json` | WebUI のサイドバーナビゲーション構造 |
| `module/config/config_generated.py` | Python 側の実行時プロパティデフォルト値クラス |
| `config/template.json` | 新規インスタンス作成時の初期テンプレート |
| `module/config/i18n/*.json` | 5言語対応の翻訳辞書ファイル |
| `config/deploy.template*.yaml` | デプロイ設定テンプレート |

::: danger 自動生成ファイルの手作業編集禁止
CI パイプラインはジェネレーターを再実行して差分を検証します。手作業での編集は CI で確実に失敗し、次回生成時に上書きされます。唯一の例外は `i18n/*.json` であり、自動生成されたキーに対して各言語の翻訳テキストを手動で補完する必要があります。
:::

## <DocIcon name="settings" /> 実行時：AzurLaneConfig

### パスとプロパティの対応関係

設定の内部パスは `<Task>.<Group>.<Argument>` で構成され、タスクバインド後はアンダースコア連結プロパティとしてアクセスできます：

```python
# 設定ファイル内の Campaign.Name を読み取り
name = self.config.Campaign_Name

# 書き込み（メモリが更新され、未保存フラグがセットされる）
self.config.Campaign_Name = '12-4'
```

`bind(task)` は現在実行中のタスクに関連付けられたパラメータのみをインスタンスに展開します。そのため、業務コードから他タスクのプライベート設定を直接読み取ることはできません（他タスクの設定を参照する場合は `cross_get` を使用します）。

### 保存とファイルトランザクション

設定の書き込みは即座にディスクに flush されるのではなく、変更キューに蓄積された後、トランザクション層によりアトミックに書き込まれます。スケジューラー worker と WebUI バックエンドの間ではファイルロックにより競合が防止されます：

```text
worker プロセス側の変更 → modified キュー → トランザクションロック → config/<インスタンス名>.json へアトミック書き込み
WebUI バックエンド側の変更 → config.patch（revision 照合）→ 競合検知 → 同一のファイルロックを獲得して更新
```

WebUI 側は `revision` による楽観的排他制御を行っており、複数画面からの同時編集による意図しない上書きを防止します。

### ロードとマイグレーション

設定読み込み時の処理順序：

1. `config/<インスタンス名>.json` をディスクから読み取り。
2. `config_generated.py` の定義とマージ（欠落フィールドにはデフォルト値を補完）。
3. `redirect_utils/` のルールに基づきバージョン間マイグレーションを実行（リネーム、型変換、選択肢マッピング）。
4. データ型の正規化（文字列形式の数値を int へキャスト、日時フォーマットの統一）。
5. プロパティを展開生成。

`AzurLaneConfig` の初期化時にマイグレーション結果の保存がトリガーされる場合があります。単体テスト時は本番の設定ファイルを汚染しないよう、必ず一時ディレクトリを使用してください。

## <DocIcon name="zap" /> ホットリロードの仕組み

スケジューラーはファイルシステムのイベント監視を行わず、以下の2つのタイミングでファイルの更新日時（mtime）を比較します：

- `wait_until()` の 5 秒ごとのアイドルポーリング時。
- 各タスクの実行完了時（`config` キャッシュの破棄時）。

変更を検知した場合は `AzurLaneConfig` を丸ごと再構築します。タスク実行の途中で設定が突然書き換わることはありません。

## <DocIcon name="circle-plus" /> 新規設定フィールドの追加手順

<Steps>
<Step title="argument.yaml の編集">

該当するオプショングループの下にフィールドを追加し、`value`、`type`、`option` / `validate` を定義します。フィールド名はアッパーキャメルケース（大文字始まり）で記述します。

</Step>
<Step title="上書き要否の決定">

特定タスクで値を固定化する必要がある場合は `override.yaml` に記述し、初期値のみを変更したい場合は `default.yaml` に記述します。

</Step>
<Step title="タスクへの紐付け">

必要に応じて `task.yaml` 内の対象タスクのオプショングループ一覧に追加します。

</Step>
<Step title="多言語翻訳の追加">

コードジェネレーターを実行した後、`module/config/i18n/*.json` を開き、各言語の翻訳文言を記述します。

</Step>
<Step title="ジェネレーターの実行">

```bash
uv run -m module.config.config_updater
```

`args.json` と `template.json` に意図した差分のみが含まれていることを確認します。

</Step>
<Step title="動作検証">

```bash
uv run python -m unittest tests.test_config_transaction tests.test_config_batch
uv run python -m dev_tools.import_smoke_test
```

WebUI を起動し、該当フィールドが正しく表示され、保存および再読込が行えることを確認します。

</Step>
</Steps>

## <DocIcon name="circle-alert" /> よくある設定エラー

| 現象 | 主な原因 |
| --- | --- |
| WebUI 上に項目が表示されない | `task.yaml` に紐づいていない、または `display: hide` が指定されている |
| 変更した値が元に戻る | `override.yaml` によって強制上書きされている |
| プロパティアクセス時に `AttributeError` | フィールド名のスペルミス、または対象タスクにそのグループがバインドされていない |
| 設定のマイグレーションで値が消失 | `redirect_utils` に移行ルールが定義されていない |
| UI 上に英語のキー名が露出する | 生成後に `i18n` 辞書に翻訳を追加していない |
| CI で生成物の差分エラーが出る | YAML を編集した後にコードジェネレーターを実行していない |

## <DocIcon name="map" /> 関連ソースコード

| ファイル | 役割 |
| --- | --- |
| `module/config/config.py` | `AzurLaneConfig`：ロード、バインド、保存、スケジューリングプリミティブ |
| `module/config/config_updater.py` | コードジェネレーターおよびマイグレーション処理 |
| `module/config/transaction.py` | プロセス間ファイル書き込みトランザクション |
| `module/config/task_priority.py` | 優先度文字列のパース処理 |
| `module/config/server.py` | サーバーとパッケージ名のマッピング定義 |
| `module/api/config_service.py` | WebUI バックエンド側の入力バリデーション |
