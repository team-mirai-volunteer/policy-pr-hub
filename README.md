# 政策プルリク活用ハブ (Policy PR Hub)

このリポジトリは、「いどばた政策」システムで収集された1700+件の政策改善提案プルリクエストを分析・活用するためのプラットフォームです。政策チームの活動を支援し、マニフェストの改善に貢献することを目的としています。

## プロジェクトの目的

- 「いどばた政策」システムで収集された政策改善提案PRデータを分析する
- 政策チームの活動を支援するための洞察とレポートを生成する
- 市民参加による政策改善プロセスの透明性と効率性を向上させる

## いどばた政策について

「いどばた政策」は[digitaldemocracy2030/idobata](https://github.com/digitaldemocracy2030/idobata)リポジトリのpolicy-editモジュールで、市民が政策提案をGitHubのプルリクエスト形式で提出し、議論・改善するためのシステムです。

[チームみらい](https://policy.team-mir.ai/view/README.md)は、このシステムを活用してマニフェストを公開しています。党首の[安野たかひろ氏のツイート](https://x.com/takahiroanno/status/1923253426747736186)にあるように、チームみらいでは議論途中・作業途中のマニフェストを公開し、市民からの改善提案を積極的に取り入れる透明性の高いアプローチを採用しています。

## 機能概要

- PRデータの収集・整理機能
- 政策分野別・セクション別の分析機能
- ラベルベースのPR分類とレポート生成
- 政策改善提案の傾向分析と可視化

## データソース

このプラットフォームは以下のデータソースを活用します：

- [team-mirai/policy](https://github.com/team-mirai/policy) - 実際のPRが集まっているリポジトリ
- [team-mirai/random](https://github.com/team-mirai/random) - GitHub Actionsを使用してPRデータを定期的に収集するリポジトリ
- [team-mirai-volunteer/pr-data](https://github.com/team-mirai-volunteer/pr-data) - 収集されたPRデータの保存先

## GitHub Actionsによるデータ収集

現在、[team-mirai/random](https://github.com/team-mirai/random)リポジトリのGitHub Actionsを使用して、PRデータを定期的に収集しています。このシステムは以下のユーザー価値を提供しています：

1. **データ収集の自動化** - 定期的なPRデータの自動収集により、手動作業が不要
2. **データの構造化と保存** - PRデータをJSON形式で構造化して保存
3. **分析基盤の提供** - 政策分野別の分析レポート生成
4. **政策改善プロセスの可視化** - どの政策分野に多くの改善提案があるかの可視化

### 技術的制約

**重要**: 政策提案PRは1700件以上あり、GitHub APIのRate Limitに当たるため、一度にすべてのPRデータを取得することはできません。そのため、差分取得（incremental collection）が必須となっています。現在の実装では、更新時間順での収集や連番での収集などの方法でこの制約に対応しています。

## 開発環境のセットアップ

### 必要条件

- Python 3.10以上
- Git
- GitHub APIアクセス用のトークン

### インストール手順

```bash
# リポジトリのクローン
git clone https://github.com/team-mirai-volunteer/policy-pr-hub.git
cd policy-pr-hub

# 依存関係のインストール
pip install -r requirements.txt

# 環境変数の設定
export GITHUB_TOKEN=your_github_token
```

### 開発の始め方

**注意**: PRデータの収集は GitHub API の Rate Limit に当たりやすく、フル取得を実行すると長時間（1時間以上）待つことになります。初めての方は以下の方法で開発を始めることをお勧めします：

1. **既存のJSONデータを使用した分析から始める**
   ```bash
   # team-mirai-volunteer/pr-dataリポジトリから最新のPRデータを取得
   git clone https://github.com/team-mirai-volunteer/pr-data.git
   
   # 既存のJSONデータを使用して分析を実行
   python src/analyzers/section_analyzer_main.py --input-dir ../pr-data/prs --output-dir ./output
   
   # または政策分野レポートを生成
   python src/generators/policy_report_main.py --input-dir ../pr-data/prs --output-dir ./output
   ```

2. **少量のPRデータのみを収集する場合**
   ```bash
   # 最新の10件のPRのみを収集（Rate Limitに当たりにくい）
   python src/collectors/pr_collector_main.py --mode update --max-count 10
   
   # または特定の範囲のPRのみを収集
   python src/collectors/pr_collector_main.py --mode sequential --start-number 1 --end-number 10
   ```

個人の実験では自分のGitHub Tokenを使用してください。GitHub Action上での実行は別途secretを設定します。

## 主要コンポーネント

このプロジェクトは主に3つの機能コンポーネントで構成されています：

1. **収集機能** (`src/collectors/`): GitHub APIを使用してPRデータを収集
2. **分析機能** (`src/analyzers/`): 収集したPRデータを分析
3. **レポート生成機能** (`src/generators/`): 分析結果からレポートを生成

## ドキュメントガイド

プロジェクトについて詳しく知りたい場合は、以下のドキュメントを参照してください：

- [開発者ガイド（DEVELOPERS_GUIDE.md）](./DEVELOPERS_GUIDE.md) - システムの詳細な説明、実装例、拡張ポイントなど
- [開発詳細（DEVELOPMENT_DETAILS.md）](./DEVELOPMENT_DETAILS.md) - 技術スタック、実装上の注意点、満たされていないユーザー価値など
- [コントリビューション（CONTRIBUTING.md）](./CONTRIBUTING.md) - プロジェクトへの貢献方法、Issue管理、PRプロセスなど

目的別の推奨ドキュメント：
- **新機能を実装したい方**: まず[開発者ガイド](./DEVELOPERS_GUIDE.md)を読み、実装例を参考にしてください
- **プロジェクトの技術的制約を知りたい方**: [開発詳細](./DEVELOPMENT_DETAILS.md)の「実装上の注意点」セクションを参照してください
- **貢献方法を知りたい方**: [コントリビューション](./CONTRIBUTING.md)ガイドを参照してください

## コントリビューション

プロジェクトへの貢献に興味がある方は、[CONTRIBUTING.md](./CONTRIBUTING.md)をご覧ください。

エンジニアとしてボランティアに参加希望の方は、[チームみらいのボランティア募集ページ](https://team-mir.ai/#volunteer)からご応募ください。コミュニケーションはSlackチャンネルで行われています。

## ライセンス

このプロジェクトは[MITライセンス](./LICENSE)の下で公開されています。

## 分析機能

このプラットフォームは以下の分析機能を提供します：

- **セクション分析**: PRで変更されたマークダウンファイルのセクション（見出し）を分析
- **ラベル分析**: PRに付けられたラベルに基づく分類と傾向分析
- **政策分野別分析**: 政策分野ごとの改善提案の傾向と特徴を分析
- **貢献者分析**: 貢献者のパターンを分析

## メンテナー

- [@nishio](https://github.com/nishio)
