#!/usr/bin/env python3
"""
GitHub API関連のユーティリティ関数

GitHubのAPIを呼び出すための共通機能を提供します。
"""

import datetime
import os
import time
import yaml
from pathlib import Path

import backoff
import requests


def load_config():
    """設定ファイルを読み込む"""
    config_path = Path(__file__).parent.parent.parent / "config" / "settings.yaml"
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_github_token():
    """環境変数からGitHubトークンを取得する"""
    config = load_config()
    token_env_var = config["github"]["token_env_var"]

    token = os.environ.get(token_env_var)
    if not token:
        try:
            import subprocess

            result = subprocess.run(
                ["gh", "auth", "token"], capture_output=True, text=True
            )
            if result.returncode == 0:
                token = result.stdout.strip()
        except Exception as e:
            print(f"gh CLIからトークンを取得できませんでした: {e}")

    return token


def get_headers():
    """APIリクエスト用のヘッダーを取得する"""
    token = get_github_token()
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"

    return headers


@backoff.on_exception(
    backoff.expo,
    (requests.exceptions.RequestException, requests.exceptions.HTTPError),
    max_tries=5,
    max_time=30,
    giveup=lambda e: isinstance(e, requests.exceptions.HTTPError)
    and e.response.status_code
    in [401, 403, 404],  # 認証エラーやリソースが存在しない場合は再試行しない
)
def make_github_api_request(url, params=None, headers=None):
    """GitHubのAPIリクエストを実行し、再試行ロジックを適用する"""
    if headers is None:
        headers = get_headers()

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()


@backoff.on_exception(
    backoff.expo,
    requests.exceptions.RequestException,
    max_tries=3,
)
def check_rate_limit():
    """GitHub APIのレート制限状況を確認する"""
    config = load_config()
    api_base_url = config["github"]["api_base_url"]

    url = f"{api_base_url}/rate_limit"
    response = requests.get(url, headers=get_headers())
    response.raise_for_status()

    rate_limit_data = response.json()
    core_rate = rate_limit_data["resources"]["core"]

    remaining = core_rate["remaining"]
    reset_time = datetime.datetime.fromtimestamp(core_rate["reset"])
    now = datetime.datetime.now()

    print(f"API制限: 残り {remaining} リクエスト")
    print(
        f"制限リセット時間: {reset_time} (あと {(reset_time - now).total_seconds() / 60:.1f} 分)"
    )

    return remaining, reset_time


def wait_for_rate_limit_reset(reset_time, buffer_seconds=5):
    """レート制限のリセット時間まで待機する"""
    now = datetime.datetime.now()
    wait_seconds = (reset_time - now).total_seconds() + buffer_seconds

    if wait_seconds > 0:
        print(f"レート制限に達しました。{wait_seconds:.1f}秒待機します...")
        time.sleep(wait_seconds)
        return True

    return False


def get_max_pr_number_from_local_data(prs_dir_path):
    """既存のPRデータファイルから最大PR番号を取得する"""
    prs_dir = Path(prs_dir_path)

    if not prs_dir.exists() or not prs_dir.is_dir():
        return None

    max_pr_number = 0
    for json_file in prs_dir.glob("*.json"):
        if json_file.name != "last_run_info.json":
            try:
                pr_number = int(json_file.stem)
                max_pr_number = max(max_pr_number, pr_number)
            except ValueError:
                continue

    return max_pr_number if max_pr_number > 0 else None
