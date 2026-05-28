# 政策プルリク活用ハブ — 開発ヒストリー

このドキュメントは [team-mirai-volunteer/policy-pr-hub](https://github.com/team-mirai-volunteer/policy-pr-hub) の **2025-05-29 のリポジトリ作成から 2026-05-28 の運用停止までの開発履歴** をまとめたものです。

リポジトリは public archive に移行され、本稼働は終了しています。

## 背景：プロジェクトの意図

PR の分析を **チームみらいのスタッフに閉じた業務にせず、ボランティア・サポーターの方々が関与できる対象として開く** ことが、本プロジェクトの中核的な意図でした。

「いどばた政策」が市民から政策提案を受け入れる入口だったのに対し、policy-pr-hub は **集まった提案を分析・可視化する側にもボランティアが関与できる場** として位置付けられていました。この方針は次のような構造として実装されています：

- 収集パイプライン・分析ロジック・可視化 UI を **独立した OSS リポジトリとして公開**（コードと CLA を含めて誰でも参照可能）
- `CONTRIBUTING.md` で貢献プロセスを明文化、`good first issue` ラベルで入門タスクを用意
- 権限制約のあるコントリビュータでも作業をアサインできるよう、`/assign` コメントによるセルフアサインの仕組みを `assign-bot.yml` で実装
- LLM による問題抽出、階層クラスタリング、散布図など、**誰でも閲覧できる分析結果を webapp に集約**してシェア可能に

スタッフ内に閉じて回す分析ではなく、外側に開いた状態で改善提案を受け止め、観察結果を返していく ―― そのためのインフラとして設計されたのが本リポジトリです。

## 全体像

```
2025-05-18  team-mirai/random 作成（雑多な置き場）
2025-05-27  team-mirai-volunteer/pr_analysis 作成（PR 分析専用の試作）
2025-05-29  team-mirai-volunteer/policy-pr-hub 作成（本流）
2025-07-03  第27回参議院議員通常選挙 公示
2025-07-20  第27回参議院議員通常選挙 投票日
2025-07-26  上流 team-mirai/policy 最終 push（PR #9724）→ 後に public archive 化
2025-07-28  webapp 立ち上げ（凍結された PR 集合に対する事後分析フェーズへ）
2025-08     開発最盛期（全 commit の約 41% がこの月に集中）
2025-10-09  最終 commit
2026-05     public archive へ移行
```

## 前史：random / pr_analysis（〜2025-05-28）

policy-pr-hub の git log には現れないが、源流は 2 段階ある。

### random（2025-05-18〜）

[team-mirai/random](https://github.com/team-mirai/random) は「独立したリポジトリにするほどでもないものを気軽にシェアするためのリポジトリ」として作られた雑多な置き場。`pr-auto-labeler/` / `pr_analysis/` / `pr_analysis_results/` といった、policy-pr-hub と同じ問題領域の試作がここで動き始めた。最終 push は 2025-07-01。

### pr_analysis（2025-05-27〜2025-06-12）

[team-mirai-volunteer/pr_analysis](https://github.com/team-mirai-volunteer/pr_analysis) は random から「PR 分析」だけを切り出した、本格化前の試作リポジトリ。policy-pr-hub の 2 日前に作成。ここで既に以下の設計が確立されていた：

- GitHub Actions による 1 時間毎の自動実行（後の `hourly_pr_collection.yml` の原型）
- `pr-data` リポジトリによるコードとデータの分離（[team-mirai-volunteer/pr-data](https://github.com/team-mirai-volunteer/pr-data) の運用設計）
- ラベル分析・セクション分析の枠組み

2025-06-12 を最後に push が止まり、後に archive。archive 時 README の宣言：

> このリポジトリの機能は policy-pr-hub に移行されました。後者がまともに動き始めています。

つまり policy-pr-hub の Python 側の骨格は、pr_analysis から明示的に引き継いだもの。

## Phase 1：初期セットアップ（2025-05-29〜2025-06-05）

リポジトリ立ち上げと、ドキュメントの土台づくり。README / 開発者ガイド / コントリビューションガイドの整備と並行して、データ検証スクリプトや日次 PR データ収集ワークフローなどの基盤調整が進んだ期間。外部貢献者（@kotaromama）からも README 更新が入った。

## Phase 2：PR 収集パイプラインの確立（2025-06-07〜2025-06-17）

PR 収集・分析・配信のサイクルがほぼここで完成。改善貢献 PR 統計生成、福祉ラベル割り当てチェッカー、Gist へのアップロード、時間毎の自動収集ワークフローが順に整備された。1700+ 件の PR を GitHub API の Rate Limit に当たらず取り続けるため、差分取得（更新時間順 / 連番 / 未収集優先）と `backoff` ライブラリによる指数バックオフが入っている。

## 選挙期間による空白：2025-06-18〜2025-07-27（約6週間）

git log 上は一切の commit がない。この期間は **第27回参議院議員通常選挙** の真っ最中：

- 2025-07-03 公示
- 2025-07-20 投票

Phase 2 の最後の commit（6/17）は公示の16日前、Phase 3 の最初の commit（7/28）は投票日の8日後にあたる。Phase 2 と Phase 3 の境界線は、開発上の都合ではなく政治イベントによって引かれている。

## Phase 3：webapp の立ち上げ（2025-07-28〜2025-07-31）

投票日の8日後に再始動。上流の team-mirai/policy は 2 日前（2025-07-26）に最終 push を打って以降は新規 PR が来ない状態となっていた（後に public archive 化）。policy-pr-hub の Phase 3 以降の活動は、**この時点で固定された 1700+ 件の PR 集合に対する事後分析・可視化** に集中する。

「リアルタイム集票ツール」ではなく「ポスト選挙の振り返り資産化」モードへの切り替え。数日でフロントエンドが一気に立ち上がる。

- 2025-07-28 TypeScript + Next.js + Supabase webapp 追加（PR #30）、Vercel 用 static export、散布図可視化（PR #33, Plotly.js 統合）
- 2025-07-29 問題抽出分析機能を追加（PR #34, #35）→ LLM（OpenRouter 経由）で「提案者の問題意識」を抽出するパイプライン
- 2025-07-30 階層クラスタリング bullet list コンポーネント追加
- 2025-07-31 階層クラスタリングを実データに置き換え（PR #36）、Vercel 設定の微調整（PR #37, #38）

→ webapp / 散布図 / 問題抽出 / 階層クラスタ表示が4日間で揃う。

## Phase 4：階層表示と広聴 AI 統合（2025-08-04〜2025-08-12）

- 2025-08-04 Vercel デプロイの `routes-manifest.json` 問題修正
- 2025-08-05 TopPage タイトルを「改善提案」に変更（PR #42）、階層表示の3段階展開（PR #44）、散布図リンクを削除し広聴 AI 実験 UI を追加（PR #45）
- 2025-08-06 Level 2 個別データ表示、階層表示カスケードクローズバグ修正（PR #47）
- 2025-08-08〜09 階層表示に PR リンクを追加（PR #48）、`arg_id` ベース対応付けで PR マッピング100%達成
- 2025-08-12 広聴 AI コンポーネント大規模統合（PR #49, #50, #51）
  - KouchouAI ページ追加・コンポーネント移植
  - Chakra UI v3 → v2 ダウングレード（Ark UI 互換問題）
  - WebGL / React hydration 修正
  - 散布図クラスタラベルの leader line 実装と最適化
  - `/kouchou-ai` ページからモーダル削除

## Phase 5：可視化の磨き込み（2025-08-14〜2025-08-21）

主要機能は揃ったので、見せ方の改善と検索機能。

- 2025-08-14 階層クラスタリングページに政策分野別円グラフ追加（PR #52）、モバイル対応・ツールチップ改善
- 2025-08-19 子クラスタ一覧ページ追加（PR #57）、全ページにダークモード対応 + 実装ガイド（PR #58）、SNS プレビュー / OGP 画像（PR #59）、PR 番号検索機能（PR #60）
- 2025-08-20〜21 個別データ表示ボタンをクラスタ詳細ページへのリンクに変更（PR #61）、クラスタ投票・コメント機能の設計書（PR #62）

→ webapp 開発のピーク。8/12〜8/21 の10日間で UI が大きく洗練された。

## Phase 6：メンテナンス・絞り込み（2025-09-14〜2025-09-24）

新機能より「不要なものを削る」フェーズ。

- 2025-09-14 外部 kouchou-ai ドメインへのリンクと階層図の円グラフを削除（PR #66）、`/kouchou-ai` ページを常に明るい背景で表示（PR #67）
- 2025-09-23〜24 クラスター選択ドロップダウン、散布図でのクラスター選択による表示更新

## Phase 7：最終整備と embedding 実験（2025-10-09）

1日で関連 PR をまとめてマージ + 個別実験投入。

- Devin の cluster-dropdown / cluster-selection-scatter-chart の2ブランチを main にマージ
  - ClusterSelector の Chakra UI Checkbox API 修正
  - 未選択クラスターを灰色の小さい点で表示
  - クラスター選択時にラベル位置が変動しないよう修正
- 最終 commit `create high dimension embeddings` → 21,348件の政策提案 argument に対する OpenAI embedding（1536次元）を生成する `high-dim/` フォルダ追加

## 静止期間：2025-10-10〜2026-05-19（約7ヶ月）

最終 commit から運用停止判断まで。git log 上は完全に無音だが、その間も Vercel 上でサービスは動き続けていた。

## Phase 8：サービスクローズ（2026-05〜）

- 1700+ PR を選挙前後で分析するという固有の目的が果たされた
- 上流の team-mirai/policy は既に 2025-07-26 を最後に凍結（後に public archive 化）されており、新規 PR の流入は久しく途絶えていた
- 自然な区切りとして policy-pr-hub も public archive に移行し、ファイルは引き続き閲覧可能な状態のまま凍結する

## 月別の commit 密度

| 月 | commits | 主な出来事 |
|---|---:|---|
| 2025-05 | 19 | 初期セットアップ、ドキュメント体系 |
| 2025-06 | 65 | PR 収集パイプライン完成 |
| 2025-07 | 27 | webapp 立ち上げ、問題抽出、階層クラスタ |
| 2025-08 | 87 | 広聴 AI 統合 + 可視化の磨き込み（最盛期） |
| 2025-09 | 8 | 整理と絞り込み |
| 2025-10 | 7 | 散布図クラスタ選択 + high-dim embedding |

8月だけで全213 commit の約41%。

## 振り返り：何が残ったか

### webapp に届いた機能（ https://policy-pr-hub.vercel.app/ で公開されていた）

- トップ「改善提案」
- 個別 PR 詳細 (`/pr/[id]`)
- 階層クラスタリング (`/hierarchical`)
- 子クラスタ一覧 (`/hierarchical-clusters`、密度・賛否比率順)
- クラスタ詳細 (`/cluster/...`)
- 散布図 (`/scatter`、立場 × 主張強度)
- 広聴 AI 実験 UI (`/kouchou-ai`)

### 分析資産（リポジトリ内にコミット済み、archive 後も閲覧可能）

- `problems.json` (7.2 MB) / `problems.csv` (2.5 MB)：LLM 抽出した「提案者の問題意識」（約9,688件）
- `full_welfare_report.md` (262 KB)：福祉ラベルの大規模レポート
- `llm_welfare_report.md`, `test_welfare_report.md`
- `comprehensive_missing_pr_analysis.md`, `uncollected_pr_collection_results.md`, `test_results_analysis.md`, `full_period_test_results.md`：PR 収集系の検証ノート
- `pr_description.md`, `github-issue-voting-commenting.md`：投票・コメント機能の設計書

### Python パイプライン（policy-pr-hub の中で完結）

- `src/collectors/pr_collector.py`：PR 収集（Rate Limit 対応）
- `src/analyzers/section_analyzer.py`：markdown セクション分析
- `src/analyzers/problem_extractor.py`：LLM による問題抽出
- `src/generators/policy_report.py`：政策分野別レポート
- `src/generators/contribution_stats.py`：貢献者統計（Gist へアップロード）
- `src/generators/welfare_label_checker.py`：福祉ラベルカバレッジ計算
- `src/validators/data_validator.py`：データ検証

### 外部生成データへの依存

policy-pr-hub の正体は「自前のデータ処理 + 外部分析結果を統合して見せる webapp」だった：

- **階層クラスタリングの結果**は外部 Azure Container Apps（広聴 AI 系 broadlistening の出力）から `extract_real_data.py` で取り込まれた
  - 入手先 URL は `extract_real_data.py` にハードコードされている（`client.salmonpebble-...azurecontainerapps.io` 配下、archive 後も同サービスが稼働していれば参照可能）
- **散布図のスコア**（`stance_val` / `assert_val`）は Google Colab + Google Drive 上で `pr-dashboard/process_script.py` を半手動実行して生成
  - 入出力先はメンテナーの個人 Drive（`/content/drive/My Drive/...` の Colab パスのみ記載、公開 URL は無し）。archive 後にこの経路で再生成するにはメンテナー本人のアクセスが必要
- **high-dim embedding の入力 `args.csv`**（21,348件）と生成された `embeddings-1536dim.pickle` は Google Drive で配布
  - 入手先 URL は `high-dim/README.md` に明記：[Google Drive folder](https://drive.google.com/drive/folders/1XCp_gauahDqWqizc3HeqoVuwv7WrXGE8)

つまり「重い分析」はすべて policy-pr-hub の外で行われており、本リポジトリ内で完結して再生成できるのは PR 収集・問題抽出・各種レポートに留まる。

### やらなかったこと（未着手アイデア）

- 複数 PR の同一箇所編集の可視化
- 類似 PR 検出・マージ候補提案
- 自動ラベリング機能の拡張
- 広聴 AI v3.0 の属性フィルタを活用した PR 分析
- 付箋ボードビュー（Issue #55）
- サーバサイドボロノイポリゴン生成（Issue #56）
- クラスタ詳細での投票・コメント機能（PR #63 はクローズ、設計書 #62 はマージ）

## 関連リポジトリ

- [team-mirai/random](https://github.com/team-mirai/random)：前史となる雑多な置き場
- [team-mirai-volunteer/pr_analysis](https://github.com/team-mirai-volunteer/pr_analysis)：本リポジトリの直接の前身（archive 済み）
- [team-mirai/policy](https://github.com/team-mirai/policy)：実際の政策提案 PR が集まったリポジトリ（2025-07-26 最終 push 後に archive 済み、将来 rename される可能性あり）
- [team-mirai-volunteer/pr-data](https://github.com/team-mirai-volunteer/pr-data)：収集された PR データの保存先
- [digitaldemocracy2030/idobata](https://github.com/digitaldemocracy2030/idobata)：市民参加プラットフォーム本体（独立して開発継続中）。policy-edit モジュールが team-mirai/policy への PR 投稿経路となっていたが、上流 archive 化後はその経路は終了
- [digitaldemocracy2030/kouchou-ai](https://github.com/digitaldemocracy2030/kouchou-ai)：広聴 AI 本体（階層クラスタリング・散布図スコアの生成元）

## メンテナー

- [@nishio](https://github.com/nishio)
