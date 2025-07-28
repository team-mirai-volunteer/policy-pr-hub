#!/usr/bin/env python3
"""
PR番号とIssue番号の重複解決スクリプト

GitHubではPRとIssueが共通の連番を使用するため、欠番と思われるPR番号が
実際にはIssueとして存在する可能性があります。このスクリプトは欠番PR番号を
Issueとして確認し、実質的なデータカバレッジを正確に計算します。

使用目的:
- 100%カバレッジ達成の確認
- PR/Issue混在システムでの正確性検証
- データ完全性の最終確認

実行方法:
    python scripts/issue_pr_resolver.py [--debug]
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.github_api import make_github_api_request, load_config


def resolve_pr_issue_conflicts(debug=False):
    """PR番号とIssue番号の重複を解決する"""
    config = load_config()
    github_config = config["github"]

    repo_owner = github_config["repo_owner"]
    repo_name = github_config["repo_name"]
    api_base_url = github_config["api_base_url"]

    missing_pr_numbers = [181, 182, 194, 215, 802, 931, 1803]

    if debug:
        print(f"デバッグモード: 確認対象PR番号 {missing_pr_numbers}")

    print("=== 欠番PRのIssue存在確認 ===\n")

    issue_exists = []
    pr_only_missing = []

    for pr_number in missing_pr_numbers:
        print(f"#{pr_number} を確認中...")

        issue_url = f"{api_base_url}/repos/{repo_owner}/{repo_name}/issues/{pr_number}"

        try:
            issue_data = make_github_api_request(issue_url)

            if issue_data:
                issue_title = issue_data.get("title", "タイトル不明")
                issue_state = issue_data.get("state", "状態不明")
                is_pull_request = "pull_request" in issue_data

                if is_pull_request:
                    print(f"  → PR #{pr_number}: {issue_title} ({issue_state})")
                    print("     注意: これはPRです（Issue APIでもアクセス可能）")
                else:
                    print(f"  → Issue #{pr_number}: {issue_title} ({issue_state})")
                    issue_exists.append(
                        {
                            "number": pr_number,
                            "title": issue_title,
                            "state": issue_state,
                        }
                    )
            else:
                print(f"  → #{pr_number}: 存在しません（PRでもIssueでもない）")
                pr_only_missing.append(pr_number)

        except Exception as e:
            print(f"  → #{pr_number}: エラー - {str(e)}")
            pr_only_missing.append(pr_number)

        print()

    print("=== 確認結果サマリー ===")
    print(f"確認対象: {len(missing_pr_numbers)}件")
    print(f"Issueとして存在: {len(issue_exists)}件")
    print(f"完全に欠番: {len(pr_only_missing)}件")

    if issue_exists:
        print("\n📋 Issueとして存在する番号:")
        for issue in issue_exists:
            print(f"  #{issue['number']}: {issue['title']} ({issue['state']})")

    if pr_only_missing:
        print("\n❌ 完全に欠番の番号:")
        for num in pr_only_missing:
            print(f"  #{num}")

    total_github_numbers = 1834  # 最新PR番号
    actual_missing = len(pr_only_missing)
    coverage = ((total_github_numbers - actual_missing) / total_github_numbers) * 100

    print("\n📊 更新されたカバレッジ:")
    print(f"  GitHub総番号: {total_github_numbers}")
    print(f"  実際の欠番: {actual_missing}件")
    print(f"  カバレッジ: {coverage:.2f}%")

    if len(issue_exists) > 0:
        print(f"\n✅ {len(issue_exists)}件がIssueとして存在するため、")
        print("   PRデータとしての欠番は正常です。")


def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(description="PR番号とIssue番号の重複解決")
    parser.add_argument("--debug", action="store_true", help="デバッグ出力モード")
    args = parser.parse_args()

    resolve_pr_issue_conflicts(debug=args.debug)


if __name__ == "__main__":
    main()
