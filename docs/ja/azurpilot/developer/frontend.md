---
title: React フロントエンド
description: WebUI フロントエンドのディレクトリ構成、ルーティング一覧、共有 API 規約、状態管理、多言語対応、テスト手順。
updated: 2026-10-20
---

# React フロントエンド

フロントエンドは純粋な静的 React アプリケーションとして構成されており、ビルド成果物は `gui.py` によってローカルホストされます。SSR（サーバーサイドレンダリング）は使用しておらず、独立した Node サーバーの常駐も不要です。

## <DocIcon name="wrench" /> 技術スタック

| ライブラリ / ツール | バージョン | 主な用途 |
| --- | --- | --- |
| React | 19.3 | UI 描画 |
| React Router | 7.18 | クライアントサイドルーティング |
| Vite | 6.x | ビルドおよび開発サーバー |
| TypeScript | 5.x | 型安全性の担保 |
| ECharts | 6.1 | 統計グラフの描画 |
| @xyflow/react | 12.x | ビジュアルスケジューラーキャンバス |
| motion | 13.x | UI アニメーション |
| CodeMirror | 6.x | YAML / JSON エディタ |
| lucide-react | 1.45 | アイコンセット |

Node.js の動作要件は `>=22.12.0` です（`frontend/package.json` の `engines` 参照）。

## <DocIcon name="folder" /> ディレクトリ構成

```text
frontend/src/
├── main.tsx           # ルーティング設定とアプリケーションエントリ
├── app/               # レイアウトフレーム、トップバー、検索、ユーザー設定
├── pages/             # 各画面のルートコンポーネント
├── components/        # 再利用可能な共通 UI コンポーネント
├── api/               # API クライアント、型定義、自動生成規約
├── config/            # 設定フォームのモデルおよび保存キュー
├── scheduler/         # ビジュアルスケジューラーのノード、ポート、レイアウト
├── mind/              # メンタル計算機
├── fleet-tech/        # 艦隊技術
├── resources/         # リソース管理ビュー
├── stock/             # 取引所
├── remote/            # リモートアクセス設定
├── i18n*.ts           # 多言語テキストリソースおよび開発支援ツール
└── styles/            # グローバルスタイルシートおよび CSS 変数定義
```

## <DocIcon name="map" /> ルーティング定義

| パス | 画面コンポーネント |
| --- | --- |
| `/` | ホーム画面（インスタンス一覧） |
| `/announcement` | お知らせ |
| `/interface` | 外観・インターフェース設定 |
| `/remote` | リモートアクセス |
| `/settings` | システム全体設定 |
| `/updater` | アップデータ画面 |
| `/configs` | インスタンス設定ファイル管理 |
| `/dev` | 開発者用テストコントロール |
| `/i/:instance/overview` | インスタンスダッシュボード |
| `/i/:instance/task/:task` | タスク設定フォーム |
| `/i/:instance/statistics` | 統計レポート |
| `/i/:instance/stock-exchange` | 取引所 |
| `/i/:instance/task/SchedulerProgram` | ビジュアルスケジューラー |
| `/i/:instance/task/MindCalculator` | メンタル計算機 |
| `/i/:instance/task/FleetTechnology` | 艦隊技術 |

古い URL パス（`/logs`、`/resources`、`/scheduler`、`/mind-calculator`）は新パスへ自動リダイレクトされ、ブックマークの破損を防ぎます。

## <DocIcon name="plug" /> API 規約と通信クライアント

```ts
import { api } from '../api/client'

const list = await api.request('instances.list', {})
```

- `frontend/src/api/generated.ts` は `dev_tools.export_api_schema` により自動生成され、全メソッド名とパラメータの TypeScript 型定義を含みます。
- `frontend/src/api/contract.json` は完全な JSON Schema であり、自動検証テストで使用されます。
- **自動生成ファイルを直接手編集しないでください**。バックエンド側のモデルを修正した後にスクリプトで再出力してください。

`api.request` はリクエスト ID の採番、タイムアウト制御、エラーコードからユーザー向け通知へのマッピング、切断時の自動再接続処理を透過的に担います。

## <DocIcon name="box" /> 状態管理アーキテクチャ

Redux や Zustand などの外部状態管理ライブラリは導入していません。状態は3系統に分類されて管理されます：

