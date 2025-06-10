#!/usr/bin/env python3
"""
PR状態更新機能のテスト - yaml依存を回避
"""

import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

GITHUB_CONFIG = {
    "github": {
        "token": os.environ.get("GITHUB_TOKEN"),
        "api_base_url": "https://api.github.com",
        "repository": "team-mirai/policy",
    },
    "data": {"base_dir": "/home/ubuntu/repos/pr-data-latest/prs"},
    "api": {"request_delay": 0.5, "max_retries": 3},
}

sys.path.insert(0, str(Path(__file__).parent))


def mock_load_config():
    """設定をモック"""
    return GITHUB_CONFIG


def mock_check_rate_limit():
    """Rate limitをモック"""
    return 5000, int(time.time()) + 3600


def mock_wait_for_rate_limit_reset(reset_time):
    """Rate limit待機をモック"""
    pass


import src.utils.github_api as github_api

github_api.load_config = mock_load_config
github_api.check_rate_limit = mock_check_rate_limit
github_api.wait_for_rate_limit_reset = mock_wait_for_rate_limit_reset

from src.collectors.pr_collector import PRCollector


def test_state_update():
    """状態更新機能をテスト"""
    print("=== PR状態更新機能テスト開始 ===")

    if not GITHUB_CONFIG["github"]["token"]:
        print("警告: GITHUB_TOKENが設定されていません")
        return False

    collector = PRCollector(GITHUB_CONFIG)

    print("最近7日間のPRを最大5件チェックします...")

    try:
        collected_count, updated_count = collector.collect_prs_with_state_check(
            output_dir="/home/ubuntu/repos/pr-data-latest/prs",
            max_count=5,
            check_recent_days=7,
        )

        print(f"テスト完了:")
        print(f"  新規収集: {collected_count}件")
        print(f"  状態更新: {updated_count}件")

        return True

    except Exception as e:
        print(f"テスト中にエラーが発生しました: {e}")
        return False


if __name__ == "__main__":
    success = test_state_update()
    sys.exit(0 if success else 1)
