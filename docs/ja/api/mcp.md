---
title: MCP サービス
description: 25 個の azurpilot_ ツール、SSE 接続、認証、デバイス制御リースと互換入口。
updated: 2026-11-08
---

# MCP サービス

MCP（Model Context Protocol）を使うと、対応クライアントや Agent から AzurPilot を照会・管理・操作できます。AI クライアント向けのセマンティックな入口であり、WebSocket API の代替ではありません。

## エンドポイントと認証

| 方式 | エンドポイント | 説明 |
| --- | --- | --- |
| WebUI にマウント | `http://<host>:25548/mcp/sse` | 既定方式。WebUI の Runtime とインスタンスを共有 |
| 独立サービス | `uv run python mcp_server_sse.py`、既定ポート 22268 | 分離デプロイやデバッグ向け |

独立 MCP と OCR サービスは既定で 22268 を使用します。同時に動かす場合は片方のポートを変更してください。MCP は WebUI パスワードを使用します。推奨は `Authorization: Bearer <WebUI password>`、互換方式は `X-API-Key: <WebUI password>` です。Header を設定できない場合のみ `?key=<WebUI password>` を使用してください。パスワード変更後は WebUI を再起動します。

::: danger パスワードを URL に含めないでください
クエリパラメーターはアクセスログや履歴に残る可能性があります。Authorization Header を優先してください。
:::

## 既定ツール一覧：25 個

既定エンドポイントが公開するのは次の **azurpilot_** ツール 25 個だけです。旧名称は明示的に作成した互換入口でのみ利用できます。

| 分類 | ツール | 用途 |
| --- | --- | --- |
| インスタンス | **azurpilot_list_instances**、**azurpilot_get_context**、**azurpilot_start_instance**、**azurpilot_stop_instance** | 一覧、状態確認、起動、停止 |
| タスク | **azurpilot_search_tasks**、**azurpilot_get_task_schema**、**azurpilot_set_task_schedule** | 検索、Schema 確認、有効状態と次回実行の設定 |
| 設定 | **azurpilot_get_config**、**azurpilot_patch_config** | 設定 / revision の取得、revision 検証後の一括更新、dry_run |
| ログ / 統計 | **azurpilot_get_logs**、**azurpilot_get_statistics**、**azurpilot_get_statistics_schema** | ログ、概要 / 資源 / 大世界 / 委託 / 研究統計、指標定義 |
| デバイス | **azurpilot_observe_device**、**azurpilot_acquire_device_control**、**azurpilot_release_device_control** | 画面取得、制御リースの取得 / 解放 |
| デバイス入力 | **azurpilot_click**、**azurpilot_swipe**、**azurpilot_long_press**、**azurpilot_input_text**、**azurpilot_press_key**、**azurpilot_adb_shell** | クリック、スワイプ、長押し、テキスト、キー、ADB Shell |
| 操作照会 | **azurpilot_get_operation** | 書き込み操作の状態と最終結果を照会 |
| 保守 / 更新 | **azurpilot_restart_emulator**、**azurpilot_restart_adb**、**azurpilot_update_application** | エミュレーター / ADB の再起動、コア更新 |

## デバイス制御と書き込み操作

- 直接操作の前に **azurpilot_acquire_device_control** でリースを取得し、終了後に **azurpilot_release_device_control** で解放します。
- 先に **azurpilot_observe_device** で画面と frame_id を取得します。座標操作に frame_id を付けると、画面サイズや向きが変わった後の古い座標を拒否できます。
- 入力ツールはコマンド送信と画面変化を区別します。**コマンド送信済みは UI 応答やタスク完了を意味しません。**
- 書き込み操作は request_id による重複排除と operation_id をサポートします。タイムアウトで結果が不明な場合は **azurpilot_get_operation** で確認してください。
- **azurpilot_patch_config** は revision で同時編集の上書きを防ぎます。変更前に設定を読み、必要に応じて dry_run を使います。
- **azurpilot_set_task_schedule** はスケジュール変更を示すもので、ゲーム内操作の成功ではありません。

既定一覧には get_status、get_resources、get_recent_logs、trigger_task、clear_scheduler_queue は含まれません。旧名称は明示的な互換入口でのみ利用できます。

**典型的な順序：** **azurpilot_list_instances** で選択し、**azurpilot_get_context** で状態を確認。設定変更前に読み取り、直接操作前に画面観測とリース取得を行い、不確かな書き込みは **azurpilot_get_operation** で確認します。

MCP は Agent 向けの限定インターフェース、WebSocket は WebUI、Android ホスト、独自クライアント向けの完全なインターフェースです。[WebSocket API](/ja/api/websocket) を参照してください。
