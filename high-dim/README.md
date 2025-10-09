# High-Dimensional Embedding Analysis

このディレクトリは、政策提案の引数（argument）に対して高次元埋め込みベクトル（embedding）を生成し、分析するための実験用フォルダです。

## 概要

`args.csv`に含まれる21,348件の政策提案の引数テキストに対して、OpenAI APIを使用して1536次元のembeddingベクトルを生成します。これにより、意味的に類似した政策提案の発見や、クラスタリング、次元削減などの高度な分析が可能になります。

## ファイル構成

```
high-dim/
├── README.md                      # このファイル
├── .env                           # 環境変数（OPENAI_API_KEY）
├── args.csv                       # 入力データ（21,348件の引数）
├── create_embeddings.py           # Embedding生成スクリプト
├── embeddings-1536dim.pickle      # 出力ファイル（生成後）
└── venv/                          # Python仮想環境
```

(nishio) args.csvは https://drive.google.com/drive/folders/1XCp_gauahDqWqizc3HeqoVuwv7WrXGE8 から取得せよ。生成されたembeddings-1536dim.pickleもそこに置いてある。

## セットアップ

### 1. 仮想環境の作成とアクティベート

```bash
python3 -m venv venv
source venv/bin/activate
```

### 2. 依存パッケージのインストール

```bash
pip install openai python-dotenv
```

### 3. APIキーの設定

`.env`ファイルにOpenAI APIキーを設定してください：

```bash
OPENAI_API_KEY=your_api_key_here
```

## 使い方

### コスト見積もり

実行前にコストを見積もることができます：

```bash
source venv/bin/activate
python create_embeddings.py --estimate-only
```

**見積もり結果（全データ）:**
- 件数: 21,348件
- 推定トークン数: 約1,601,100トークン
- 推定コスト: 約$0.032
- 推定ファイルサイズ: 約290MB

### テスト実行（少量データ）

まず10件で動作確認することをお勧めします：

```bash
source venv/bin/activate
python create_embeddings.py --limit 10 --output test_embeddings.pickle
```

### 全データで実行

```bash
source venv/bin/activate
python create_embeddings.py
```

デフォルトで`embeddings-1536dim.pickle`に保存されます。

### オプション

```bash
python create_embeddings.py [オプション]

オプション:
  --input CSV_PATH              入力CSVファイル（デフォルト: args.csv）
  --output PICKLE_PATH          出力pickleファイル（デフォルト: embeddings-1536dim.pickle）
  --model MODEL_NAME            使用するモデル（デフォルト: text-embedding-3-small）
                                選択肢: text-embedding-3-small, text-embedding-3-large
  --batch-size N                バッチサイズ（デフォルト: 100）
  --limit N                     処理件数の上限（テスト用）
  --estimate-only               コスト見積もりのみ表示
  --api-key KEY                 APIキー（.envファイル推奨）
```

### 使用例

```bash
# 大きいモデルで実行（より高精度、コスト高）
python create_embeddings.py --model text-embedding-3-large --output embeddings-3072dim.pickle

# 最初の100件のみ処理
python create_embeddings.py --limit 100

# バッチサイズを変更
python create_embeddings.py --batch-size 200
```

## 出力形式

生成される`embeddings-1536dim.pickle`は、以下の構造のPython辞書をpickle形式でシリアライズしたものです：

```python
{
  "Acsv-1_0": {
    "argument": "発達障害を持つ子どもへの合理的配慮が不十分である",
    "embedding": [0.0816, 0.0085, -0.0181, ...],  # 1536次元のリスト
    "model": "text-embedding-3-small"
  },
  "Acsv-2_0": {
    ...
  },
  ...
}
```

### pickleファイルの読み込み

```python
import pickle

with open('embeddings-1536dim.pickle', 'rb') as f:
    embeddings = pickle.load(f)

# 使用例
arg_id = "Acsv-1_0"
embedding_vector = embeddings[arg_id]["embedding"]
argument_text = embeddings[arg_id]["argument"]

print(f"Argument: {argument_text}")
print(f"Embedding dimension: {len(embedding_vector)}")
```

## モデルについて

### text-embedding-3-small（デフォルト）
- **次元数**: 1536
- **コスト**: $0.020 / 1M tokens
- **用途**: 一般的な用途、コスト効率重視

### text-embedding-3-large
- **次元数**: 3072
- **コスト**: $0.130 / 1M tokens
- **用途**: より高精度な類似度計算が必要な場合

## 進捗保存

スクリプトは10バッチごとに自動的に進捗を保存します。エラーが発生した場合でも、処理済みのデータは失われません。中断した場合は、既存のpickleファイルを確認して、どこまで処理されたかを確認できます。

## トラブルシューティング

### APIキーエラー

```
OpenAIError: The api_key client option must be set
```

→ `.env`ファイルに`OPENAI_API_KEY`が設定されているか確認してください。

### Rate Limit エラー

スクリプトは自動的にリトライしますが、頻繁にエラーが出る場合は`--batch-size`を小さくしてください：

```bash
python create_embeddings.py --batch-size 50
```

### メモリ不足

全データを一度にメモリに読み込むため、大量データの場合はメモリ使用量が多くなります。必要に応じて`--limit`で分割処理してください。

## 参考リンク

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [text-embedding-3 models](https://platform.openai.com/docs/guides/embeddings/embedding-models)
- [親プロジェクト README](../README.md)

## 次のステップ

生成されたembeddingを使って以下のような分析が可能です：

1. **類似度計算**: コサイン類似度で意味的に近い政策提案を発見
2. **クラスタリング**: k-meansやHDBSCANで政策提案をグループ化
3. **次元削減**: UMAP, t-SNEで2D/3D可視化
4. **異常検出**: 他と大きく異なる提案の発見
5. **セマンティック検索**: クエリテキストから関連する政策提案を検索
