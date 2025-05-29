# 政策プルリク活用ハブ (Policy PR Hub)

このリポジトリは、「いどばた政策」システムで収集された1700+件の政策改善提案プルリクエストを分析・活用するためのプラットフォームです。政策チームの活動を支援し、マニフェストの改善に貢献することを目的としています。

## プロジェクトの目的

- 「いどばた政策」システムで収集された政策改善提案PRデータを分析する
- 政策チームの活動を支援するための洞察とレポートを生成する
- 市民参加による政策改善プロセスの透明性と効率性を向上させる

## いどばた政策について

「いどばた政策」は[digitaldemocracy2030/idobata](https://github.com/digitaldemocracy2030/idobata)リポジトリのpolicy-editモジュールで、市民が政策提案をGitHubのプルリクエスト形式で提出し、議論・改善するためのシステムです。

## 機能概要

- PRデータの収集・整理機能
- 政策分野別・セクション別の分析機能
- ラベルベースのPR分類とレポート生成
- 政策改善提案の傾向分析と可視化

## データソース

このプラットフォームは以下のデータソースを活用します：

- [team-mirai/policy](https://github.com/team-mirai/policy) - 実際のPRが集まっているリポジトリ
- [team-mirai-volunteer/pr-data](https://github.com/team-mirai-volunteer/pr-data) - 収集されたPRデータの保存先

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

# PRデータ収集の実行例（更新時間順に収集）
python src/collectors/pr_collector_main.py --mode update

# PRデータ収集の実行例（連番で収集）
python src/collectors/pr_collector_main.py --mode sequential --start-number 1 --end-number 100
```

個人の実験では自分のGitHub Tokenを使用してください。GitHub Action上での実行は別途secretを設定します。

## 主要コンポーネント

このプロジェクトは主に3つの機能コンポーネントで構成されています：

1. **収集機能** (`src/collectors/`): GitHub APIを使用してPRデータを収集
2. **分析機能** (`src/analyzers/`): 収集したPRデータを分析
3. **レポート生成機能** (`src/generators/`): 分析結果からレポートを生成

## コントリビューション

プロジェクトへの貢献に興味がある方は、[CONTRIBUTING.md](./CONTRIBUTING.md)をご覧ください。

コミュニケーションはSlackチャンネルで行われています。参加方法については、Issueで質問するか、メンテナーに直接お問い合わせください。

## ライセンス

このプロジェクトは[MITライセンス](./LICENSE)の下で公開されています。

## 分析機能

このプラットフォームは以下の分析機能を提供します：

- **セクション分析**: PRで変更されたマークダウンファイルのセクション（見出し）を分析
- **ラベル分析**: PRに付けられたラベルに基づく分類と傾向分析
- **政策分野別分析**: 政策分野ごとの改善提案の傾向と特徴を分析
- **貢献者分析**: 貢献者のパターンと専門分野の分布を分析

## メンテナー

- [@nishio](https://github.com/nishio)
