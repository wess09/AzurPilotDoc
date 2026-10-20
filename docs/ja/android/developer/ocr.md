---
title: OCR と画像認識パイプライン
description: 独立 :ocr プロセス、テンソル API、LiteRT/MNN バックエンド、NPU ハードウェア適合、CPU フォールバックと遅延測定。
updated: 2026-10-20
---

# OCR と画像認識パイプライン

Android 版の OCR 推論処理は Python プロセス内では実行されず、独立した `:ocr` ワーカープロセスに委譲されます。これにより、推論クラッシュ時にメイン UI が巻き添え終了することを防ぎ、各社 NPU 向けの専用ライブラリをプロセス単位でクリーンに分離できるメリットが得られます。

## <DocIcon name="zap" /> 推論呼び出しフロー

```text
PRoot 内部の AzurPilot（Python）
  → module/ocr の ONNX セッション生成が android_ocr.py によりプロキシ
    → モデルの真正性を検証（ソース SHA-256 ホワイトリスト）
      → 127.0.0.1:22302 経由で前処理済み NCHW テンソルを送信（認証トークン付き）
        → :ocr ワーカープロセスが推論を実行
          → logits 配列を返却
            → Python 側で CTC デコードおよび後処理を実行
```

明確な役割分担：

| 処理フェーズ | 実行場所 |
| --- | --- |
| 領域クロップ、二値化・文字色前処理 | Python（上流の OCR ロジック） |
| 機械学習モデルの推論 | Android `:ocr` プロセス |
| 辞書マッチング、CTC デコード、誤字補正 | Python |
| モデルバイナリファイル | APK 内に組み込み配置 |

インターフェースはプライベートにバインドされたワーカーサービスであり、**Root 権限や Shizuku は不要**です。

## <DocIcon name="brain" /> 使用モデルの仕様

2026-10-09 以降、モデルフォーマット 2 が採用されています：

- APK 内に **5つの認識モデル ＋ 1つの検出モデル** の LiteRT FP32 モデルを内包。
- HiSilicon 向けに別途 4つの MNN 変換モデルを保持。
- 生の ONNX、NCNN、旧 CnOCR の重みファイルは APK および rootfs には同梱されません。
- CPU 推論は LiteRT を使用し、末尾の Softmax 計算は GPU で実行可能です。

上流側でモデルの重みが改定された場合は、**必ず APK 側も更新する必要があります**。ホスト側はモデルの SHA-256 ホワイトリストを照合するため、未登録の古いモデルが誤用されたり、未変換の重みファイルへ静かにフォールバックすることはありません。

## <DocIcon name="settings" /> プラットフォーム別 NPU アクセラレーション

| SoC プラットフォーム | 実装方式 | 成立条件 |
| --- | --- | --- |
| Qualcomm Snapdragon | LiteRT → QNN HTP | Android 12 以降、ARM64。内蔵の Skel/Stub バージョンと合致 |
| MediaTek Dimensity | LiteRT → NeuroPilot | Android 12 以降、ARM64。システム側の APU ドライバが開放されていること |
| HiSilicon Kirin | MNN → HiAI NPU | Android 10 以降、ARM64。全オペレーターが HiAI に適合していること |
| Samsung Exynos | CPU フォールバック | AI LiteCore の AOT コンパイルが未通過 |
| Google Tensor | CPU フォールバック | 外部 Beta SDK が必要なため |
| Xiaomi Surge（玄戒） | CPU フォールバック | 適合するランタイムライブラリが非提供 |
| Android 9 / x86_64 | LiteRT CPU | 動作対象として維持 |

::: warning 端末ブランドのみで NPU 稼働を保証しないでください
NPU が有効化されるかどうかは端末のブランドではなく、搭載 SoC とベンダー提供ドライバの実態に依存します。同一メーカーであっても機種ごとに挙動が異なるため、確実な判定はアプリ起動時の実際の初期化ログを確認する必要があります。
:::

### ベンダーライブラリのプロセス分離

