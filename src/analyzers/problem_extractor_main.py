#!/usr/bin/env python3
"""
問題抽出スクリプト

コマンドラインからPR問題抽出を実行するためのスクリプトです。
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.problem_extractor import ProblemExtractor


def parse_args():
    """コマンドライン引数をパースする"""
    parser = argparse.ArgumentParser(description="PRから問題を抽出するスクリプト")

    parser.add_argument(
        "--input-dir", required=True, help="PRデータのディレクトリ"
    )

    parser.add_argument(
        "--output", required=True, help="抽出結果のJSONファイル"
    )

    parser.add_argument(
        "--api-key", help="OpenRouter APIキー（環境変数OPENROUTER_API_KEYでも指定可能）"
    )

    parser.add_argument(
        "--limit", type=int, help="処理するPR数の上限（テスト用）"
    )

    return parser.parse_args()


def main():
    """メイン関数"""
    args = parse_args()

    extractor = ProblemExtractor(api_key=args.api_key)
    pr_data = extractor.load_pr_data_from_directory(args.input_dir)

    if not pr_data:
        print("PRデータが見つかりませんでした")
        return 1

    print(f"{len(pr_data)}件のPRデータを読み込みました")

    results = extractor.extract_problems_from_prs(pr_data, args.output, args.limit)

    if results:
        print(f"問題抽出が完了しました。結果は {args.output} に保存されました")
        return 0
    else:
        print("問題抽出に失敗しました")
        return 1


if __name__ == "__main__":
    sys.exit(main())
