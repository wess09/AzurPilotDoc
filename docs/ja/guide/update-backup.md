---
title: 更新・バックアップ・移行
description: コアプログラム、ランチャー、Android ホストのアップデート手順、設定バックアップの作成と復元、マシン移行の流れ。
updated: 2026-10-20
---

# 更新・バックアップ・移行

3つのコンポーネントのバージョン管理は互いに独立しています。この前提を把握しておくことで、「更新を実行した際に何が更新されたのか」を正しく把握できます。

## <DocIcon name="refresh" /> 更新対象と更新方法の対照

| コンポーネント | 更新手段 | 更新内容 | 再起動が必要な対象 |
| --- | --- | --- | --- |
| コアプログラム | WebUI 更新画面（`updater.*`） | `git pull` によるソースコード ＋ 依存同期 | 対象インスタンスの worker プロセス停止・再起動 |
| ランチャー | ランチャー自動更新（mTLS ＋ ミラー） | ランチャーのバイナリ本体 | ランチャーアプリケーション |
| Android App | OS のインストーラーによる上書き | ホストの Kotlin / C++ コード | Android アプリ |
| Android Runtime | ホスト内の Runtime 更新機能 | rootfs イメージ（コアソースコードと WebUI dist を含む） | Runtime |
| Android コアスクリプト | ホットアップデートチャネル | アップストリームソースコード ＋ ローカルでの WebUI ビルド | Runtime |

::: warning 更新前のバックアップの徹底
あらゆるアップデートにおいて、互換性のない設定スキーマの変更が発生する可能性があります。アップデート作業を行う前に `config/` ディレクトリ全体をコピーしてバックアップしておくことを強く推奨します。
:::

## <DocIcon name="zap" /> コアプログラム

WebUI の「更新」画面には、アップストリームのコミット、現在のコミット、差分一覧が表示されます。処理フローは以下のとおりです：

1. <DocIcon name="search" /> 更新確認（`updater.status` / `updater.commits`）。
2. <DocIcon name="download" /> 取得（`updater.fetch`）。
3. <DocIcon name="zap" /> 適用（`updater.apply`）：すべてのワーカーを停止した上でコードを切り替え、依存関係を同期し、必要に応じて再起動します。

更新画面では進行中の更新をキャンセル（`updater.cancel`）することも可能です。Docker コンテナ環境で運用している場合は、ホスト側で手動で `git pull` ＋ `uv sync --frozen` を実行した後にコンテナを再起動することもできます。

### アップデート後に設定の互換性エラーが発生した場合

設定スキーマは `module/config/config_updater.py` により新しいテンプレートが生成され、旧設定の読み込み時に自動移行されます。フィールドの欠落等が生じた場合：

1. <DocIcon name="search" /> `config/<インスタンス>.json` と `config/template.json` を比較します。
2. <DocIcon name="ban" /> `args.json`、`menu.json`、`config_generated.py` を手動で編集しないでください。これらは自動生成成果物です。
3. <DocIcon name="refresh" /> 移行に失敗した場合はバックアップから設定をロールバックし、個別のタスクグループを調査してください。

## <DocIcon name="rocket" /> ランチャー

ランチャーは起動時にまずコアリポジトリを更新（`git pull`、失敗時は最大20回リトライ）し、その後に `uv sync --frozen` を実行します。ランチャー**本体**の更新は独立した専用チャネルを経由します：

- <DocIcon name="cloud" /> デフォルトのマニフェスト URL：`https://launcher-api.azurpilot.com/updata/stable.json`。
- <DocIcon name="file-pen" /> テストまたはプライベート環境向けに `LAUNCHER_UPDATE_URL` 環境変数で上書き可能です。
- <DocIcon name="lock" /> ペイロードは mTLS により検証され、複数のミラーへのフォールバックをサポートしています。

起動引数に `--skip-update` を渡すことでリポジトリの更新処理をスキップできます。オフライン環境や、アップデート直後の起動障害を調査する際に利用してください。

## <DocIcon name="smartphone" /> Android

Android には3つの独立した更新チャネルが存在します。詳細は[更新・バックアップ・トラブルシューティング](/ja/android/user/maintenance)を参照してください。主な使い分け：

