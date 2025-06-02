#!/usr/bin/env python3
"""
ワークフロー監視・診断スクリプト

GitHub Actionsワークフローの実行状況を監視し、
詳細な診断情報を提供します。
"""

import sys
import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.github_api import make_github_api_request, load_config

def check_workflow_health():
    """ワークフローの健全性をチェックする"""
    config = load_config()
    github_config = config["github"]
    
    repo_owner = github_config["repo_owner"]
    repo_name = github_config["repo_name"]
    api_base_url = github_config["api_base_url"]
    
    print("=== ワークフロー健全性チェック ===")
    
    try:
        url = f"{api_base_url}/repos/{repo_owner}/{repo_name}/actions/runs"
        params = {"per_page": 10}
        
        runs = make_github_api_request(url, params)
        
        if not runs.get("workflow_runs"):
            print("ワークフロー実行履歴が見つかりません")
            return
            
        recent_runs = runs["workflow_runs"][:5]
        
        print(f"最近の5回の実行:")
        for run in recent_runs:
            status = run["status"]
            conclusion = run["conclusion"]
            created_at = run["created_at"]
            
            status_emoji = "✅" if conclusion == "success" else "❌" if conclusion == "failure" else "⏳"
            print(f"  {status_emoji} {created_at} - {status}/{conclusion}")
        
        failed_count = sum(1 for run in recent_runs if run["conclusion"] == "failure")
        failure_rate = (failed_count / len(recent_runs)) * 100
        
        print(f"\n失敗率: {failure_rate:.1f}% ({failed_count}/{len(recent_runs)})")
        
        if failure_rate > 20:
            print("⚠️  失敗率が高いです。ワークフローの見直しを推奨します。")
        else:
            print("✅ ワークフローは正常に動作しています。")
            
    except Exception as e:
        print(f"ワークフロー健全性チェックでエラーが発生しました: {e}")

def generate_monitoring_report(output_file=None):
    """監視レポートを生成する"""
    report_data = {
        "generated_at": datetime.now().isoformat(),
        "workflow_health": {},
        "data_quality": {},
        "recommendations": []
    }
    
    if output_file:
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        print(f"監視レポートを {output_file} に生成しました")

def main():
    parser = argparse.ArgumentParser(description="ワークフロー監視・診断")
    parser.add_argument("--report", help="監視レポートの出力ファイル")
    args = parser.parse_args()
    
    check_workflow_health()
    
    if args.report:
        generate_monitoring_report(args.report)

if __name__ == "__main__":
    main()
