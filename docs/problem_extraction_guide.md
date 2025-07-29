# PR問題抽出分析 - ローカル実行ガイド

## 概要

このガイドでは、policy-pr-hubの問題抽出分析機能をローカル環境で実行する手順を説明します。

## 前提条件

### 1. 必要なソフトウェア
- Python 3.8以上
- Git
- OpenRouter APIアカウント

### 2. 必要なデータ
- PRデータ（team-mirai-volunteer/pr-dataリポジトリから取得）

## セットアップ手順

### 1. リポジトリのクローンと環境構築

```bash
# policy-pr-hubリポジトリをクローン
git clone https://github.com/team-mirai-volunteer/policy-pr-hub.git
cd policy-pr-hub

# 依存関係をインストール
pip install -r requirements.txt
```

### 2. PRデータの準備

```bash
# pr-dataリポジトリをクローン（policy-pr-hubと同じ階層に配置）
cd ..
git clone https://github.com/team-mirai-volunteer/pr-data.git
cd policy-pr-hub
```

ディレクトリ構造:
```
parent-directory/
├── policy-pr-hub/
└── pr-data/
    └── prs/
        ├── 1.json
        ├── 2.json
        └── ...
```

### 3. OpenRouter APIキーの設定

```bash
# 環境変数として設定
export OPENROUTER_API_KEY=your_openrouter_api_key_here

# または.envファイルに保存（推奨）
echo "OPENROUTER_API_KEY=your_openrouter_api_key_here" > .env
```

## 実行方法

### 基本的な実行

```bash
# 全PRデータから問題を抽出
python src/analyzers/problem_extractor_main.py \
  --input-dir ../pr-data/prs \
  --output problems_all.json

# テスト用（少数のPRのみ処理）
python src/analyzers/problem_extractor_main.py \
  --input-dir ../pr-data/prs \
  --output problems_test.json \
  --limit 10
```

### コマンドラインオプション

| オプション | 説明 | 必須 | 例 |
|-----------|------|------|-----|
| `--input-dir` | PRデータのディレクトリパス | ✓ | `../pr-data/prs` |
| `--output` | 出力JSONファイルパス | ✓ | `problems.json` |
| `--api-key` | OpenRouter APIキー | - | `sk-or-...` |
| `--limit` | 処理するPR数の上限 | - | `100` |

## 出力形式

抽出結果は以下の形式のJSONファイルとして保存されます：

```json
{
  "1234": {
    "pr_title": "高齢者支援制度の改善提案",
    "pr_url": "https://github.com/...",
    "problems": [
      "高齢者の地域での孤立が深刻化している",
      "現在の支援制度では対応が不十分"
    ],
    "explanation": "PRから明確な問題意識が読み取れます",
    "extracted_at": "2025-01-15T10:30:00Z"
  }
}
```

## 実行時間とコストの目安

### テスト実行結果（100件のPR）
- **処理時間**: 約5-10分
- **抽出された問題数**: 165件
- **API使用料**: $0.264100
- **1件あたりの平均コスト**: 約$0.0026

### 全データ実行の推定値（約9,688件のPR）
- **推定処理時間**: 8-12時間
- **推定API使用料**: $25-30
- **推定抽出問題数**: 15,000-20,000件

## トラブルシューティング

### よくある問題と解決方法

#### 1. APIキーエラー
```
エラー: APIキーが設定されていません
```
**解決方法**: 環境変数`OPENROUTER_API_KEY`が正しく設定されているか確認

#### 2. PRデータが見つからない
```
エラー: ディレクトリが存在しません
```
**解決方法**: `--input-dir`パスが正しいか確認。pr-dataリポジトリがクローンされているか確認

#### 3. API制限エラー
```
エラー: Rate limit exceeded
```
**解決方法**: しばらく待ってから再実行。backoffライブラリが自動的に再試行します

#### 4. メモリ不足
```
エラー: Memory error
```
**解決方法**: `--limit`オプションで処理件数を制限して分割実行

## 実行例

### 1. 小規模テスト（推奨）
```bash
# 10件のPRで動作確認
python src/analyzers/problem_extractor_main.py \
  --input-dir ../pr-data/prs \
  --output test_10.json \
  --limit 10

# 結果確認
cat test_10.json | jq '.'
```

### 2. 中規模テスト
```bash
# 100件のPRで本格テスト
python src/analyzers/problem_extractor_main.py \
  --input-dir ../pr-data/prs \
  --output test_100.json \
  --limit 100
```

### 3. 全データ実行
```bash
# 全PRデータで本格実行（時間とコストに注意）
python src/analyzers/problem_extractor_main.py \
  --input-dir ../pr-data/prs \
  --output problems_all.json

# バックグラウンド実行（推奨）
nohup python src/analyzers/problem_extractor_main.py \
  --input-dir ../pr-data/prs \
  --output problems_all.json > extraction.log 2>&1 &

# 進捗確認
tail -f extraction.log
```

## 結果の分析

### 基本統計の確認
```bash
# 抽出された問題数の確認
cat problems_all.json | jq 'length'

# 問題が抽出されたPRの数
cat problems_all.json | jq '[.[] | select(.problems | length > 0)] | length'

# 最も多くの問題が抽出されたPR
cat problems_all.json | jq 'to_entries | max_by(.value.problems | length)'
```

### 問題カテゴリの分析
```python
import json

# 結果ファイルを読み込み
with open('problems_all.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 全問題を収集
all_problems = []
for pr_data in data.values():
    all_problems.extend(pr_data['problems'])

print(f"総問題数: {len(all_problems)}")
print(f"ユニーク問題数: {len(set(all_problems))}")
```

## 注意事項

1. **API使用料**: 大量のPRを処理する場合、相当なAPI使用料が発生します
2. **実行時間**: 全データの処理には数時間かかります
3. **ネットワーク**: 安定したインターネット接続が必要です
4. **バックアップ**: 重要な結果は複数の場所に保存することを推奨します

## サポート

問題が発生した場合は、以下の情報を含めてIssueを作成してください：

- 実行したコマンド
- エラーメッセージ
- 環境情報（OS、Pythonバージョンなど）
- 処理していたPR数
