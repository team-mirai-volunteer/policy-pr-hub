#!/usr/bin/env python3
"""
PRデータ収集モジュール

GitHubのAPIを使用してPRデータを収集し、ファイルに保存します。
"""

import json
import os
import time
from datetime import datetime, timedelta
from pathlib import Path

from ..utils.github_api import (
    load_config,
    make_github_api_request,
    check_rate_limit,
    wait_for_rate_limit_reset,
)


class PRCollector:
    """PRデータを収集するクラス"""

    def __init__(self, config=None):
        """初期化"""
        self.config = config or load_config()
        self.github_config = self.config["github"]
        self.data_config = self.config["data"]
        self.api_config = self.config.get("api", {})

        self.repo_owner = self.github_config["repo_owner"]
        self.repo_name = self.github_config["repo_name"]
        self.api_base_url = self.github_config["api_base_url"]

        self.base_dir = Path(self.data_config["base_dir"])
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_pr_list(
        self, state="all", sort="updated", direction="desc", per_page=100, page=1
    ):
        """PRの一覧を取得する"""
        url = f"{self.api_base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls"
        params = {
            "state": state,
            "sort": sort,
            "direction": direction,
            "per_page": per_page,
            "page": page,
        }

        return make_github_api_request(url, params)

    def get_pr_details(self, pr_number):
        """PRの詳細情報を取得する"""
        url = f"{self.api_base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls/{pr_number}"

        try:
            return make_github_api_request(url)
        except Exception as e:
            if hasattr(e, "response") and e.response.status_code == 404:
                print(f"PR #{pr_number} は存在しません")
                return None
            raise

    def get_pr_comments(self, pr_number):
        """PRのコメントを取得する"""
        url = f"{self.api_base_url}/repos/{self.repo_owner}/{self.repo_name}/issues/{pr_number}/comments"
        return make_github_api_request(url)

    def get_pr_review_comments(self, pr_number):
        """PRのレビューコメントを取得する"""
        url = f"{self.api_base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls/{pr_number}/comments"
        return make_github_api_request(url)

    def get_pr_files(self, pr_number):
        """PRで変更されたファイル一覧を取得する"""
        url = f"{self.api_base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls/{pr_number}/files"
        return make_github_api_request(url)

    def get_pr_commits(self, pr_number):
        """PRのコミット一覧を取得する"""
        url = f"{self.api_base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls/{pr_number}/commits"
        return make_github_api_request(url)

    def collect_pr_data(self, pr_number):
        """PRの全データを収集する"""
        print(f"PR #{pr_number} のデータを収集中...")

        pr_details = self.get_pr_details(pr_number)
        if not pr_details:
            return None

        basic_info = {
            "number": pr_details["number"],
            "title": pr_details["title"],
            "state": pr_details["state"],
            "created_at": pr_details["created_at"],
            "updated_at": pr_details["updated_at"],
            "closed_at": pr_details["closed_at"],
            "merged_at": pr_details["merged_at"],
            "html_url": pr_details["html_url"],
            "user": {
                "login": pr_details["user"]["login"],
                "id": pr_details["user"]["id"],
                "html_url": pr_details["user"]["html_url"],
            },
        }

        labels = pr_details.get("labels", [])

        comments = self.get_pr_comments(pr_number)
        review_comments = self.get_pr_review_comments(pr_number)

        files = self.get_pr_files(pr_number)

        commits = self.get_pr_commits(pr_number)

        pr_data = {
            "basic_info": basic_info,
            "labels": labels,
            "comments": comments,
            "review_comments": review_comments,
            "files": files,
            "commits": commits,
            "collected_at": datetime.now().isoformat(),
        }

        return pr_data

    def save_pr_data(self, pr_data, output_dir=None):
        """PRデータをJSONファイルに保存する"""
        if not pr_data or "basic_info" not in pr_data:
            return False

        pr_number = pr_data["basic_info"]["number"]

        if output_dir:
            save_dir = Path(output_dir)
        else:
            save_dir = self.base_dir

        save_dir.mkdir(parents=True, exist_ok=True)

        file_path = save_dir / f"{pr_number}.json"

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(pr_data, f, ensure_ascii=False, indent=2)

        print(f"PR #{pr_number} のデータを {file_path} に保存しました")
        return True

    def collect_prs_by_update_time(self, output_dir=None, max_count=None, since=None):
        """更新時間順にPRを収集する"""
        page = 1
        per_page = 100
        collected_count = 0

        while True:
            prs = self.get_pr_list(
                sort="updated", direction="desc", per_page=per_page, page=page
            )

            if not prs:
                break

            for pr in prs:
                pr_number = pr["number"]
                updated_at = pr["updated_at"]

                if output_dir:
                    save_dir = Path(output_dir)
                else:
                    save_dir = self.base_dir
                file_path = save_dir / f"{pr_number}.json"

                if file_path.exists():
                    print(f"PR #{pr_number} は既に収集済みのためスキップします")
                    continue

                if since and updated_at < since:
                    print(
                        f"PR #{pr_number} は {since} より前に更新されているためスキップします"
                    )
                    continue

                pr_data = self.collect_pr_data(pr_number)
                if pr_data:
                    self.save_pr_data(pr_data, output_dir)
                    collected_count += 1

                if max_count and collected_count >= max_count:
                    print(f"指定された最大数 {max_count} に達したため収集を終了します")
                    return collected_count

                time.sleep(self.api_config.get("request_delay", 0.5))

            page += 1

        return collected_count

    def collect_prs_sequentially(
        self, start_number=1, end_number=None, output_dir=None
    ):
        """連番でPRを収集する"""
        collected_count = 0
        current_number = start_number

        while True:
            if end_number and current_number > end_number:
                break

            remaining, reset_time = check_rate_limit()
            if remaining < 10:
                wait_for_rate_limit_reset(reset_time)

            pr_data = self.collect_pr_data(current_number)
            if pr_data:
                self.save_pr_data(pr_data, output_dir)
                collected_count += 1

            current_number += 1

            time.sleep(self.api_config.get("request_delay", 0.5))

        return collected_count

    def get_missing_pr_numbers(self, output_dir=None):
        """ローカルに存在しない（欠損している）PR番号のリストを取得する"""
        known_issue_numbers = {181, 182, 194, 215, 802, 931, 1803}
        
        if output_dir:
            prs_dir = Path(output_dir)
        else:
            prs_dir = self.base_dir
            
        from ..utils.github_api import get_max_pr_number_from_local_data
        local_max_pr = get_max_pr_number_from_local_data(prs_dir)
        
        url = f"{self.api_base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls"
        params = {"state": "all", "sort": "created", "direction": "desc", "per_page": 1}

        latest_prs = make_github_api_request(url, params)
        if not latest_prs:
            if local_max_pr:
                latest_pr_number = local_max_pr
            else:
                return []
        else:
            latest_pr_number = latest_prs[0]["number"]

        local_pr_numbers = set()
        for json_file in prs_dir.glob("*.json"):
            if json_file.name != "last_run_info.json":
                try:
                    pr_number = int(json_file.stem)
                    local_pr_numbers.add(pr_number)
                except ValueError:
                    continue

        expected_range = set(range(1, latest_pr_number + 1))
        missing_numbers = expected_range - local_pr_numbers - known_issue_numbers
        return sorted(missing_numbers)

    def collect_uncollected_prs(self, output_dir=None, max_count=None):
        """未収集のPRを優先的に収集する"""
        missing_numbers = self.get_missing_pr_numbers(output_dir)

        if not missing_numbers:
            print("未収集のPRはありません")
            return 0

        print(f"未収集PR数: {len(missing_numbers):,}件")

        collected_count = 0
        for pr_number in missing_numbers:
            remaining, reset_time = check_rate_limit()
            if remaining < 10:
                wait_for_rate_limit_reset(reset_time)

            pr_data = self.collect_pr_data(pr_number)
            if pr_data:
                self.save_pr_data(pr_data, output_dir)
                collected_count += 1

            if max_count and collected_count >= max_count:
                print(f"指定された最大数 {max_count} に達したため収集を終了します")
                break

            time.sleep(self.api_config.get("request_delay", 0.5))

        return collected_count
        
    def needs_state_update(self, pr_number, local_file_path):
        """PRの状態更新が必要かチェックする"""
        if not local_file_path.exists():
            return True
        
        try:
            with open(local_file_path, 'r', encoding='utf-8') as f:
                local_data = json.load(f)
            
            local_basic_info = local_data.get('basic_info', {})
            local_updated_at = local_basic_info.get('updated_at')
            local_state = local_basic_info.get('state')
            local_merged_at = local_basic_info.get('merged_at')
            
            if not local_updated_at or not local_state:
                print(f"PR #{pr_number} のローカルデータが不完全です")
                return True
            
            pr_details = self.get_pr_details(pr_number)
            if not pr_details:
                return False
            
            github_updated_at = pr_details['updated_at']
            github_state = pr_details['state']
            github_merged_at = pr_details.get('merged_at')
            
            state_changed = local_state != github_state
            updated_time_changed = local_updated_at != github_updated_at
            merged_status_changed = local_merged_at != github_merged_at
            
            if state_changed or updated_time_changed or merged_status_changed:
                print(f"PR #{pr_number} の状態変更を検出: {local_state} → {github_state}")
                return True
            
            return False
            
        except Exception as e:
            print(f"PR #{pr_number} の状態チェック中にエラーが発生しました: {e}")
            return True
    
    def collect_prs_with_state_check(self, output_dir=None, max_count=None, check_recent_days=30):
        """状態変更をチェックしながらPRを収集する"""
        page = 1
        per_page = 100
        collected_count = 0
        updated_count = 0
        
        cutoff_date = (datetime.now() - timedelta(days=check_recent_days)).isoformat()
        
        print(f"=== PR状態更新チェック開始 ===")
        print(f"チェック対象期間: 最近{check_recent_days}日間")
        print(f"カットオフ日時: {cutoff_date}")
        
        while True:
            remaining, reset_time = check_rate_limit()
            if remaining < 20:
                print(f"Rate Limit残り{remaining}件のため待機中...")
                wait_for_rate_limit_reset(reset_time)
            
            prs = self.get_pr_list(sort="updated", direction="desc", 
                                  per_page=per_page, page=page)
            
            if not prs:
                break
                
            for pr in prs:
                pr_number = pr["number"]
                updated_at = pr["updated_at"]
                
                if updated_at < cutoff_date:
                    print(f"古いPR（{cutoff_date}以前）に到達したため終了")
                    return collected_count, updated_count
                
                if output_dir:
                    save_dir = Path(output_dir)
                else:
                    save_dir = self.base_dir
                file_path = save_dir / f"{pr_number}.json"
                
                if self.needs_state_update(pr_number, file_path):
                    print(f"PR #{pr_number} の状態更新を実行中...")
                    
                    old_state = None
                    if file_path.exists():
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                old_data = json.load(f)
                            old_state = old_data.get('basic_info', {}).get('state')
                        except:
                            pass
                    
                    pr_data = self.collect_pr_data(pr_number)
                    if pr_data:
                        self.save_pr_data(pr_data, output_dir)
                        
                        new_state = pr_data.get('basic_info', {}).get('state')
                        
                        if old_state is not None:
                            updated_count += 1
                            if old_state != new_state:
                                print(f"  状態変更: {old_state} → {new_state}")
                        else:
                            collected_count += 1
                            print(f"  新規収集: {new_state}")
                            
                    if max_count and (collected_count + updated_count) >= max_count:
                        print(f"指定された最大数 {max_count} に達したため終了")
                        return collected_count, updated_count
                        
                    time.sleep(self.api_config.get("request_delay", 0.5))
                else:
                    print(f"PR #{pr_number} は最新状態です")
                    
            page += 1
            
        print(f"=== PR状態更新チェック完了 ===")
        print(f"新規収集: {collected_count}件")
        print(f"状態更新: {updated_count}件")
        
        return collected_count, updated_count
