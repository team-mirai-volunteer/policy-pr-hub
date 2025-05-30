# 開発者ガイド

このガイドは、政策プルリク活用ハブ（Policy PR Hub）の開発者向けに、システムの概要、実装方法、および拡張ポイントについて説明します。

## システム全体の目的とユーザー価値

政策プルリク活用ハブは、「いどばた政策」システムで収集された政策改善提案PRデータを分析・活用するためのプラットフォームです。以下のユーザー価値を提供しています：

1. **データ収集の自動化**
   - 定期的なPRデータの自動収集により、手動作業が不要
   - 最新のPRデータが常に利用可能

2. **データの構造化と保存**
   - PRデータをJSON形式で構造化して保存
   - PR番号ごとにファイル分割することで管理しやすい

3. **分析基盤の提供**
   - 政策分野別の分析レポート生成
   - セクション（見出し）分析

4. **政策改善プロセスの可視化**
   - どの政策分野に多くの改善提案があるかの可視化
   - 貢献者のパターンの把握

5. **データ活用の促進**
   - 収集したデータを基にした新たな分析や可視化の可能性
   - 政策立案・改善のためのエビデンスベースの提供

## 関連リポジトリの関係性

政策プルリク活用ハブは、以下のリポジトリと連携しています：

1. **team-mirai/policy**
   - 実際の政策提案PRが集まるリポジトリ
   - 市民からの政策改善提案の元データ

2. **team-mirai/random**
   - GitHub Actionsを使用してPRデータを定期的に収集
   - 収集したデータをJSON形式で保存
   - 現在はGit LFSを使用して大きなJSONファイルを管理

3. **team-mirai-volunteer/pr-data**
   - 収集されたPRデータの保存先
   - コードと分離して、データのみを保存

4. **team-mirai-volunteer/pr_analysis**
   - 新しいデータ収集・分析方法の実装を試みているリポジトリ
   - まだ安定稼働には至っていない

5. **digitaldemocracy2030/idobata**
   - 「いどばた政策」システムのリポジトリ
   - policy-editモジュールが政策提案の仕組みを提供

## 技術的制約と考慮事項

### GitHub API Rate Limitの制約

**重要**: 政策提案PRは1700件以上あり、GitHub APIのRate Limitに当たるため、一度にすべてのPRデータを取得することはできません。そのため、差分取得（incremental collection）が必須となっています。

現在の実装では以下の方法でこの制約に対応しています：

1. 更新時間順での収集（`collect_prs_by_update_time`メソッド）
   - 最近更新されたPRから順に取得
   - 前回の収集以降に更新されたPRのみを取得可能

2. 連番での収集（`collect_prs_sequentially`メソッド）
   - PR番号の範囲を指定して順番に取得
   - Rate Limitに達した場合は自動的に待機

3. バックオフと再試行の実装
   - API呼び出しの失敗時に指数バックオフで再試行
   - Rate Limitに達した場合はリセット時間まで待機

## 主要コンポーネントの詳細と使用例

### 1. PRデータ収集（`PRCollector`クラス）

PRデータを収集するための主要クラスです。GitHub APIを使用してPRの詳細情報、コメント、レビューコメント、変更ファイル、コミット情報などを取得します。

**使用例**:

```python
from src.collectors.pr_collector import PRCollector
from src.utils.github_api import load_config

# 設定ファイルの読み込み
config = load_config()

# PRコレクターの初期化
collector = PRCollector(config)

# 単一PRの収集
pr_data = collector.collect_pr_data(123)  # PR #123のデータを収集
collector.save_pr_data(pr_data)  # データをJSONファイルに保存

# 更新時間順にPRを収集（最大100件）
collector.collect_prs_by_update_time(max_count=100)

# 連番でPRを収集（PR #1から#100まで）
collector.collect_prs_sequentially(start_number=1, end_number=100)
```

### 2. セクション分析（`SectionAnalyzer`クラス）

PRで変更されたマークダウンファイルのセクション（見出し）を分析するクラスです。どのセクションが多く変更されているかを把握するのに役立ちます。

**使用例**:

