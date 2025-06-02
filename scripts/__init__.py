"""
データ検証・診断スクリプトパッケージ

このパッケージには、PRデータの整合性確認と診断を行うための
ユーティリティスクリプトが含まれています。

モジュール:
- data_integrity_checker: 包括的なデータ整合性確認
- missing_pr_analyzer: 欠損PRの分析と診断
- issue_pr_resolver: PR/Issue番号重複の解決
"""

__version__ = "1.0.0"
__author__ = "Policy PR Hub Team"

import sys
from pathlib import Path

parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))
