#!/usr/bin/env python3
"""
医療PR課題・解決策抽出分析器

医療カテゴリのPRから課題と解決策を抽出し、kouchou-ai可視化用のJSONデータを生成します。
"""

import json
import os
from pathlib import Path
from collections import defaultdict
from datetime import datetime

import backoff
import requests

from ..utils.github_api import load_config


class MedicalPRAnalyzer:
    """医療PR課題・解決策抽出分析器"""

    def __init__(self, config=None, api_key=None):
        """初期化"""
        self.config = config or load_config()
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")
        self.total_cost = 0.0

    def load_pr_data_from_directory(self, input_dir):
        """PRデータをディレクトリから読み込む"""
        pr_data = []
        input_path = Path(input_dir)

        if not input_path.exists() or not input_path.is_dir():
            print(f"ディレクトリが存在しません: {input_dir}")
            return []

        json_files = list(input_path.glob("*.json"))
        print(f"{len(json_files)}件のPRデータファイルを見つけました")

        for json_file in json_files:
            if json_file.name == "last_run_info.json":
                continue
            try:
                with open(json_file, encoding="utf-8") as f:
                    pr = json.load(f)
                    pr_data.append(pr)
            except Exception as e:
                print(f"{json_file}の読み込み中にエラーが発生しました: {e}")

        return pr_data

    def filter_medical_prs(self, pr_data):
        """医療関連PRをフィルタリング"""
        medical_prs = []
        medical_keywords = ["医療", "健康", "病院", "診療", "介護", "医師", "看護", "薬", "治療"]
        
        for pr in pr_data:
            if not pr:
                continue
                
            labels = pr.get("labels", [])
            label_names = {label.get("name", "") for label in labels}
            
            if "医療" in label_names:
                medical_prs.append(pr)
                continue
            
            basic_info = pr.get("basic_info", {})
            title = basic_info.get("title") or ""
            body = basic_info.get("body") or ""
            
            content = f"{title.lower()} {body.lower()}"
            if any(keyword in content for keyword in medical_keywords):
                medical_prs.append(pr)
        
        print(f"医療関連PR: {len(medical_prs)}件を特定しました")
        return medical_prs

    def _extract_pr_content(self, pr):
        """PRから分析に必要なテキストを抽出"""
        texts = []

        basic_info = pr.get("basic_info", {})
        if basic_info.get("title"):
            texts.append(f"タイトル: {basic_info['title']}")
        if basic_info.get("body"):
            texts.append(f"説明: {basic_info['body']}")

        files = pr.get("files", [])
        if files:
            filenames = [file.get("filename", "") for file in files]
            texts.append(f"変更ファイル: {', '.join(filenames)}")

        commits = pr.get("commits", [])
        commit_msgs = []
        for commit in commits:
            if commit.get("commit", {}).get("message"):
                commit_msgs.append(commit["commit"]["message"])
        if commit_msgs:
            texts.append("コミットメッセージ:\n" + "\n".join(commit_msgs))

        return "\n\n".join(texts)

    @backoff.on_exception(
        backoff.expo,
        requests.exceptions.RequestException,
        max_tries=3,
    )
    def extract_issues_and_solutions(self, pr):
        """LLMを使用してPRから課題と解決策を抽出"""
        if not self.api_key:
            return self._keyword_based_extraction(pr)

        content = self._extract_pr_content(pr)

        url = "https://openrouter.ai/api/v1/chat/completions"

        prompt = f"""
あなたは政策提案PRの内容を分析し、ユーザが感じている課題と提案されている解決策を抽出する専門家です。

以下のPRの内容から、以下の情報を抽出してください：

PRの内容:
{content}

以下の形式でJSON形式で回答してください。
{{
  "issues": [
    {{
      "description": "ユーザが感じている課題の具体的な説明",
      "category": "課題のカテゴリ（例：アクセス、コスト、品質、制度など）",
      "severity": "課題の深刻度（高/中/低）"
    }}
  ],
  "solutions": [
    {{
      "description": "提案されている解決策の具体的な説明", 
      "approach": "解決アプローチ（例：制度改革、技術導入、予算措置など）",
      "feasibility": "実現可能性（高/中/低）"
    }}
  ],
  "confidence": 0.0〜1.0の数値（抽出の確信度）,
  "summary": "PRの要約（1-2文）"
}}
"""

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
                print(f"API使用料: ${cost:.6f} (入力: {input_tokens}トークン, 出力: {output_tokens}トークン)")

            content = result["choices"][0]["message"]["content"]
            analysis = json.loads(content)
            return analysis
        except Exception as e:
            print(f"LLM分析でエラーが発生しました: {e}")
            return self._keyword_based_extraction(pr)

    def _keyword_based_extraction(self, pr):
        """キーワードベースの抽出（フォールバック）"""
        basic_info = pr.get("basic_info", {})
        title = basic_info.get("title") or ""
        body = basic_info.get("body") or ""
        
        return {
            "issues": [{"description": f"タイトルから推測される課題: {title}", "category": "不明", "severity": "中"}],
            "solutions": [{"description": f"提案内容: {title}", "approach": "不明", "feasibility": "中"}],
            "confidence": 0.3,
            "summary": title[:100] + "..." if len(title) > 100 else title
        }

    def analyze_medical_prs(self, input_dir, output_file=None, max_count=None):
        """医療PRの課題・解決策分析を実行"""
        pr_data = self.load_pr_data_from_directory(input_dir)
        medical_prs = self.filter_medical_prs(pr_data)
        
        if max_count:
            medical_prs = medical_prs[:max_count]
            print(f"分析対象を{max_count}件に制限しました")
        
        results = []
        
        print(f"医療PR {len(medical_prs)}件を分析中...")
        
        for i, pr in enumerate(medical_prs):
            if i % 5 == 0:
                print(f"進捗: {i}/{len(medical_prs)}")
            
            basic_info = pr.get("basic_info", {})
            pr_number = basic_info.get("number")
            pr_title = basic_info.get("title")
            pr_url = basic_info.get("html_url")
            
            analysis = self.extract_issues_and_solutions(pr)
            
            result = {
                "pr_number": pr_number,
                "pr_title": pr_title,
                "pr_url": pr_url,
                "analysis": analysis,
                "analyzed_at": datetime.now().isoformat()
            }
            
            results.append(result)
        
        print(f"分析完了: {len(results)}件のPRを分析しました")
        print(f"総API使用料: ${self.total_cost:.6f}")
        
        output_data = {
            "metadata": {
                "total_analyzed": len(results),
                "analysis_date": datetime.now().isoformat(),
                "total_cost": self.total_cost,
                "category": "医療"
            },
            "results": results
        }
        
        if output_file:
            output_dir = os.path.dirname(output_file)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
            
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(output_data, f, ensure_ascii=False, indent=2)
            print(f"分析結果を {output_file} に保存しました")
        
        return output_data


def main():
    """メイン関数"""
    import argparse

    parser = argparse.ArgumentParser(description="医療PR課題・解決策抽出分析器")
    parser.add_argument("--input-dir", required=True, help="PRデータディレクトリ")
    parser.add_argument("--output", help="出力ファイル（指定しない場合は標準出力）")
    parser.add_argument("--api-key", help="OpenRouter APIキー（環境変数OPENROUTER_API_KEYでも指定可能）")
    parser.add_argument("--max-count", type=int, help="分析するPRの最大数")

    args = parser.parse_args()

    analyzer = MedicalPRAnalyzer(api_key=args.api_key)
    result = analyzer.analyze_medical_prs(args.input_dir, args.output, args.max_count)

    if not args.output:
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