| 状態種別 | 格納・管理レイヤー | 具体例 |
| --- | --- | --- |
| サーバー状態 | WebSocket イベント購読 ＋ リクエスト結果 | インスタンス一覧、現在タスク、統計データ |
| フォーム編集状態 | `config/EditQueue.ts` | 設定フォーム上の未送信変更キュー |
| UI 設定・好み | localStorage ＋ コンテキスト | テーマ、レイアウト密度、直前に開いていたパス |

### 設定保存キュー（EditQueue）

文字入力のたびに即座に API リクエストを送信するのではなく、バッファリング制御が行われます：

1. ユーザーの入力変更はまず `EditQueue` に格納されます。
2. 同一設定パスへの連続した入力変更はマージ集約されます。
3. `revision` 番号を添えて `config.patch` をバッチ送信します。
4. バージョン競合が発生した場合はユーザーに通知し、他者の編集結果を勝手に上書きしません。

画面を離脱する際はキューのフラッシュ完了を待機するため、「入力直後に別ページへ移動して設定が消える」現象を防止します。

## <DocIcon name="message-text" /> 国際化（i18n）

- `i18n.resources.ts` にフロントエンドの UI テキストが定義されており、`zh-CN` をマスターとします。
- タスク名や設定項目の詳細な説明文はフロントエンド内には持たず、Python 側の `module/config/i18n/*.json` から `schema.get` を経由して動的に受給します。

新規 UI 文言を追加する際は、少なくとも `zh-CN` と `en-US` を定義してください。

## <DocIcon name="zap" /> ビジュアルスケジューラーキャンバス

`src/scheduler/` はノードベースのカスタムスケジューラーの中心部です：

- ノードと接続ポートのデータモデルはバックエンドの `module/scheduler/` に準拠し、フロントエンドはレンダリングと操作を担当します。
- 四角いポートは実行シーケンス、丸いポートはデータフローを制御し、型の異なるポート同士の結線はブロックされます。
- 保存前に `scheduler.program.validate` を呼び出して整合性を事前検証します。

## <DocIcon name="rainbow" /> スタイリングとデザイン規約

- グローバル変数や共通クラスは `styles/` に集約し、コンポーネント固有のスタイルは同一ディレクトリ内に近接配置します。
- カラー値は CSS 変数（カスタムプロパティ）を使用し、ハードコードされた HEX カラーを記述しないでください。
- レスポンシブ設計により、モバイル幅ではサイドバーが自動収納されます。

## <DocIcon name="laptop" /> ローカル開発環境の起動

```bash
npm ci --prefix frontend
npm run dev --prefix frontend        # バックエンドがポート 25548 で起動している必要があります
npm run dev:mock --prefix frontend   # モックサーバーを使用し、バックエンドなしで単体起動
```

Vite 開発サーバーは `127.0.0.1` で待機し、API 呼び出しをバックエンドへプロキシします。純粋な UI 修正であれば `dev:mock` を活用することで手軽に作業できます。

## <DocIcon name="flask" /> テストコマンド

| テスト種別 | 実行コマンド | 検証範囲 |
| --- | --- | --- |
| 型検査 | `npm run typecheck --prefix frontend` | 全 TS/TSX コード |
| 単体テスト | `npm test --prefix frontend` | コンポーネント、カスタムフック、ユーティリティ |
| E2E テスト（実機） | `npm run test:e2e --prefix frontend` | 実バックエンドを介した統合検証 |
| E2E テスト（モック） | `npm run test:e2e:mock --prefix frontend` | モックサーバー環境での主要 UI 動作 |
| 取引所テスト | `npm run test:e2e:stock --prefix frontend` | 取引所機能の専用フロー検証 |

## <DocIcon name="package" /> 静的ビルド

```bash
npm run build --prefix frontend
```

- `tsc -b` による型検査を通過した後、`vite build` が実行されます。
- 生成物は `frontend/dist` に出力され、バックエンドにより静的ホスティングされます。

## <DocIcon name="shield" /> 開発時の留意事項

| 開発項目 | 遵守すべき規約 |
| --- | --- |
| 新規 API の追加 | 必ず Python 側のモデルを先に改変してスキーマを出力してからフロントエンドを記述 |
| 設定項目の追加 | フロントエンド側のフォームコードは触らない（スキーマ駆動で自動生成） |
| 配色変更 | CSS 変数を使用し、直接のカラーコード記述を避ける |
| アイコン | `lucide-react` で統一 |
| コンポーネント設計 | 巨大化したロジックは `components/` 配下に切り出し、ページ側は構成のみを担当 |
