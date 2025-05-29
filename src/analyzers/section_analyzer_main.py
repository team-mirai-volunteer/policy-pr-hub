#!/usr/bin/env python3
"""
セクション分析スクリプト

コマンドラインからセクション分析を実行するためのスクリプトです。
"""

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.analyzers.section_analyzer import SectionAnalyzer


def parse_args():
    """コマンドライン引数をパースする"""
    parser = argparse.ArgumentParser(description="PRのセクション分析を行うスクリプト")
    
    parser.add_argument(
        "--input",
        required=True,
        help="PRデータのディレクトリまたはJSONファイル"
    )
    
    parser.add_argument(
        "--output",
        required=True,
        help="出力レポートのファイルパス"
    )
    
    return parser.parse_args()


def load_pr_data(input_path):
    """PRデータを読み込む"""
    input_path = Path(input_path)
    pr_data = []
    
    if input_path.is_file():
        with open(input_path, encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                pr_data = data
            else:
                pr_data = [data]
    elif input_path.is_dir():
        json_files = list(input_path.glob("*.json"))
        print(f"{len(json_files)}件のPRデータファイルを見つけました")
        
        for json_file in json_files:
            try:
                with open(json_file, encoding="utf-8") as f:
                    pr = json.load(f)
                    pr_data.append(pr)
            except Exception as e:
                print(f"{json_file}の読み込み中にエラーが発生しました: {e}")
    else:
        print(f"指定されたパスが存在しません: {input_path}")
        
    return pr_data


def main():
    """メイン関数"""
    args = parse_args()
    
    pr_data = load_pr_data(args.input)
    if not pr_data:
        print("PRデータがありません")
        return 1
        
    print(f"{len(pr_data)}件のPRデータを読み込みました")
    
    analyzer = SectionAnalyzer()
    results = analyzer.analyze_prs(pr_data)
    
    analyzer.generate_section_report(results, args.output)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
