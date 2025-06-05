#!/usr/bin/env python3
"""
PRデータ収集スクリプト

コマンドラインからPRデータを収集するためのスクリプトです。
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.collectors.pr_collector import PRCollector
from src.utils.github_api import load_config


def parse_args():
    """コマンドライン引数をパースする"""
    parser = argparse.ArgumentParser(description="GitHubのPRデータを収集するスクリプト")

    parser.add_argument(
        "--mode",
        choices=["update", "sequential", "uncollected"],
        default="update",
        help="収集モード: update=更新時間順, sequential=連番, uncollected=未収集優先",
    )

    parser.add_argument("--output-dir", help="PRデータの保存先ディレクトリ")

    parser.add_argument("--max-count", type=int, help="収集するPRの最大数")

    parser.add_argument(
        "--start-number", type=int, default=1, help="連番モードでの開始PR番号"
    )

    parser.add_argument("--end-number", type=int, help="連番モードでの終了PR番号")

    parser.add_argument(
        "--since",
        help="指定した日時以降に更新されたPRのみを収集 (ISO形式: YYYY-MM-DDTHH:MM:SSZ)",
    )

    return parser.parse_args()


def save_last_run_info(output_dir, mode, count):
    """最後の実行情報を保存する"""
    info = {
        "last_run": datetime.now().isoformat(),
        "mode": mode,
        "collected_count": count,
    }

    file_path = Path(output_dir) / "last_run_info.json"

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(info, f, ensure_ascii=False, indent=2)

    print(f"実行情報を {file_path} に保存しました")


def main():
    """メイン関数"""
    args = parse_args()
    config = load_config()

    output_dir = args.output_dir
    if not output_dir:
        output_dir = config["data"]["base_dir"]

    collector = PRCollector(config)

    if args.mode == "update":
        print("更新時間順にPRを収集します")
        count = collector.collect_prs_by_update_time(
            output_dir=output_dir, max_count=args.max_count, since=args.since
        )

    elif args.mode == "sequential":
        print(f"PR #{args.start_number} から連番でPRを収集します")
        count = collector.collect_prs_sequentially(
            start_number=args.start_number,
            end_number=args.end_number,
            output_dir=output_dir,
        )

    elif args.mode == "uncollected":
        print("未収集のPRを優先的に収集します")
        count = collector.collect_uncollected_prs(
            output_dir=output_dir, max_count=args.max_count
        )

    save_last_run_info(output_dir, args.mode, count)

    print(f"収集完了: {count}件のPRデータを収集しました")
    return 0


if __name__ == "__main__":
    sys.exit(main())
