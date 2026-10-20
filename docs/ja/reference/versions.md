---
title: ソースコードバージョン索引
description: ドキュメント監査が準拠するリポジトリ・ブランチ・コミットハッシュ、監査範囲、未検証事項、素材の権利情報。
updated: 2026-10-20
---

# ソースコードバージョン索引

本ドキュメントサイトの内容は、3つのリポジトリの最新ソースコードに対する読み取り監査に基づいて作成されています。このページでは「どのバージョンを根拠とし、何を監査し、何を未検証としているか」を記録します。

## <DocIcon name="clipboard" /> 監査ベースライン

| プロジェクト | リポジトリ | デフォルトブランチ | 監査コミットハッシュ | コミット日時 |
| --- | --- | --- | --- | --- |
| コアプログラム | `wess09/AzurPilot` | `master` | `7de6bb914da5798e76ef34a85a75648a526d319f` | 2026-10-20 |
| Android ホスト | `wess09/AzurPilot-for-Android` | `main` | `1235c0a6d2d1f1bc334545e246eee2d93db756fa` | 2026-10-20 |
| デスクトップランチャー | `wess09/AzurPilotLauncher` | `main` | `44a8715afef5c5be02184d9c7a08bf10a7b6c89f` | 2026-10-19 |

::: warning デフォルトブランチの不一致
コアプログラムは `master` を使用し、他の2リポジトリは `main` を使用しています。古い記事等の `/blob/main/` リンクをコアリポジトリに適用すると 404 エラーとなります。
:::

## <DocIcon name="search" /> 監査方法

- 3つのリポジトリを `--depth 1` でクローンし、HEAD コミットを記録。
- `AGENTS.md` / `CLAUDE.md` / 各言語版 README を精読。
- ディレクトリ構成を走査し、`module/`、`frontend/`、`app/`、`rootfs/`、`server/`、`src/` を網羅的に分析。
- `docs/modules/`（モジュールドキュメント54編）、`doc/`（Android 31編、ランチャー 1編）を参照。
- `task.yaml`、`argument.yaml`、`args.json`、`i18n/*.json`、`contract.json` をパース。
- `.github/workflows/` および `.cnb/` の CI パイプライン設定を検証。
- タスク表（102件）および API 表（72件）をスクリプトにより機械抽出し、手作業による転記ミスを排除。

## <DocIcon name="badge-dollar" /> カバレッジ統計

| 対象項目 | 数量 | データソース |
| --- | --- | --- |
| タスクコマンド | 102 | `args.json` |
| オプショングループ | 167 | `argument.yaml` |
| WebSocket メソッド | 72 | `frontend/src/api/contract.json` |
| MCP ツール | 18 | `mcp_server_sse.py` |
| コアモジュールドキュメント | 54 篇 | `docs/modules/` |
| Python テストファイル | 209 | `tests/` |

## <DocIcon name="circle-check" /> 検証済み項目と未検証項目

### 実施済み（静的検証）

- ソースコード構成、設定フィールド、API 規約、CI パイプラインの一貫性チェック。
- ドキュメント内に記載された全コマンドはリポジトリ内スクリプトまたは `AGENTS.md` に基づく。
- 当ドキュメントサイト自身のビルド、TypeScript 型検査、内部リンク、SEO、レスポンシブ UI および操作テスト：31件のブラウザテスト、112パターンのブレークポイント検証、アクセシビリティ検査を通過。詳細は `docs-audit/validation-report.md` を参照。

### 未実施（実環境が必要な項目）

| 項目 | 未検証の理由 |
| --- | --- |
| 実際のゲームタスク実行 | アカウント、エミュレーター、ゲームクライアントが必要でありゲーム内資源を消費するため |
| エミュレーター互換性マトリクス | 各エミュレーターの実測が必要。リポジトリはデフォルト Serial のみ提供 |
| Android 実機フル回帰テスト | 複数メーカーの端末が必要。リポジトリでは Redmi Note 10 Pro の実測のみ記録 |
| NPU アクセラレーション効果 | 搭載 SoC とドライバに依存。「実際の初期化結果に準拠」と明記 |
| リモート Tunnel 疎通性 | Cloudflare ネットワーク環境に依存するため |
| ランチャー3プラットフォーム実機検証 | CI はビルドと単体テストのみカバーしており実デスクトップ環境は対象外 |

::: warning 推測を事実として記述しない方針
上記の実環境依存項目について、ドキュメント上では推測による断定を避け、「要検証」または未検証である旨を明記しています。
:::

## <DocIcon name="scale" /> 情報の競合発生時の判断基準

| 競合ケース | 採用基準 |
| --- | --- |
| ソースコード vs README | ソースコードの実装を優先 |
| 設定スキーマ / テストコード vs 文書 | スキーマとテストコードを優先 |
| 複数リポジトリ間でドキュメントが矛盾 | 差異を注記し、コード側の記述を採用（例：Android バージョン番号のベースライン） |

## <DocIcon name="folder" /> 掲載素材の権利関係

| 素材種別 | 出典 | ライセンス |
| --- | --- | --- |
| Android スクリーンショット | `AzurPilot-for-Android/docs/screenshots/` | AGPL-3.0 |
| ランチャー スクリーンショット | `AzurPilotLauncher/screenshots/` | GPL-3.0 |
| WebUI スクリーンショット | `AzurPilot/doc/GUI.png` | GPL-3.0 |
| プロジェクトロゴ | `AzurPilot/doc/logo.webp` | GPL-3.0 |
| アーキテクチャ図 | 当サイト独自作成 SVG | Apache-2.0 |
| アイコン | 当サイト独自 SVG / Lucide | ISC |

ゲーム内のアートアセットは直接使用していません。UI スクリーンショット内に写り込んでいるゲームグラフィックの著作権は原権利者に帰属します。

## <DocIcon name="refresh" /> ドキュメント改定ポリシー

1. 3つのリポジトリの更新時、`extract-tasks.py`、`extract-api.py`、`extract-config.py` を再実行。
2. 生成データの差分（diff）を確認し、説明文の改定要否を判断。
3. 本ページのコミットハッシュと更新日を改定。
4. ソースコードの裏付けがない状態で Issue やチャットの伝聞に基づいた追記を行わない。

## <DocIcon name="file" /> 監査関連ファイル

当リポジトリの `docs-audit/` に以下の監査記録が保存されています：

| ファイル名 | 記録内容 |
| --- | --- |
| `source-inventory.md` | 3リポジトリのディレクトリ構成と重要ファイル一覧 |
| `coverage-matrix.md` | 機能 → ソースコード → ドキュメント → 検証状態のマトリクス |
| `source-versions.json` | 機械可読なバージョン管理 JSON |
| `unresolved-items.md` | 未解決・要確認事項チェックリスト |
| `validation-report.md` | ビルド・ブラウザ・SEO の総合検証レポート |
