#!/usr/bin/env python3
"""
政策レポート生成スクリプト

コマンドラインから政策レポートを生成するためのスクリプトです。
"""

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.generators.policy_report import PolicyReportGenerator


def parse_args():
    """コマンドライン引数をパースする"""
    parser = argparse.ArgumentParser(description="政策レポートを生成するスクリプト")
    
    parser.add_argument(
        "--input",
        required=True,
        help="PRデータのディレクトリ"
    )
    
    parser.add_argument(
        "--output-dir",
        required=True,
        help="レポート出力先ディレクトリ"
    )
    
    return parser.parse_args()


def main():
    """メイン関数"""
    args = parse_args()
    
    os.makedirs(args.output_dir, exist_ok=True)
    
    generator = PolicyReportGenerator()
    success = generator.generate_reports(args.input, args.output_dir)
    
    if success:
        print(f"レポートを {args.output_dir} に生成しました")
        return 0
    else:
        print("レポート生成に失敗しました")
        return 1


if __name__ == "__main__":
    sys.exit(main())
