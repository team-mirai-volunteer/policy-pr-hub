#!/usr/bin/env python3
"""
改善貢献PR統計データをGitHub Gistにアップロードするスクリプト
"""

import os
import json
import requests
from datetime import datetime, timezone
from pathlib import Path

def upload_to_gist(json_data, github_token, gist_id=None):
    """
    JSONデータをGitHub Gistにアップロードする
    """
    if not github_token:
        print("GitHub token not provided, skipping Gist upload")
        return None

    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    filename = "contribution_stats.json"
    
    gist_data = {
        "description": f"改善貢献PR統計データ - {timestamp}",
        "public": False,
        "files": {
            filename: {
                "content": json.dumps(json_data, ensure_ascii=False, indent=2)
            }
        }
    }

    try:
        if gist_id:
            url = f"https://api.github.com/gists/{gist_id}"
            response = requests.patch(url, headers=headers, json=gist_data)
        else:
            url = "https://api.github.com/gists"
            response = requests.post(url, headers=headers, json=gist_data)

        if response.status_code in [200, 201]:
            gist_info = response.json()
            print(f"Gist uploaded successfully: {gist_info['html_url']}")
            return gist_info
        else:
            print(f"Failed to upload Gist: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error uploading to Gist: {e}")
        return None

def main():
    json_file_path = Path("../pr-data/reports/contribution_stats.json")
    
    if not json_file_path.exists():
        print(f"統計JSONファイルが見つかりません: {json_file_path}")
        return 1
    
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        print(f"統計データを読み込みました: {json_file_path}")
        print(f"改善貢献PR数: {json_data.get('total_contribution_prs', 0)}")
    except Exception as e:
        print(f"JSONファイルの読み込みエラー: {e}")
        return 1
    
    github_token = os.environ.get("GIST_TOKEN") or os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    gist_id = os.environ.get("GIST_ID")  # 既存のGist IDがあれば更新
    
    print("改善貢献PR統計データのGistアップロードを開始...")
    print(f"GitHub token available: {'Yes' if github_token else 'No'}")
    print(f"Gist ID available: {'Yes' if gist_id else 'No'}")
    
    if github_token:
        result = upload_to_gist(json_data, github_token, gist_id)
        if result:
            print("統計データのGistアップロードが成功しました!")
            print(f"Gist URL: {result['html_url']}")
            return 0
        else:
            print("Gistアップロードに失敗しました。")
            return 1
    else:
        print("GitHub tokenが見つかりません。")
        print("GITHUB_TOKEN または GH_TOKEN 環境変数を設定してください。")
        return 1

if __name__ == "__main__":
    exit(main())
