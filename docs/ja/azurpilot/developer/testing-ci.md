---
title: テストと CI
description: Python 単体テスト、フロントエンド Vitest と Playwright、インポートスモーク、自動生成成果物検証、CI ジョブ構成。
updated: 2026-10-20
---

# テストと CI

当リポジトリのテスト運用戦略は「**安価な検証は毎回のコミットで網羅実行し、高負荷な実機検証は改修範囲に応じて絞り込んで実行する**」という原則に基づいています。CI パイプラインはコード生成成果物の一貫性、全モジュールのインポート可能性、主要ロジックの回帰防止を自動検証します。

## <DocIcon name="box" /> テストの階層構造

| レイヤー | 使用ツール | テスト規模 | 特徴と役割 |
| --- | --- | --- | --- |
| Python 単体テスト | `unittest` | 200+ ファイル | 実機エミュレーター非接続。フィクスチャ画像とモック設定で高速実行 |
| Python 専門シナリオ | `pytest` | `tests/shop_event` 等 | パラメータ化された特定機能の組み合わせ検証 |
| フロントエンド単体 | Vitest | コンポーネント、フック | jsdom 環境での UI ロジック検証 |
| フロントエンド E2E | Playwright | 実バックエンド / モック | ブラウザ上の主要操作フローの自動検証 |
| インポートスモーク | 自作スクリプト | `module/`、`deploy/` 全域 | サブプロセスで全モジュールを走査インポートし潜在破損を検出 |
| 生成成果物検証 | git diff | 全自動生成ファイル | 設定、ボタンリソース、API 規約の差分検出 |

## <DocIcon name="laptop" /> ローカルでのテスト実行

```bash
# 全 Python 単体テストの実行
uv run python -m unittest discover -s tests

# 特定モジュールの単体テスト実行
uv run python -m unittest tests.test_api

# pytest 専門テストの実行
uv run pytest tests/shop_event

# インポートスモークテストの実行（デバイス非接続で高速検証）
uv run python -m dev_tools.import_smoke_test

# 基本的なコード静的検査（Ruff）
uv run ruff check . --select E9,F63,F7,F82 --ignore F821,F722
```

フロントエンド関連：

```bash
npm run typecheck --prefix frontend
npm test --prefix frontend
npm run test:e2e:mock --prefix frontend
```

::: tip 1行の修正ごとに全量テストを実行する必要はありません
リポジトリの開発規約では、「改修と直接関係のあるテストモジュールを優先して実行する」ことが推奨されています。全量テストの実行は、3つ以上のモジュールに影響が及ぶ大規模なリファクタリング時のみで十分です。
:::

## <DocIcon name="cloud" /> GitHub Actions CI ジョブ構成

`.github/workflows/ci.yml` は push および PR 作成時に自動トリガーされます：

| ジョブ名 | 実行環境 | 検証内容 |
| --- | --- | --- |
| `game-data` | Ubuntu / Windows / macOS-14 マトリクス | 身元識別情報の永続化、取引所、過去認証互換、アカウント復旧、マイグレーション |
| `frontend` | Ubuntu ＋ Node 24 | ロックファイル検証、API 規約 diff 検出、WebUI ビルド、Vitest、Playwright E2E |
| `ruff` | Ubuntu | 静的解析（`E9,F63,F7,F82`、一部安全に無視） |
| `button-config-check` | Ubuntu | `button_extract` と `config_updater` を再実行し、`git diff --exit-code` で差分検出 |
| `import-smoke` | Ubuntu | 全モジュールの一括インポート検証 ＋ `tests.test_ci_import` |

### macOS ランナーで `macos-14` のみを使用する理由
`macos-15-intel`（x86_64）には llvmlite のビルド済み wheel が存在せず、`uv sync` が必ず失敗するためです。そのため CI マトリクスは Apple Silicon ランナーである `macos-14` に限定しています。

### API 規約の自動整合性検証

```bash
uv run python -m dev_tools.export_api_schema
git diff --exit-code -- frontend/src/api/generated.ts frontend/src/api/contract.json
```

Python 側のパラメータモデルを変更したにもかかわらず、フロントエンド側の TypeScript 規約を再出力していない場合、CI は即座に失敗します。

### コード生成成果物の自動差分検証

```bash
uv run -m dev_tools.button_extract
uv run -m module.config.config_updater
git diff --exit-code
```

このジョブにより、「YAML を編集したのにジェネレーターを実行していないミス」と「生成ファイルを直接手編集してしまったミス」の双方が確実に防止されます。

## <DocIcon name="shield" /> 自動テストの検証限界

| 自動テストで検証可能な領域 | 自動テストで検証できない領域 |
| --- | --- |
| 設定のマイグレーション、引数の型バリデーション | 実機上での正確な画像認識率 |
| スケジューラーのステートマシン、復旧マトリクス | 多種多様なエミュレーター間の互換性 |
| API 規約の整合性、セッション認証フロー | ゲームイベントの最新ギミックへの適合 |
| フロントエンドの UI インタラクション、フォーム保存 | メーカー製 Android ROM 特有のタスクキル挙動 |

::: warning 静的検証と実機検証の区別
ドキュメント内では「ソースコードに基づく静的検証」と「実機エミュレーターでの実機動作検証」を明確に区別して記載しています。単体テストや CI がすべてパスしたことと、実機上でタスクが意図通りに完走することは別問題です。
:::

## <DocIcon name="circle-check" /> PR 提出前のセルフチェックリスト

- [ ] 改修に関連する Python 単体テストが通過していること
- [ ] `ruff` による静的解析をパスしていること
- [ ] フロントエンドの改変時は `typecheck` と `vitest` を通過していること
- [ ] YAML を編集した場合、`config_updater` を再実行したこと
- [ ] ボタン画像を変更した場合、`button_extract` を再実行したこと
- [ ] API メソッドを変更した場合、`export_api_schema` を再実行したこと
- [ ] 自動生成成果物がソースコードと一緒にコミットに含まれていること
- [ ] PR 本文に検証方法と未検証の範囲が明記されていること
- [ ] 実際に実行していないテスト項目にチェックを入れていないこと

## <DocIcon name="medal" /> 関連ワークフロー

| ワークフロー名 | トリガー契機 | 役割 |
| --- | --- | --- |
| `docker-publish.yml` | タグ作成 / master プッシュ | Docker イメージのビルドとレジストリ公開 |
| `sync-cnb.yml` | リポジトリプッシュ時 | CNB ミラーへの同期 |
| `git-over-cdn-*.yml` | 定期 / 手動 | 国内向け CDN ミラー配布の更新 |
| `ai-issue-labeler.yml` | Issue 作成時 | AI によるラベル自動付与 |

リリースリリースの詳細は[リリースとバージョン管理](/ja/contributing/release)を参照してください。
