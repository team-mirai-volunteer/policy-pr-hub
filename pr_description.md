# PR収集タイミング問題と欠損PR処理の修正

## 概要

PR収集システムの整合性問題を解決するための修正です。分析により、主な原因は削除済みPR（#2248）の処理不備と、データ整合性レポート生成前の状態同期不足であることが判明しました。

## 問題の詳細

### 発見された問題
- **削除済みPR #2248**: hourlyワークフローで「PR #2248 は存在しません」エラーが発生
- **状態分類の差異**: open (-42件), merged (+36件) の不整合
- **タイミング同期問題**: 整合性チェック時点での状態が最新でない

### 根本原因
1. 削除済みPRがknown_issue_numbersに登録されていない
2. データ整合性レポート生成前に状態同期が実行されていない
3. 削除済みPR検出時のログ出力が不十分

## 修正内容

### 1. 削除済みPR #2248をknown_issue_numbersに追加
```python
known_issue_numbers = {
    1234,  # 例: 削除済みPR
    2248,  # 削除済みPR（2025-06-17確認）
    5678,  # 例: プライベートPR
}
```

### 2. データ整合性レポート生成前の状態同期を追加
hourly_pr_collection.ymlワークフローに事前状態同期ステップを追加:
```yaml
- name: 事前状態同期
  run: |
    cd policy-pr-hub
    echo "=== 事前状態同期 ==="
    echo "データ整合性チェック前に最新状態を同期します"
    python src/collectors/pr_collector_main.py --mode state_update --max-count 50 --output-dir ../pr-data/prs
    echo "事前状態同期が完了しました"
```

### 3. 収集エラーハンドリングの強化
削除済みPR検出時により詳細なログ出力を追加:
```python
else:
    print(f"PR #{pr_number} は存在しません（削除済みまたはアクセス不可）")
    print(f"  - known_issue_numbersへの追加を検討してください")
```

## 期待される効果

- **状態分類精度の向上**: open/merged状態の差異を大幅に削減
- **無駄な収集試行の削減**: 削除済みPRの適切な処理
- **診断情報の充実**: より詳細なログ出力による問題特定の容易化
- **データ整合性の向上**: レポート時点での最新状態の保証

## テスト結果

修正前後でdata_integrity_checker.pyを実行し、状態分類の差異が改善されることを確認済み。

## 関連Issue

- データ整合性レポートでの状態分類差異（open -42, merged +36）
- hourlyワークフローでのPR #2248収集エラー

---

**Link to Devin run**: https://app.devin.ai/sessions/399bd4e0b205493182af120091983c13
**Requested by**: NISHIO (nishio.hirokazu@gmail.com)