- <DocIcon name="smartphone" /> **ホストコードのみの変更** → 軽量増分 APK を上書きインストール。Runtime と設定は保持されます。
- <DocIcon name="package" /> **Runtime（依存関係、Python バージョン、ビルド構成）の変更** → rootfs イメージを更新。サービス停止後に差し替えられます（`/config` は保持）。
- <DocIcon name="refresh" /> **アップストリームのスクリプトのみの変更** → ホットアップデート：`uv.lock` を比較し、依存関係に変更がなければソースコードを取得して端末内でフロントエンドをビルド。失敗時は自動的にロールバックされます。

## <DocIcon name="drive" /> バックアップ

### 自動バックアップ

コアプログラムはデフォルトで日次自動バックアップが有効になっています（`Alas.Backup.Enable`、保持期間7日間）。バックアップはプロジェクトルートに保存されます：

```text
AzurPilot_Data_Backup/
└── 2026-10-20/
    ├── azurpilot.db
    ├── ap.json
    ├── ap-2.json
    └── backup_info.json
```

バックアップには SQLite 統合データベースとすべてのインスタンス設定が含まれます。データベースは SQLite のバックアップ API を経由してエクスポートされ、コミット済みの WAL も含まれます。

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `Alas.Backup.Enable` | 有効 | 毎日の初回スケジューリングループ突入時に実行 |
| `Alas.Backup.KeepDays` | 7 | 指定日数を経過した古いバックアップディレクトリを自動削除 |

### 手動バックアップの対象項目

| パス | 内容 | 必須度 |
| --- | --- | --- |
| `config/*.json` | インスタンス設定（タスクのスイッチおよび次回実行時刻を含む） | 必須 |
| `config/deploy.yaml` | バックエンドのリッスンアドレス、パスワード、言語設定 | 推奨 |
| `config/remote-access.json` | リモートアクセスのデバイス識別情報とペアリングダイジェスト | 接続先を維持したい場合は必須 |
| `azurpilot.db`（データディレクトリ） | 統計データ、ドロップ記録、資材の推移ログ | 履歴データを保持したい場合は必要 |
| `log/` | 実行ログおよびエラーログ | トラブルシューティング時 |
| `AzurPilot_Data_Backup/` | 自動バックアップアーカイブ | 任意 |

::: danger Git へのコミット禁止
`config/remote-access.json`、`config/deploy.yaml`、`password.txt` には認証情報が含まれます。これらを公開リポジトリにコミットすると、インスタンスの操作権限が流出します。
:::

## <DocIcon name="laptop" /> 別マシンへのデータ移行

<Steps>
<Step title="旧マシンでスケジューラーを停止">

移行中のファイル書き込みを防ぐため、すべてのインスタンスを停止してください。

</Step>
<Step title="config ディレクトリをコピー">

`deploy.yaml` も含めて丸ごとコピーします。設定ファイル内に絶対パスは記録されていないため、新マシン側のパスが異なっていても問題ありません。

</Step>
<Step title="新マシンでの環境構築">

新マシンにランチャーまたはソースコード環境を導入し、一度起動して `.venv` と依存関係のセットアップを完了させた後、一度終了します。

</Step>
<Step title="設定を上書きして起動">

新プロジェクトのルートディレクトリに `config/` を上書き配置し、WebUI を起動します。インスタンス一覧とタスク設定が正常に引き継がれているか確認します。

</Step>
<Step title="デバイス固有設定の再調整">

エミュレーターの Serial、ADB パス、スクリーンショット方式を新環境に合わせて再設定してください。アカウントヴォールトはデバイスの暗号化キーに紐づいているため、移行先での再ロック解除または再登録が必要です。

</Step>
</Steps>

## <DocIcon name="refresh" /> ロールバック

- <DocIcon name="refresh" /> **コアプログラム**：`git log` で直前の安定したコミットを特定し、`git checkout <sha>` を実行後、`uv sync --frozen` を実行します。ローカル変更を失わないよう、`git reset --hard` の安易な使用は避けてください。
- <DocIcon name="drive" /> **設定**：`AzurPilot_Data_Backup/<日付>/` から必要な設定ファイルを `config/` にコピーして復元します。
- <DocIcon name="smartphone" /> **Android Runtime**：ホストは直前のバージョンの rootfs ディレクトリを保持しています。ホットアップデート失敗時は自動ロールバックされます。手動での切り戻しは Android メンテナンス画面を参照してください。
- <DocIcon name="medal" /> **ランチャー**：旧バージョンのアーカイブを再ダウンロードし、実行ファイルを上書きしてください。`.venv` や設定ファイルには影響しません。