```python
from src.analyzers.section_analyzer import SectionAnalyzer
from src.collectors.pr_collector import PRCollector
import os

# セクション分析器の初期化
analyzer = SectionAnalyzer()

# PRデータの読み込み（例：ディレクトリからすべてのPRデータを読み込む）
pr_data_dir = "data/prs"
pr_data_files = [os.path.join(pr_data_dir, f) for f in os.listdir(pr_data_dir) if f.endswith('.json')]
pr_data_list = []

for file_path in pr_data_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        pr_data = json.load(f)
        pr_data_list.append(pr_data)

# セクション分析の実行
section_results = analyzer.analyze_prs(pr_data_list)

# 分析結果からレポートを生成
report = analyzer.generate_section_report(section_results, output_file="reports/section_report.md")
```

### 3. 政策レポート生成（`PolicyReportGenerator`クラス）

収集したPRデータから政策分野別のレポートを生成するクラスです。

**使用例**:

```python
from src.generators.policy_report import PolicyReportGenerator

# レポート生成器の初期化
generator = PolicyReportGenerator()

# PRデータディレクトリからデータを読み込んでレポートを生成
input_dir = "data/prs"
output_dir = "data/reports"
generator.generate_reports(input_dir, output_dir)

# 個別のレポート生成
pr_data = generator.load_pr_data_from_directory(input_dir)
policy_areas = generator.group_prs_by_policy_area(pr_data)
generator.generate_policy_area_report(policy_areas, output_file="data/reports/policy_areas.md")
```

## 満たされていないユーザー価値と実装アイデア

現在のシステムでは、以下のユーザー価値がまだ満たされていません。これらは新たな開発者が貢献できる領域です。

### 1. 複数PRの同一箇所編集の可視化

**課題**: 複数のPRが同じファイルの同じ場所を編集している場合、それらをまとめて確認する機能がない。

**実装アイデア**:
```python
def find_overlapping_prs(pr_data_list):
    """同じファイルの同じ場所を編集しているPRを検出する"""
    file_location_map = {}
    
    for pr_data in pr_data_list:
        pr_number = pr_data["basic_info"]["number"]
        files = pr_data.get("files", [])
        
        for file_info in files:
            filename = file_info.get("filename")
            patch = file_info.get("patch")
            
            if not patch:
                continue
                
            # パッチから変更行を抽出
            changed_lines = extract_changed_lines(patch)
            
            for line_range in changed_lines:
                location_key = f"{filename}:{line_range[0]}-{line_range[1]}"
                if location_key not in file_location_map:
                    file_location_map[location_key] = []
                file_location_map[location_key].append(pr_number)
    
    # 複数のPRが編集している箇所を抽出
    overlapping_locations = {loc: prs for loc, prs in file_location_map.items() if len(prs) > 1}
    return overlapping_locations
```

### 2. 類似PRの検出とマージ候補の提案

**課題**: 類似内容のPRがあるとき、それらを検出してまとめる機能がない。

**実装アイデア**:
```python
def detect_similar_prs(pr_data_list, similarity_threshold=0.7):
    """類似したPRを検出する"""
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    
    pr_texts = []
    pr_numbers = []
    
    for pr_data in pr_data_list:
        pr_number = pr_data["basic_info"]["number"]
        pr_title = pr_data["basic_info"]["title"]
        
        # PRの本文テキストを取得（コメントやファイル内容を含む）
        pr_text = pr_title
        
        # コメントを追加
        for comment in pr_data.get("comments", []):
            pr_text += " " + comment.get("body", "")
            
        # ファイル変更内容を追加
        for file_info in pr_data.get("files", []):
            patch = file_info.get("patch", "")
            if patch:
                pr_text += " " + patch
                
        pr_texts.append(pr_text)
        pr_numbers.append(pr_number)
    
    # TF-IDFベクトル化
    vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(pr_texts)
    
    # コサイン類似度の計算
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    
    # 類似PRのペアを抽出
    similar_pairs = []
    for i in range(len(pr_numbers)):
        for j in range(i+1, len(pr_numbers)):
            if cosine_sim[i, j] >= similarity_threshold:
                similar_pairs.append({
                    "pr1": pr_numbers[i],
                    "pr2": pr_numbers[j],
                    "similarity": cosine_sim[i, j]
                })
    
    return similar_pairs
```

### 3. 自動ラベリング機能

**課題**: PRを適切な担当者に割り当てるための自動ラベリング機能がない。