他社製 NPU のオフラインコンパイラが誤作動してモデルを横取りすることを防ぐため、ホストは現在の SoC ベンダー専用の分離ライブラリディレクトリを構築し、該当するライブラリへのシンボリックリンクのみを配置します。

Manifest 内では、ベンダー独自の RPC / NeuroPilot / HiAI ライブラリを `required=false` として宣言しています。これにより、該当ライブラリを持たない端末でもインストールが拒否されることなく CPU フォールバックで正常に動作します。

## <DocIcon name="refresh" /> エラー時のフォールバック処理

- 初期化の失敗、または推論時の例外発生 → 自動的に LiteRT CPU モードへ切り替え。
- 特定のモデルのみが NPU 上でクラッシュする場合 → メインプロセスがサービスを再バインドし、**当該モデルの NPU 使用のみを無効化**してクラッシュループを防止。
- 現在の稼働ステータスおよび原因はログに出力され、設定画面から現在のバックエンドを確認できます。

## <DocIcon name="clock" /> スレッド数とリソース配分

- マルチインスタンス稼働時にスレッドプールが端末の全コア数を奪い合うのを防ぐため、各 OCR セッションの intra-op スレッド数はデフォルトで適切に制限されています。
- 環境変数 `AZURPILOT_OCR_THREADS=1..16` により調整可能ですが、論理 CPU コア数を超過することはありません。
- 変更は新規セッションにのみ適用されます。

## <DocIcon name="eye" /> 画像キャプチャパイプライン

画面フレームの取得は ADB 経由を完全に廃止しています：

```text
ゲーム（仮想ディスプレイ）
  → 特権プロセスのネイティブブリッジがフレームバッファを取得
    → 匿名 SharedMemory（ashmem / memfd）
      → Unix 抽象ドメインソケット ＋ SCM_RIGHTS でファイルディスクリプタを共有
        → ホスト側が受領して読み取り
```

| 方式 | 平均転送遅延 | ストレージ書き込み |
| --- | --- | --- |
| 匿名共有メモリ方式 | **15.6 ms** | なし（RAM 完結） |
| TCP ソケット方式 | 47.2 ms | なし |

フレームのロックとアンロックは厳密に対になっていなければなりません。

## <DocIcon name="flask" /> ベンチマークと検証ツール

| 検証項目 | 検証手段 |
| --- | --- |
| OCR バックエンド | アプリ内 OCR テスト機能 / `tools/benchmark_*` |
| 仮想ディスプレイ性能 | `tools/benchmark_virtual_display.py` |
| フレーム転送遅延 | `tools/benchmark_capture_transport.py` |
| テンプレートマッチング | `tools/test_template_matching.py` |

デバイス上の Python 側には `OcrBenchmark` タスクが用意されており、実機上で CPU/GPU/NPU の所要時間を比較測定できます。

## <DocIcon name="shield" /> 開発時の禁止事項

| 禁止事項 | 理由 |
| --- | --- |
| Python 側で `android_ocr.py` を迂回して生 ONNX セッションを作成する | 端末内に存在しない重みファイルを読み込もうとしてクラッシュします |
| モデルファイルを差し替えたのに APK を更新しない | SHA-256 ホワイトリスト検証により拒否されます |
| `:ocr` プロセス内に辞書デコード等の後処理を持ち込む | 辞書や CTC は Python 側の契約責務です |
| すべての端末で NPU が動作すると決め打ちする | ベンダードライバやオペレーターの対応状況に大きな差異があります |
| フレームバッファのポインタをフレームを跨いで保持する | `UnlockPixels` 後はメモリ領域が無効化されます |

## <DocIcon name="circle-check" /> テストコマンド例

```bash
# ホスト側 OCR 関連コードのコンパイル
cd app && ./gradlew :app:compileDebugKotlin -x verifyBundledAzurPilotRuntime

# 実機 OCR ベンチマークのヘルプ確認
uv run python tools/benchmark_virtual_display.py --help
```

静的コンパイルが通ったことと、実機上で正確に文字認識が行えることは別問題です。認識精度は必ずターゲット実機上で実際のゲーム画面を用いて検証してください。
