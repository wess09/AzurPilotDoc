---
title: CLI・ポート・環境変数
description: gui.py、alas.py、tui.py、MCP サービスの起動引数、使用ポート一覧、ディレクトリ規則、環境変数の仕様。
updated: 2026-10-20
---

# CLI・ポート・環境変数

## <DocIcon name="rocket" /> エントリポイント一覧

| コマンド | 役割 | 常駐性 |
| --- | --- | --- |
| `gui.py` | WebUI バックエンド ＋ プロセス監視 | 常駐 |
| `alas.py` | 単一インスタンススケジューラー | 常駐（インスタンス実行中） |
| `tui.py` | ターミナル操作画面 | 対話的 |
| `mcp_server_sse.py` | 独立 MCP SSE サービス | 常駐 |

## <DocIcon name="monitor" /> gui.py

```bash
uv run python gui.py [options]
```

| オプション | 役割 | デフォルト値 |
| --- | --- | --- |
| `--host` | リッスンアドレス | `deploy.yaml` の `WebuiHost`（未設定時は `0.0.0.0`） |
| `-p, --port` | リッスンポート | `WebuiPort`（未設定時は `25548`） |
| `-k, --key` | 認証パスワード | `deploy.yaml` の `Password` |
| `--ssl-key` | HTTPS 秘密鍵 | なし |
| `--ssl-cert` | HTTPS 証明書 | なし |
| `--run <实例...>` | 起動と同時に指定インスタンスを実行 | なし |
| `--electron` | Electron クライアントからの実行フラグ | 無効 |
| `--cdn` | 廃止済み | — |

実行例：

```bash
uv run python gui.py --host 127.0.0.1 -p 25548 -k "your-password"
uv run python gui.py --ssl-key key.pem --ssl-cert cert.pem
```

::: warning ポート番号の決定優先度
コマンドライン引数 > `deploy.yaml` > ソースコードのデフォルト値。ポート変更が反映されない場合は、デプロイ設定等で上書きされていないか確認してください。
:::

## <DocIcon name="zap" /> alas.py

```bash
uv run python alas.py [实例名]
```

| 動作 | 詳細 |
| --- | --- |
| インスタンス名省略時 | デフォルトの `ap` を使用 |
| 存在しないインスタンス名 | 終了コード 2 で即時終了（デフォルトへの自動フォールバックは**行いません**） |
| 停止方法 | プロセスの終了。停止制御ファイルや専用シグナルは非提供 |
| 作業ディレクトリ | `module/logger.py` インポート時に自動的にプロジェクトルートへ変更 |

外部スケジューラー連携規約は[スケジューラーのライフサイクル](/ja/azurpilot/developer/scheduler#外部调度器契约)を参照してください。

## <DocIcon name="file-pen" /> tui.py

ターミナルベースの UI です。コアプログラムの設定およびデバイス接続レイヤーを共有し、ブラウザのない環境や状態のクイック確認に適しています。

## <DocIcon name="plug" /> mcp_server_sse.py

```bash
uv run python mcp_server_sse.py
```

デフォルトでポート `22268` を使用します。OCR サービスとポートが重複しているため、同一マシンで併用する場合はどちらか一方を変更してください。

## <DocIcon name="plug" /> 使用ポート一覧

| ポート | 用途 | 設定変更の可否 |
| --- | --- | --- |
| `25548` | WebUI / WS | ✅ `WebuiPort` |
| `22267` | 启动器 WebUI | 启动器内部 |
| `22268` | 独立 MCP / OCR サービス | ✅ `OcrServerPort` で変更可能 |
| `22302` | Android OCR | Android 内部制御 |
| `22300` / `22400` | レガシーホストプロセス検出 | ❌ 変更不可 |

## <DocIcon name="key" /> 環境変数一覧

| 環境変数名 | 役割 | デフォルト値 |
| --- | --- | --- |
| `ALAS_DEBUG_SERVER` | `1` に設定時、ローカル限定のデバッグサービスを起動 | 無効 |
| `AZURPILOT_OCR_THREADS` | OCR セッションの intra-op スレッド数上限（1〜16） | 自動 |
| `AZURPILOT_ANDROID` | `1` に設定時、`/android/*` ルーティングを登録 | 無効 |
| `ALAS_LAUNCHER_PID` | ランチャーが注入。子プロセスの所属を識別 | なし |
| `ALAS_LAUNCHER_JOB_BREAKAWAY` | ランチャーが注入。Windows Job Object からの脱離を宣言 | なし |
| `ALAS_WEBUI_TRUST_SECRET` | ランチャーが注入するワンタイムログイン認証トークン | なし |
| `AZURPILOT_ANDROID_DIST_BASE` | 旧版 Android 事前ビルドフロントエンドのダウンロード基点 URL | なし |
| `AZURPILOT_ANDROID_GIT_MIRROR` | Android GitHub フォールバックミラーのプレフィックス | なし |
| `AZURPILOT_REPO` / `AZURPILOT_REF` | Android Runtime ビルド時のソースコード参照先 | なし |

::: danger ランチャー内部用環境変数の手動設定禁止
`ALAS_LAUNCHER_PID` を手動で設定すると、意図しないプロセススキャンクリーンアップに巻き込まれる恐れがあります。また、`ALAS_WEBUI_TRUST_SECRET` はパスワードレス認証トークンであるため、手動指定はセキュリティ境界を破壊します。
:::

## <DocIcon name="folder" /> 主要ディレクトリとパス

| パス | 内容 | 削除の可否 |
| --- | --- | --- |
| `config/` | インスタンス設定、`deploy.yaml`、`remote-access.json` | ❌ 削除不可 |
| `azurpilot.db` | 統計ログおよび永続化データ | ❌ 削除不可 |
| `log/` | 実行ログおよびエラー画面記録 | トラブルシューティング完了後に削除可 |
| `cache/` | ランタイムキャッシュ | ✅ 削除可 |
| `AzurPilot_Data_Backup/` | 日次自動バックアップ | 保持ポリシーに従い管理 |
| `.venv/` | Python 仮想環境 | 再構築可能 |
| `frontend/dist` | フロントエンドビルド成果物 | 再構築可能 |

データディレクトリの実際のパスは実行形態により決定されます。Android Runtime では rootfs 内の `/opt/azurpilot` に配置されます。

## <DocIcon name="circle-alert" /> プロセス終了ステータスのセマンティクス

`gui.py` の監視ループは以下の終了事由を識別します：

| 終了種別 | トリガー要因 |
| --- | --- |
| アップデート終了 | `stop_event` セット後にワーカーが正常終了 |
| 設定・初期化エラー | 起動フェーズで即時失敗（自動再起動は抑止） |
| 敏感任务停止 | 调度器 `exit(1)`，父进程感知 |
| ユーザー手動停止 | WebUI の停止操作によりプロセスツリーを終了 |

詳細な終了コードマッピングは `module/runtime/process_manager.py` および `gui.py` の監視ループの実装を参照してください。

## <DocIcon name="wrench" /> ドキュメントサイト管理コマンド

| コマンド | 役割 |
| --- | --- |
| `npm run dev` | ローカル開発サーバー起動 |
| `npm run build` | `docs/.vitepress/dist` への静的ビルド |
| `npm run preview` | ビルド成果物のローカルプレビュー |
| `npm run check` | リンク・ナビゲーション・SEO 検証 |
| `npm run test:e2e` | Playwright によるブラウザ E2E 検証 |
| `npm run shots` | 複数ブレークポイントでの画面キャプチャ検査 |