**実装アイデア**:
```python
def auto_label_prs(pr_data_list, expertise_data):
    """PRの内容に基づいて自動的にラベルを付与する"""
    from collections import defaultdict
    
    # 政策分野のキーワード定義
    area_keywords = {
        "教育": ["教育", "学校", "学習", "教師", "先生", "生徒", "学生"],
        "子育て": ["子育て", "保育", "児童", "子ども", "子供"],
        # 他の分野も同様に定義
    }
    
    # 担当者の専門分野マッピング
    expert_areas = defaultdict(list)
    for username, areas in expertise_data.items():
        for area, count in areas.items():
            if count > 0:  # 一定数以上のPRがある場合のみ専門家とみなす
                expert_areas[area].append({"username": username, "count": count})
    
    # 各専門分野ごとに貢献数でソート
    for area in expert_areas:
        expert_areas[area] = sorted(expert_areas[area], key=lambda x: x["count"], reverse=True)
    
    # PRに自動ラベル付与
    labeled_prs = []
    for pr_data in pr_data_list:
        pr_number = pr_data["basic_info"]["number"]
        pr_title = pr_data["basic_info"]["title"]
        
        # PRの政策分野を判定
        detected_areas = []
        for area, keywords in area_keywords.items():
            if any(keyword in pr_title for keyword in keywords):
                detected_areas.append(area)
                
        # ファイル名からも政策分野を判定
        for file_info in pr_data.get("files", []):
            filename = file_info.get("filename", "")
            for area, keywords in area_keywords.items():
                if any(keyword in filename for keyword in keywords):
                    if area not in detected_areas:
                        detected_areas.append(area)
        
        # 検出された政策分野ごとに担当者を割り当て
        suggested_assignees = []
        for area in detected_areas:
            if area in expert_areas and expert_areas[area]:
                # 最も貢献数の多い担当者を選択
                suggested_assignees.append(expert_areas[area][0]["username"])
        
        labeled_prs.append({
            "pr_number": pr_number,
            "detected_areas": detected_areas,
            "suggested_assignees": suggested_assignees
        })
    
    return labeled_prs
```

### 4. 広聴AIとの連携

**課題**: 広聴AIとの連携機能がない。特に属性フィルタ機能を活用したPR分析が求められている。

**実装アイデア**:
```python
def integrate_with_listening_ai(pr_data_list, api_endpoint, api_key):
    """広聴AIとの連携機能"""
    import requests
    
    # PRデータを広聴AI用のフォーマットに変換
    formatted_data = []
    for pr_data in pr_data_list:
        basic_info = pr_data["basic_info"]
        
        # ラベル情報を属性として抽出
        attributes = {}
        for label in pr_data.get("labels", []):
            label_name = label.get("name", "")
            attributes[label_name] = True
        
        # PRの本文テキストを取得
        pr_text = basic_info.get("title", "")
        
        # コメントを追加
        for comment in pr_data.get("comments", []):
            pr_text += "\n\n" + comment.get("body", "")
        
        formatted_data.append({
            "id": basic_info.get("number"),
            "text": pr_text,
            "attributes": attributes,
            "url": basic_info.get("html_url")
        })
    
    # 広聴AIのAPIにデータを送信
    response = requests.post(
        api_endpoint,
        json={"data": formatted_data},
        headers={"Authorization": f"Bearer {api_key}"}
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"広聴AIとの連携に失敗しました: {response.status_code} {response.text}")
```

### 5. extractionプロンプトの改善

**課題**: 広聴AIのextractionプロンプトを改善する余地がある。

**実装アイデア**:

広聴AIのextractionプロンプトを改善するためには、以下のようなアプローチが考えられます：

1. **構造化された情報抽出**:
```
以下の政策提案PRから、次の情報を抽出してください：
1. 提案の主要な政策分野（教育、医療、経済など）
2. 提案の具体的な改善点（3点以内で簡潔に）
3. 提案の背景にある課題や問題点
4. 提案が実現した場合の期待される効果

各項目は箇条書きで簡潔に抽出し、元のテキストにない情報は推測せず「情報なし」と記載してください。
```

2. **属性ベースの分析プロンプト**:
```
以下の政策提案PRを、添付の属性情報（ラベル）に基づいて分析してください。特に以下の点に注目してください：
1. この属性（例：「教育」「若者」など）に関連する具体的な提案内容
2. 同じ属性を持つ他の提案との共通点や相違点
3. この属性に特有の課題や解決策

分析は客観的に行い、元のテキストに基づいた内容のみを含めてください。
```

