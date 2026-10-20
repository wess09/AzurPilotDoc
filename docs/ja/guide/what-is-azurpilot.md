---
title: AzurPilot とは
description: AzurPilot の位置付け、技術スタック、サポート範囲、および行わないことの定義について解説します。
updated: 2026-10-20
---

# AzurPilot とは

<DocIcon name="bot" /> AzurPilot は『アズールレーン』向けの自動化フレームワークです。ADB を介して Android エミュレーターや実機に接続し、「スクリーンショット → 認識 → 操作」のループを回すことで、デイリー任務、出撃、大世界（オペレーション・サイレン）などの定型処理をプログラムに代行させます。

本プログラムはチートツールではなく、ゲームクライアントの改変も一切行いません。すべての操作は画面上で実行され、プレイヤーの手動タップと同一の入力パイプラインを経由します。

## <DocIcon name="settings" /> 技術スタック

| レイヤー | 実装 | 説明 |
| --- | --- | --- |
| スケジューリング | `alas.py` | インスタンスごとに1プロセスを割り当て、タスクを順次実行し、エラー発生時は段階的に復旧 |
| 認識 | OpenCV テンプレートマッチング + OCR + マップグリッド検出 | リソースは 1280×720 を基準に制作され、CN / EN / JP / TW の4言語セットに対応 |
| デバイス制御 | uiautomator2 / ADB / minitouch / MaaTouch | スクリーンショットおよび操作方式は設定から切り替え可能 |
| インターフェース | React + TypeScript + Vite | ブラウザからアクセス、デフォルトポート 25548 |
| 通信 | WebSocket RPC（`/api/v1/ws`） | フロントエンド、Android ホスト、外部ツール共通 |
| 拡張機能 | MCP SSE サービス | MCP 対応クライアントから呼び出せる 18 個のツールを提供 |

## <DocIcon name="compass" /> サポート範囲

- <DocIcon name="cloud" /> **サーバー**：中国大陸版（BiliBili 版および各アグリゲーター版）、グローバル版、日本版、台湾版。アグリゲーター版はパッケージ名で識別されます。一覧は[デバイス接続](/ja/azurpilot/user/device#ゲームサーバー)を参照してください。
- <DocIcon name="laptop" /> **動作環境**：Windows、macOS、Linux（ランチャー経由）；Android 9.0+（ホスト経由）；Python 3.14 が稼働する任意の環境（ソースコード経由）。
- <DocIcon name="monitor" /> **ゲーム解像度**：1280×720。これは推奨値ではなく必須要件です。
- <DocIcon name="ban" /> **実機直接接続の非サポート**（コアプログラム側）。Android 版は仮想ディスプレイを通じて端末を「被制御側」にする別系統のアーキテクチャを採用しています。

## <DocIcon name="shield" /> 明確に行わないこと

- <DocIcon name="ban" /> ゲームメモリの改変、プロセスの注入、リソースの改ざんは行いません。
- <DocIcon name="ban" /> アカウントの代行、売買、共有サービスは提供しません。
- <DocIcon name="ban" /> ゲームのアンチチートやリスク管理システムの回避は行いません。自動化には常にアカウント処分のリスクが伴います。
- <DocIcon name="ban" /> すべてのイベント海域における自動攻略は保証しません。イベントのギミックは頻繁に変更されるため、一部コンテンツは手動での事前進行が必要です。

## <DocIcon name="zap" /> タスク実行時の内部挙動

「研究（科研）」を例とした実行シーケンス：

1. WebUI が `Research.Scheduler.NextRun` を `config/<インスタンス>.json` に書き込みます。
2. スケジューラーが実行期限を迎えたタスクを選定し、タスクパラメータを `self.config.Research_*` にバインドします。
3. `run('research')` が `alas.py` 内の同名メソッドを呼び出し、`module/research/research.py` を遅延インポートします。
4. モジュールは `device.screenshot()` でスクリーンショットを取得し、テンプレートマッチングと OCR で現在画面を判定後、`device.click()` で進行します。
5. 処理終了時に `task_delay()` を呼び出して次回実行時刻を保存し、スケジューラーは次の実行ループへ移行します。

例外の段階処理や自動復旧を含む完全なライフサイクルは[スケジューラーのライフサイクル](/ja/azurpilot/developer/scheduler)を参照してください。

## <DocIcon name="rocket" /> 次のステップ

<ul class="ap-linklist">
<li><a href="/ja/guide/ecosystem">3つのプロジェクトの関係<span class="desc">利用目的に適したリポジトリの選択</span></a></li>
<li><a href="/ja/guide/requirements">動作環境と互換性<span class="desc">導入前の環境要件チェック</span></a></li>
<li><a href="/ja/azurpilot/user/webui">WebUI ガイド<span class="desc">導入後の画面操作解説</span></a></li>
</ul>
