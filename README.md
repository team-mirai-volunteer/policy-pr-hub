# 政策プルリク活用プラットフォーム (Policy PR Hub)

このリポジトリは、「いどばた政策」システムで収集された1700+件の政策改善提案プルリクエストを分析・活用するためのプラットフォームです。政策チームの活動を支援し、マニフェストの改善に貢献することを目的としています。

## プロジェクトの目的

- 「いどばた政策」システムで収集された政策改善提案PRデータを分析する
- 政策チームの活動を支援するための洞察とレポートを生成する
- 市民参加による政策改善プロセスの透明性と効率性を向上させる

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

# PRデータ収集の実行
python src/collectors/pr_collector_main.py
```

## コントリビューション

プロジェクトへの貢献に興味がある方は、[CONTRIBUTING.md](./CONTRIBUTING.md)をご覧ください。

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