## カスタマイズ可能な要素

システムには以下のようなカスタマイズ可能な要素があります：

### 1. 政策分野のキーワード定義

`PolicyReportGenerator`クラスの`group_prs_by_policy_area`メソッドでは、政策分野ごとのキーワードが定義されています。これらのキーワードを変更することで、PRの分類方法をカスタマイズできます。

```python
area_keywords = {
    "教育": ["教育", "学校", "学習", "教師", "先生", "生徒", "学生"],
    "子育て": ["子育て", "保育", "児童", "子ども", "子供"],
    "行政改革": ["行政", "改革", "デジタル化", "効率化", "手続き"],
    # 他の分野も同様に定義可能
}
```

### 2. データ収集方法の設定

`config/settings.yaml`ファイルでは、データ収集に関する設定をカスタマイズできます：

```yaml
data:
  storage_type: "file_per_pr"  # PRごとにファイルを分ける
  base_dir: "data/prs"         # データ保存先ディレクトリ
  reports_dir: "data/reports"  # レポート保存先ディレクトリ

api:
  retry_count: 3               # API呼び出しの再試行回数
  rate_limit_wait: true        # Rate Limitに達した場合に待機するか
  request_delay: 0.5           # API呼び出し間の遅延（秒）
```

### 3. 分析フォーカス領域の設定

分析の焦点を当てる領域も設定ファイルでカスタマイズ可能です：

```yaml
analysis:
  focus_areas: ["policy_sections", "improvement_proposals", "citizen_feedback"]
```

## 開発環境のセットアップ詳細

### 1. リポジトリのクローンと依存関係のインストール

```bash
# リポジトリのクローン
git clone https://github.com/team-mirai-volunteer/policy-pr-hub.git
cd policy-pr-hub

# 依存関係のインストール
pip install -r requirements.txt

# 環境変数の設定
export GITHUB_TOKEN=your_github_token
```

### 2. データ収集の実行

```bash
# 更新時間順にPRを収集（最大100件）
python src/collectors/pr_collector_main.py --mode update --max-count 100

# 連番でPRを収集（PR #1から#100まで）
python src/collectors/pr_collector_main.py --mode sequential --start-number 1 --end-number 100
```

### 3. レポート生成の実行

```bash
# 収集したPRデータからレポートを生成
python src/generators/policy_report_main.py --input-dir data/prs --output-dir data/reports
```

## トラブルシューティング

### GitHub API Rate Limitに関する問題

GitHub APIのRate Limitに達した場合、以下のようなエラーが発生します：

```
API rate limit exceeded for user ID XXXXX (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)
```

**解決策**:
1. 有効なGitHub Tokenを使用していることを確認する
2. `--max-count`オプションを使用して一度に収集するPR数を制限する
3. `--delay`オプションを使用してAPI呼び出し間の遅延を増やす

### データ収集が途中で停止する問題

ネットワーク接続の問題やその他の理由でデータ収集が途中で停止することがあります。

**解決策**:
1. `--mode sequential`を使用して、特定の範囲のPRのみを収集する
2. 最後に成功したPR番号から再開する
3. GitHub Actionsのログを確認して、エラーの原因を特定する

## 実装アイデア例

以下は、このプラットフォームを拡張するためのアイデア例です：

1. **PRの時系列分析ツール**
   - PRの作成・マージの時間的パターンを分析
   - 政策分野ごとの活動の波を可視化

2. **貢献者ネットワーク分析**
   - 貢献者間の関係性を分析（同じPRにコメントしているなど）
   - 政策分野ごとの貢献者コミュニティを可視化

3. **政策キーワードトレンド分析**
   - 時間経過に伴う政策キーワードの出現頻度変化を分析
   - 新たなトレンドや関心の移り変わりを検出

4. **PRの質的評価システム**
   - PRの質を評価するための指標を開発
   - 高品質なPRの特徴を分析

5. **政策提案の実装状況トラッカー**
   - PRがどの程度実際の政策に反映されているかを追跡
   - 政策への市民参加の効果を測定

これらのアイデアは、既存のコードベースを拡張することで実装可能です。新しい機能を追加する際は、既存のクラス構造を活用し、モジュール性を保つことをお勧めします。
