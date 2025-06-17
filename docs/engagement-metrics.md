# エンゲージメント指標収集機能

## 概要

PRデータ収集システムを拡張し、コメント、ラベル変更、リアクション（いいね）などのエンゲージメント指標を収集・可視化する機能を追加しました。

## 新機能

### 1. エンゲージメント指標の収集

- **PRレベルのリアクション**: 👍、👎、❤️、🎉、😕、🚀、👀 などのリアクション
- **コメントレベルのリアクション**: 各コメントに対するリアクション詳細
- **イベント履歴**: ラベルの追加・削除、アサイン変更などの履歴
- **エンゲージメント要約**: 総リアクション数、ラベル変更回数、最終アクティビティ日時

### 2. ダッシュボードの拡張

- **リアクション分布チャート**: リアクション種類別の集計表示
- **時系列アクティビティチャート**: 日付別のアクティビティ可視化
- **エンゲージメントフィルタ**: 高エンゲージメント、最近のアクティビティでのフィルタリング

### 3. 収集頻度の変更

- 日次実行から週次実行（毎週日曜日）に変更
- GitHub API使用量の最適化

## 技術仕様

### 新しいAPIエンドポイント

```python
# PRのリアクション
GET /repos/{owner}/{repo}/issues/{issue_number}/reactions

# PRのイベント履歴
GET /repos/{owner}/{repo}/issues/{issue_number}/events

# コメントのリアクション
GET /repos/{owner}/{repo}/issues/comments/{comment_id}/reactions
GET /repos/{owner}/{repo}/pulls/comments/{comment_id}/reactions
```

### データ構造の拡張

```json
{
  "basic_info": {...},
  "labels": [...],
  "comments": [...],
  "review_comments": [...],
  "commits": [...],
  "files": [...],
  "reactions": [...],
  "events": [...],
  "engagement_summary": {
    "total_reactions": 5,
    "reaction_breakdown": {
      "+1": 3,
      "heart": 2
    },
    "label_changes_count": 2,
    "label_changes": [...],
    "last_activity": "2025-06-17T05:00:00Z"
  }
}
```

## 使用方法

### データ収集

```bash
# 通常の更新（新しいエンゲージメント指標も含む）
python src/collectors/pr_collector_main.py --mode update

# 特定のPRのみ収集
python src/collectors/pr_collector_main.py --mode update --limit 5
```

### ダッシュボード

1. `pr-dashboard/index.html` を開く
2. エンゲージメント指標チャートが自動表示される
3. フィルタで「高エンゲージメント」「最近のアクティビティ」を選択可能

## 設定

### GitHub Actions

週次実行スケジュール:
```yaml
schedule:
  - cron: '0 3 * * 0'  # 毎週日曜日 3:00 UTC
```

### フラグ設定

- `high_engagement`: 総リアクション数 ≥ 5 または ラベル変更 ≥ 3
- `recent_activity`: 過去7日以内にアクティビティあり
- `medium_engagement`: 中程度のエンゲージメント
- `low_engagement`: 低エンゲージメント

## 注意事項

- GitHub API レート制限に注意（1時間あたり5000リクエスト）
- 大量のPRを処理する際は `--limit` オプションを使用
- エンゲージメント指標の収集により、1PRあたりの処理時間が増加

## トラブルシューティング

### API レート制限エラー

```bash
# レート制限状況確認
python -c "from src.utils.github_api import check_rate_limit; check_rate_limit()"
```

### データ整合性チェック

```bash
python scripts/data_integrity_checker.py
```
