---
title: 初回起動と環境構築
description: Launcher 3.x の Git／ADB 配置、Python 初期化、コア更新、WebUI 構築および初回ログインの手順。
updated: 2026-10-31
---

# 初回起動と環境構築

Launcher 3.x では **「デプロイ」と「起動」を分けて**実行します。Git、ADB、uv、Python を手動で用意する必要はありません。

## 1. デプロイ

初回画面で「デプロイ」を選びます。`stable.json.runtime`（schema 2）から Git／ADB 部品を取得して SHA-256 を検証し、`.azurpilot/tools/` に展開します。続いて `deploy/**` と OS 別の設定テンプレートを補います。この段階では Python やコアコードをインストールせず、完了後に「起動」ボタンへ切り替わります。

## 2. 起動

1. 内蔵 uv が Python 3.14.x をインストールし、`.venv` と初期依存関係を準備します。
2. `deploy.git` が AzurPilot コアを取得／更新します。
3. `uv.lock` に基づく依存関係同期と WebUI の構築を実行します。Node.js が必要になる場合があります。
4. `gui.py`（通常は `127.0.0.1:22267`）を起動し、保護された WebSocket v2 と使い捨てのログイン票で WebUI を開きます。

Git／ADB は `.venv` とは別に保存されます。Python の再構築だけで全ての部品を再ダウンロードするわけではありません。

## 設定とエラー

設定では Stable／Canary、部品・Python・PyPI のミラー、言語、背景音声、動きを減らす設定、スリープ抑止などを選べます。進行中のキャンセルは二度目のクリックで確定します。

| 症状 | 確認事項 |
| --- | --- |
| 部品が取得できない | ネットワーク、選択中のミラー、空き容量 |
| `pyproject.toml` がない | コアの展開不完全。「環境修復」を使用 |
| 依存関係や WebUI の失敗 | PyPI／Node.js とログ |
| 後端のタイムアウト | ポート `22267` とログ |
| 不具合報告 | 画面写真だけでなくログ ZIP を添付 |

[修復と更新](/ja/launcher/user/maintenance)と[アーキテクチャ](/ja/launcher/developer/architecture)を参照してください。
