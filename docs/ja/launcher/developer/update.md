---
title: 更新パイプラインとミラー
description: コアリポジトリの git 更新、uv 依存関係同期、ランチャー本体の mTLS 自己自動更新、ミラーとフォールバック戦略。
updated: 2026-10-20
---

# 更新パイプラインとミラー

ランチャーには2系統の更新パイプラインが存在し、完全に異なるプロトコルを採用しています：コアプログラムのコードは git を使用し、ランチャー本体は mTLS ＋ 静的マニフェストを使用します。

## <DocIcon name="refresh" /> コアリポジトリの更新パイプライン

```text
git pull
  ├── 成功 → uv sync --frozen
  └── 失敗 → 指数バックオフによる再試行（最大20回）
```

最大20回のリトライは「ネットワーク復旧を待つ」ためではなく、中国本土等からの GitHub への間欠的な接続遮断に耐えるための設計です。上限を超過した場合はエラー画面へ遷移し、中途半端に破損したコードで起動することを防ぎます。

### デプロイ構成ファイル

`deploy.<platform>[-cn].yaml` が更新挙動を制御します：

| 設定項目 | 説明 |
| --- | --- |
| `Git.Repository` | リポジトリの取得先 URL |
| `Git.Branch` | 対象ブランチ（デフォルトは `master`） |
| `Git.GitExecutable` | `.venv` 内に配置された git のバイナリパス |
| `Git.GitProxy` | HTTP / SOCKS5 プロキシ設定 |
| `Git.SSLVerify` | SSL 証明書検証の要否 |
| `Python.PypiMirror` | PyPI のパッケージミラー URL |

6種類のバリアント：

| プラットフォーム | 国際版 | 中国本土向け（CN）版 |
| --- | --- | --- |
| Windows | `deploy.windows.yaml` | `deploy.windows-cn.yaml` |
| macOS | `deploy.mac.yaml` | `deploy.mac-cn.yaml` |
| Linux / Unix | `deploy.unix.yaml` | `deploy.unix-cn.yaml` |

CN 版ではリポジトリ URL が `git://git.pull/AzurPilot` に切り替えられ、国内 PyPI ミラーが優先設定されます。

### 依存関係の同期

```bash
uv sync --frozen
```

- `uv.lock` に記録されたバージョンを厳格に順守し、再解決は行いません。
- 依存関係の導入に失敗した場合はエラー画面を表示し、バックエンドの起動を抑止します。
- `.venv` は再配置可能であり、プロジェクトフォルダごと移動可能です。

### Python の取得先ミラー

`setup.rs` は以下の順序でダウンロードを試行します：

```text
1. registry.npmmirror.com/-/binary/python-build-standalone/
2. mirror.nju.edu.cn/github-release/astral-sh/python-build-standalone/
3. python-standalone.org/mirror/astral-sh/python-build-standalone/
4. github.com/astral-sh/python-build-standalone/releases/download/
```

PyPI パッケージは Alibaba Cloud、Tencent Cloud、CERNET、公式の順序でフォールバックします。

## <DocIcon name="medal" /> ランチャー本体の自己自動更新

| 項目 | 設定内容 |
| --- | --- |
| デフォルトマニフェスト | `https://launcher-api.azurpilot.com/updata/stable.json` |
| 上書き用環境変数 | `LAUNCHER_UPDATE_URL` |
| 通信セキュリティ | mTLS（クライアント証明書は CI ビルド時に注入） |
| 配布ストレージ | Cloudflare R2 ＋ CNB Release |
| マニフェスト配信 | Cloudflare Pages（静的アセット配信、Worker スクリプト非依存） |
| ダウンロードエントリ | `launcher-download.azurpilot.com`（302 リダイレクト） |

::: tip なぜ Worker ではなく静的アセットなのか
Cloudflare Worker はリクエスト数に応じた課金やコールドスタートの問題が伴います。更新マニフェストは静的な JSON ファイルであるため、静的アセットホスティングを利用することで Workers の割り当てを消費せず高可用性を実現できます。
:::

### 検証シーケンス

1. mTLS による暗号化セッションを確立し、サーバーの真正性を検証。
2. `stable.json` を取得し、バージョン番号を比較。
3. アップデートペイロードを取得し、サイズと SHA256 ダイジェストを照合。
4. 実行ファイルを安全に置換して再起動。

途中でエラーが発生した場合は次のミラーへフォールバックします。すべての取得先が失敗した場合は現在のバージョンを維持し、ユーザーの利用を妨げません。

## <DocIcon name="handshake" /> 2つの更新系統の相互影響

| イベント | コアプログラムへの影響 | ランチャー本体への影響 |
| --- | --- | --- |
| コアの更新 | ソースコードと依存ライブラリの更新 | 影響なし |
| ランチャーの更新 | 影響なし | 実行バイナリの置換 |
| ランチャーが新 Python を要求 | 影響なし | `.venv` の再構築 |
| コアが新規依存関係を要求 | `uv sync` により導入 | 影響なし |

::: warning 両者を同時にアップデートすることは避けてください
まずランチャーを更新して新環境に対応させ、その後にコアプログラムを更新するか、またはその逆の順序で個別に適用してください。両方を同時に更新して問題が発生した場合、どちらの変更が原因であるかの切り分けが極めて困難になります。
:::

## <DocIcon name="cloud" /> プロキシのバイパスルール

ランチャーは以下の通信において**システムプロキシを明示的にバイパス**します：

- コアプログラムのコード取得、内包 Python、uv および依存関係の取得処理。
- WebView からローカル WebUI への接続（`--no-proxy-server`）。

理由：ローカルループバック接続は外部プロキシを経由すべきではなく、またダウンローダー自身が独自のリトライ・ミラーフォールバック戦略を持っているため、システムプロキシの介在は障害要因を増やすだけに終わるためです。

プロキシが必要な場合は、`deploy.yaml` の `Git.GitProxy` に個別に設定してください。

## <DocIcon name="settings" /> プライベート環境での運用

| 要件 | 設定手順 |
| --- | --- |
| 独自のコア Fork リポジトリを使用 | `Git.Repository` および `Branch` を変更 |
| 独自の更新サーバーを利用 | ビルド時に `LAUNCHER_UPDATE_URL` を指定 |
| イントラネットミラーの構築 | 同一構造の `stable.json` とアーカイブを内部 Web サーバーに配置 |
| 完全オフライン環境での運用 | ネットワークのある環境で一度初期化を完了させた後、`--skip-update` で起動 |
