#!/usr/bin/env python3
"""
簡易PR状態チェッカー - yaml依存なしでテスト用
"""

import json
import os
from pathlib import Path
from collections import defaultdict


def count_pr_states(pr_dir):
    """PRディレクトリの状態別カウントを取得"""
    states = defaultdict(int)
    total = 0

    for file_path in Path(pr_dir).glob("*.json"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            state = data.get("basic_info", {}).get("state", "unknown")
            states[state] += 1
            total += 1

        except Exception as e:
            print(f"エラー: {file_path} - {e}")

    return dict(states), total


def main():
    pr_dir = "/home/ubuntu/repos/pr-data-latest/prs"

    print("=== PR状態統計（事前チェック） ===")
    states, total = count_pr_states(pr_dir)

    print(f"総PR数: {total}")
    for state, count in sorted(states.items()):
        print(f"  {state}: {count}")

    with open("/tmp/state_check_before.json", "w", encoding="utf-8") as f:
        json.dump(
            {"total": total, "states": states, "timestamp": "before_update"},
            f,
            ensure_ascii=False,
            indent=2,
        )

    print(f"\n結果を /tmp/state_check_before.json に保存しました")


if __name__ == "__main__":
    main()
