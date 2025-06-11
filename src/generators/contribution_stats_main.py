#!/usr/bin/env python3
"""
改善貢献PR統計生成メインスクリプト
"""

import argparse
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent.parent))

from src.generators.contribution_stats import ContributionStatsGenerator


def main():
    """メイン関数"""
    parser = argparse.ArgumentParser(description="改善貢献PR統計をJSON形式で生成します")
    parser.add_argument(
        "--input-dir",
        default="../pr-data/prs",
        help="PRデータディレクトリのパス (デフォルト: ../pr-data/prs)",
    )
    parser.add_argument(
        "--output-file",
        default="../pr-data/reports/contribution_stats.json",
        help="出力JSONファイルのパス (デフォルト: ../pr-data/reports/contribution_stats.json)",
    )

    args = parser.parse_args()

    generator = ContributionStatsGenerator()
    result = generator.generate_stats(args.input_dir, args.output_file)

    if result:
        print(f"\n統計生成が成功しました: {args.output_file}")
        return 0
    else:
        print("\n統計生成に失敗しました")
        return 1


if __name__ == "__main__":
    sys.exit(main())
