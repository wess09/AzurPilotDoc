---
title: コアプログラム概要
description: AzurPilot コアリポジトリの提供機能、WebUI の画面構成、タスク分類、実行モデル。Android 版およびランチャーがホストする基盤本体。
updated: 2026-10-20
---

# コアプログラム概要

コアプログラム（[wess09/AzurPilot](https://github.com/wess09/AzurPilot)、デフォルトブランチ `master`）は、ゲーム内の自動化ロジックを含む唯一のリポジトリです。ランチャーや Android ホストは、すべてこのコアプログラムを稼働させるための実行シェルにすぎません。

<div class="ap-meta">
<span><b>開発言語</b> Python 3.14</span>
<span><b>UI フレームワーク</b> React + Vite</span>
<span><b>デフォルトポート</b> 25548</span>
<span><b>画像認識基準</b> 1280×720</span>
<span><b>ライセンス</b> GPL-3.0</span>
</div>

## <DocIcon name="box" /> コアプログラムの階層構造

<CoreArchDiagram />

<Figure caption="階層構造は依存の方向性を示しています：上位レイヤーは下位レイヤーを呼び出せますが、下位レイヤーは上位レイヤーを意識しません。業務モジュール同士が直接結合することはありません。" />

| レイヤー | 主要パス | 責務と役割 |
| --- | --- | --- |
| エントリ | `alas.py`、`gui.py`、`mcp_server_sse.py`、`tui.py` | スケジューリングループ、WebUI バックエンド、MCP サービス、ターミナルコンソール |
| ランタイム | `module/api/`、`module/runtime/` | WebSocket ルーティング、プロセス管理、更新、リモートアクセス、アカウントヴォールト |
| 業務ロジック | `module/<機能>/`、`campaign/` | 各ゲームコンテンツごとの自動化実装（`run()` の実装およびマップ定義） |
| 基盤機能 | `module/device/`、`ui/`、`ocr/`、`map/`、`combat/` | スクリーンショット、タップ、UI 遷移、画像認識、経路探索、戦闘処理 |
| データ永続化 | `config/`、SQLite 統合 DB、`assets/` | ユーザー設定、統計データ、4サーバー別の画像認識アセット |

## <DocIcon name="settings" /> 3層の実行プロセスモデル

1. <DocIcon name="monitor" /> **`gui.py` は親プロセス**。HTTP/WebSocket サーバーおよび静的フロントエンドをホストし、ゲーム操作自体は直接行いません。
2. <DocIcon name="zap" /> **インスタンスごとに1つの worker プロセスを起動**。`ProcessManager` が `multiprocessing.Process` を用いて生成し、プロセス内で `AzurLaneAutoScript.loop()` が実行されます。
3. <DocIcon name="clock" /> **worker 内のメインスレッドでタスクを順次実行**。監視スレッドや日報スレッドはバックグラウンド補助スレッドであり、ゲーム操作タスクを並行実行することはありません。

このモデルから導かれる重要な動作仕様：

- <DocIcon name="circle-alert" /> インスタンスの停止 ＝ 対象 worker プロセスツリーの終了であり、WebUI 自体は稼働し続けます。
- <DocIcon name="circle-alert" /> 同一インスタンスで2つ以上のタスクを同時に実行することは原理的に不可能です。並列周回には複数インスタンス ＋ 複数エミュレーターが必要です。
- <DocIcon name="circle-alert" /> WebUI を終了させた場合、実行中のワーカーはどうなるか？ —— **一緒に終了します**。ワーカーは `gui.py` によって生成・管理されているため、親プロセスの終了時に回収されます。

## <DocIcon name="monitor" /> WebUI の画面構成

| 画面 | パス | 表示内容 |
| --- | --- | --- |
| ホーム | `/` | インスタンス一覧カード、一括開始/停止、お知らせ |
| インスタンスダッシュボード | `/i/<インスタンス>/overview` | 現在のタスク、保有資材、最新ログ、クイック操作 |
| タスク設定 | `/i/<インスタンス>/task/<タスク>` | 設定スキーマに基づき動的生成される設定フォーム |
| 統計レポート | `/i/<インスタンス>/statistics` | 資材推移、出撃回数、大世界、委託等の各種グラフ |
| スケジューラープログラム | `/i/<インスタンス>/task/SchedulerProgram` | ビジュアルフローによる高度なスケジューリング編排 |
| メンタル計算機 | `/i/<インスタンス>/task/MindCalculator` | ドック認識スキャンおよびメンタルユニット必要数計算 |
| 艦隊技術 | `/i/<インスタンス>/task/FleetTechnology` | 艦隊技術ポイントのスキャンと集計 |
| システム設定 | `/settings` | アカウントヴォールト、リモートアクセス、更新、外観 |
| 設定管理 | `/configs` | インスタンス設定のインポート、エクスポート、複製、削除 |

各画面の詳細解説は [WebUI ガイド](/ja/azurpilot/user/webui) を参照してください。

## <DocIcon name="compass" /> タスクの分類体系

WebUI のタスクメニューは `module/config/argument/task.yaml` に基づいて構成されており、以下の12の大分類に分かれています：

| 分類グループ | 名称 | 代表的なタスク |
| --- | --- | --- |
| `Alas` | システム設定 | エミュレーター設定、エラー処理、バックアップ、日報 |
| `Farm` | 通常出撃 | メイン海域 1/2/3、緊急委託、低燃費周回 |
| `Event` | イベント海域 | イベント海域 1/2/3、共闘、作戦履歴 |
| `EventDaily` | イベントデイリー | デイリー A/B/C/D/SP 海域 |
| `Reward` | 自動回収 | 委託、研究（科研）、寮舎、指揮ニャ、大艦隊 |
| `DailyMission` | デイリー任務 | デイリー任務、限界挑戦、ハード海域、演習 |
| `Opsi` | セイレーン作戦 | マップ攻略、秘密海域、深淵、要塞、自律最適化 |
| `Island` | 島開発計画 | 農園、牧場、レストラン、製造、デイリー採掘 |
| `FleetManagement` | 艦隊管理 | 艦隊スキャン、編成情報保存 |
| `RunParams` | 実行パラメータ | スケジューラーとデバイスの動作ペース調整 |
| `Tool` | ユーティリティ | 半自動タップ、ベンチマーク、OCR テスト、規制解除 |
| `Dashboard` | ダッシュボード | リソース上限および表示色のカスタマイズ |

全 102 個のタスクコマンド一覧は[タスクコマンド一覧](/ja/reference/tasks)を参照してください。

::: tip タスク数はバージョンにより変動します
期間限定イベントの仕様変更に伴いタスクは追加・削除され、`alas.py` 内のタスクメソッド数もバージョンにより変動します。
:::

## <DocIcon name="plug" /> 拡張開発の最小ステップ

新規機能追加の最小サイクルは**3箇所の同名登録 ＋ 1つの `run()` 実装**です：

1. <DocIcon name="file-pen" /> `task.yaml` にタスク名とメニューグループを登録。
2. <DocIcon name="file-pen" /> `alas.py` に同名のメソッドを追加（キャメルケースからスネークケースへ変換）。
3. <DocIcon name="folder" /> `module/<機能>/` に処理クラスを実装し、エントリポイント `run()` を提供。
4. <DocIcon name="refresh" /> `uv run -m module.config.config_updater` を実行して設定成果物を自動生成。

詳細な開発ガイドと注意点は[新規タスクの追加](/ja/azurpilot/developer/module-dev)を参照してください。

## <DocIcon name="map" /> 関連マニュアル

<ul class="ap-linklist">
<li><a href="/ja/azurpilot/user/webui">WebUI ガイド<span class="desc">各画面の機能と操作方法</span></a></li>
<li><a href="/ja/azurpilot/user/device">エミュレーターと ADB の接続<span class="desc">Serial・スクリーンショット・操作設定</span></a></li>
<li><a href="/ja/azurpilot/user/scheduler">スケジューラーとタスク編成<span class="desc">優先度・インターバル・エラー復帰</span></a></li>
<li><a href="/ja/azurpilot/user/tasks/">タスク一覧<span class="desc">コンテンツ別の設定詳細</span></a></li>
</ul>
