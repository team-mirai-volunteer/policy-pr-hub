#!/usr/bin/env python3
"""
PR問題抽出モジュール

PRデータから「提案者が解決すべき問題だと感じている内容」を抽出します。
"""

import json
import os
import requests
import backoff
from pathlib import Path

from ..utils.github_api import load_config


class ProblemExtractor:
    """PR問題抽出を行うクラス"""

    def __init__(self, api_key=None, config=None):
        """初期化"""
        self.config = config or load_config()
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.total_cost = 0.0

    def load_pr_data_from_directory(self, directory_path):
        """ディレクトリからPRデータを読み込む"""
        directory = Path(directory_path)
        pr_data = []

        if not directory.exists():
            print(f"ディレクトリが存在しません: {directory_path}")
            return pr_data

        json_files = list(directory.glob("*.json"))
        json_files = [f for f in json_files if f.name != "last_run_info.json"]

        print(f"{len(json_files)}件のPRデータファイルを読み込み中...")

        for json_file in json_files:
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    pr = json.load(f)
                    pr_data.append(pr)
            except Exception as e:
                print(f"{json_file}の読み込み中にエラーが発生しました: {e}")

        return pr_data

    @backoff.on_exception(
        backoff.expo,
        requests.exceptions.RequestException,
        max_tries=3,
    )
    def extract_problems_with_llm(self, pr):
        """LLMを使用してPRから問題を抽出"""
        if not self.api_key:
            return {"problems": [], "explanation": "APIキーが設定されていません"}

        content = self._extract_pr_content(pr)

        url = "https://openrouter.ai/api/v1/chat/completions"

        prompt = f"""あなたは専門的なリサーチアシスタントです。与えられたPull Request (PR)の内容から、提案者が解決すべき問題だと感じている内容を抽出してください。

* PRのタイトル、説明、コメント、コミットメッセージから問題意識を読み取ってください
* 抽出した問題は日本語で出力してください
* 複数の問題がある場合は分割してください
* 技術的な修正（typo、バグ修正など）ではなく、政策的・社会的な問題に焦点を当ててください

入力: タイトル「高齢者の孤立問題への対策強化」、説明「現在の高齢者支援制度では地域での孤立が解決されていない。より積極的な見守り体制が必要。」
出力:
{{
  "problems": [
    "高齢者の地域での孤立が深刻化している",
    "現在の高齢者支援制度では孤立問題に対応できていない"
  ],
  "explanation": "PRから明確な問題意識が読み取れます"
}}

入力: タイトル「typo fixed_row37」、説明「指導対象の指が抜け落ちていたため修正しました」
出力:
{{
  "problems": [],
  "explanation": "技術的な修正のため、政策的・社会的問題は含まれていません"
}}

PRの内容:
{content}

以下の形式でJSON形式で回答してください。
{{
  "problems": ["抽出した問題のリスト"],
  "explanation": "抽出理由の詳細説明"
}}"""

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        data = {
            "model": "openai/gpt-4o",
            "messages": [{"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
        }

        try:
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()

            result = response.json()

            if "usage" in result:
                usage = result["usage"]
                input_tokens = usage.get("prompt_tokens", 0)
                output_tokens = usage.get("completion_tokens", 0)
                cost = (input_tokens * 0.0025 + output_tokens * 0.01) / 1000
                self.total_cost += cost
                print(
                    f"API使用料: ${cost:.6f} (入力: {input_tokens}トークン, 出力: {output_tokens}トークン)"
                )

            content = result["choices"][0]["message"]["content"]
            analysis = json.loads(content)
            return analysis
        except Exception as e:
            print(f"LLM分析でエラーが発生しました: {e}")
            return {"problems": [], "explanation": f"エラーが発生しました: {e}"}

    def _extract_pr_content(self, pr):
        """PRから分析に必要なテキストを抽出"""
        texts = []

        basic_info = pr.get("basic_info", {})
        if basic_info.get("title"):
            texts.append(f"タイトル: {basic_info['title']}")
        if basic_info.get("body"):
            texts.append(f"説明: {basic_info['body']}")

        comments = pr.get("comments", [])
        if comments:
            comment_texts = []
            for comment in comments:
                if comment.get("body"):
                    comment_texts.append(comment["body"])
            if comment_texts:
                texts.append("コメント:\n" + "\n".join(comment_texts))

        commits = pr.get("commits", [])
        commit_msgs = []
        for commit in commits:
            if commit.get("commit", {}).get("message"):
                commit_msgs.append(commit["commit"]["message"])
        if commit_msgs:
            texts.append("コミットメッセージ:\n" + "\n".join(commit_msgs))

        return "\n\n".join(texts)

    def extract_problems_from_prs(self, pr_data_list, output_file=None, limit=None):
        """複数のPRから問題を抽出し、結果を単一のJSONファイルに保存"""
        results = {}
        total_problems = 0

        if limit:
            pr_data_list = pr_data_list[:limit]
            print(f"制限により{limit}件のPRのみを処理します")

        print(f"{len(pr_data_list)}件のPRを分析中...")

        for i, pr_data in enumerate(pr_data_list):
            if i % 10 == 0:
                print(f"進捗: {i}/{len(pr_data_list)}")

            if not pr_data or "basic_info" not in pr_data:
                continue

            pr_number = pr_data["basic_info"]["number"]
            pr_title = pr_data["basic_info"]["title"]
            pr_url = pr_data["basic_info"]["html_url"]

            analysis = self.extract_problems_with_llm(pr_data)

            result = {
                "pr_title": pr_title,
                "pr_url": pr_url,
                "problems": analysis.get("problems", []),
                "explanation": analysis.get("explanation", ""),
                "extracted_at": pr_data.get("collected_at", ""),
            }

            results[pr_number] = result
            total_problems += len(analysis.get("problems", []))

        print(f"分析完了: {len(results)}件のPRから{total_problems}件の問題を抽出")
        print(f"総API使用料: ${self.total_cost:.6f}")

        if output_file:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)
            print(f"抽出結果を {output_file} に保存しました")

        return results
