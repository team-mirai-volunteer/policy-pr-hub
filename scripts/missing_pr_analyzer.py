#!/usr/bin/env python3
"""
欠損PRの分析と診断スクリプト

GitHubリポジトリとローカルデータの間で欠損しているPR番号を特定し、
連番での欠損パターンを分析します。

使用目的:
- データ収集の抜け漏れ確認
- 収集戦略の最適化
- 問題箇所の特定

実行方法:
    python scripts/missing_pr_analyzer.py [--verbose]
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.github_api import make_github_api_request, load_config

def analyze_missing_prs(verbose=False):
    """欠損PRの分析を実行する"""
    config = load_config()
    github_config = config["github"]
    
    repo_owner = github_config["repo_owner"]
    repo_name = github_config["repo_name"]
    api_base_url = github_config["api_base_url"]
    
    print("GitHubから最新PR番号を取得中...")
    
    url = f"{api_base_url}/repos/{repo_owner}/{repo_name}/pulls"
    params = {
        "state": "all",
        "sort": "created",
        "direction": "desc",
        "per_page": 1
    }
    
    latest_prs = make_github_api_request(url, params)
    if not latest_prs:
        print("エラー: PRを取得できませんでした")
        return
    
    latest_pr_number = latest_prs[0]["number"]
    print(f"GitHub最新PR番号: #{latest_pr_number}")
    
    print("ローカルPRファイルを確認中...")
    
    local_pr_numbers = set()
    prs_dir = Path("/home/ubuntu/pr-data/prs")
    for json_file in prs_dir.glob("*.json"):
        if json_file.name != "last_run_info.json":
            try:
                pr_number = int(json_file.stem)
                local_pr_numbers.add(pr_number)
            except ValueError:
                continue
    
    print(f"ローカル総PR数: {len(local_pr_numbers):,}件")
    
    expected_range = set(range(1, latest_pr_number + 1))
    missing_numbers = expected_range - local_pr_numbers
    
    print(f"\n=== 連番欠損分析 ===")
    print(f"期待される総PR数: {len(expected_range):,}件 (1-{latest_pr_number})")
    print(f"実際のローカルPR数: {len(local_pr_numbers):,}件")
    print(f"欠損PR数: {len(missing_numbers):,}件")
    print(f"カバレッジ: {(len(local_pr_numbers) / len(expected_range) * 100):.1f}%")
    
    if missing_numbers:
        missing_sorted = sorted(missing_numbers)
        
        ranges = []
        start = missing_sorted[0]
        end = start
        
        for num in missing_sorted[1:]:
            if num == end + 1:
                end = num
            else:
                if start == end:
                    ranges.append(f"#{start}")
                else:
                    ranges.append(f"#{start}-#{end}")
                start = end = num
        
        if start == end:
            ranges.append(f"#{start}")
        else:
            ranges.append(f"#{start}-#{end}")
        
        print(f"\n欠損PR範囲（最初の20範囲）:")
        for i, range_str in enumerate(ranges[:20]):
            print(f"  {range_str}")
        
        if len(ranges) > 20:
            print(f"  ... 他 {len(ranges) - 20} 範囲")
        
        recent_start = max(1, latest_pr_number - 99)
        recent_missing = [num for num in missing_sorted if num >= recent_start]
        
        if recent_missing:
            print(f"\n最新100件範囲（#{recent_start}-#{latest_pr_number}）での欠損:")
            for num in recent_missing:
                print(f"  #{num}")
        else:
            print(f"\n最新100件範囲（#{recent_start}-#{latest_pr_number}）: 欠損なし")

def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(description="欠損PRの分析と診断")
    parser.add_argument("--verbose", action="store_true", help="詳細出力モード")
    args = parser.parse_args()
    
    analyze_missing_prs(verbose=args.verbose)

if __name__ == "__main__":
    main()
