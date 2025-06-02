# データ検証・診断スクリプト

このディレクトリには、PRデータの整合性確認と診断を行うためのユーティリティスクリプトが含まれています。

## スクリプト一覧

### 1. `data_integrity_checker.py`
**目的**: GitHubとローカルデータの包括的な整合性確認
**使用場面**: 
- 定期的なデータ品質監査
- 大規模データ収集後の検証
- システム異常時の診断

**機能**:
- GitHub API vs ローカルデータの統計比較
- PR状態別の詳細分析
- カバレッジ計算とレポート生成

### 2. `missing_pr_analyzer.py`
**目的**: 欠損PRの特定と分析
**使用場面**:
- データ収集の抜け漏れ確認
- 収集戦略の最適化
- 問題箇所の特定

**機能**:
- 連番での欠損分析
- 欠損範囲の可視化
- 最新データとの比較

### 3. `issue_pr_resolver.py`
**目的**: PR番号とIssue番号の重複解決
**使用場面**:
- 100%カバレッジ達成の確認
- PR/Issue混在システムでの正確性検証
- データ完全性の最終確認

**機能**:
- 欠番PR番号のIssue存在確認
- PR/Issue区別の自動判定
- 実質カバレッジの正確な計算

## 運用推奨

### 日次運用
```bash
# 基本的な整合性確認
python scripts/data_integrity_checker.py

# 新規欠損の確認
python scripts/missing_pr_analyzer.py
```

### 月次運用
```bash
# 完全性の詳細確認
python scripts/issue_pr_resolver.py

# 包括的なデータ監査
python scripts/data_integrity_checker.py --detailed --output-dir reports/
```

### トラブルシューティング
```bash
# 問題発生時の詳細診断
python scripts/missing_pr_analyzer.py --verbose
python scripts/issue_pr_resolver.py --debug

# レポート生成付きの詳細確認
python scripts/data_integrity_checker.py --detailed --output-dir troubleshooting/
```

## 実行例

### 基本的な整合性確認
```bash
cd /path/to/policy-pr-hub
python scripts/data_integrity_checker.py
```

### 詳細レポート生成
```bash
python scripts/data_integrity_checker.py --detailed --output-dir reports/$(date +%Y%m%d)
```

### Issue/PR重複確認
```bash
python scripts/issue_pr_resolver.py --debug
```

## 技術仕様

- **依存関係**: `src/utils/github_api.py`, `src/validators/data_validator.py`
- **設定ファイル**: `config/settings.yaml`
- **データソース**: `/home/ubuntu/pr-data/prs/`
- **API制限**: GitHub API rate limitに準拠

## 保守・更新

これらのスクリプトは以下の場合に更新が必要です：
- GitHub API仕様変更時
- データ構造変更時
- 新しい診断要件の追加時
- パフォーマンス最適化時
