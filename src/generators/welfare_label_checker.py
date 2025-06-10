#!/usr/bin/env python3
"""
福祉ラベル割り当てチェッカー

オープンPRを分析して福祉ラベルに再割り当てすべきかどうかをチェックし、
Markdownレポートを生成します。
"""

import json
import os
from pathlib import Path
from collections import defaultdict

import backoff
import requests

from ..utils.github_api import load_config


class WelfareLabelChecker:
    """福祉ラベル割り当てをチェックするクラス"""

    def __init__(self, config=None, api_key=None):
        """初期化"""
        self.config = config or load_config()
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY")

        self.welfare_keywords = [
            "福祉",
            "介護",
            "高齢者支援",
            "障害者支援",
            "生活困窮者支援",
            "生活保護",
            "高齢者",
            "障害者",
            "介護休業",
            "介護保険",
            "社会保障",
            "セーフティネット",
            "社会福祉",
            "福祉制度",
            "介護サービス",
            "バリアフリー",
            "就労支援",
            "住宅支援",
            "ケアラー",
            "認知症",
            "要介護",
            "福祉施設",
            "デイサービス",
            "ホームヘルパー",
        ]

        self.policy_labels = {
            "教育",
            "医療",
            "経済財政",
            "子育て",
            "行政改革",
            "デジタル民主主義",
            "産業政策",
            "科学技術",
            "その他政策",
            "エネルギー",
            "README",
        }

        self.excluded_labels = {"[システム]", "ビジョン", "Devin AI", "thankyou"}

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
            try:
                with open(json_file, encoding="utf-8") as f:
                    pr = json.load(f)
                    pr_data.append(pr)
            except Exception as e:
                print(f"{json_file}の読み込み中にエラーが発生しました: {e}")

        return pr_data

    def filter_open_prs(self, pr_data):
        """オープンPRのみをフィルタリング"""
        return [pr for pr in pr_data if pr.get("basic_info", {}).get("state") == "open"]

    def should_exclude_pr(self, pr):
        """PRを除外すべきかチェック"""
        labels = pr.get("labels", [])
        label_names = {label.get("name", "") for label in labels}

        return bool(label_names & self.excluded_labels)

    def get_current_classification(self, pr):
        """PRの現在の分類を取得"""
        labels = pr.get("labels", [])
        label_names = {label.get("name", "") for label in labels}

        current_policy_labels = label_names & self.policy_labels

        if current_policy_labels:
            return list(current_policy_labels)
        elif label_names - self.excluded_labels:
            other_labels = label_names - self.excluded_labels - self.policy_labels
            if other_labels:
                return [f"その他ラベル({', '.join(other_labels)})"]
            else:
                return ["未ラベル"]
        else:
            return ["未ラベル"]

    @backoff.on_exception(
        backoff.expo,
        requests.exceptions.RequestException,
        max_tries=3,
    )
    def analyze_with_llm(self, pr):
        """LLMを使用してPRを分析"""
        if not self.api_key:
            return self._keyword_based_analysis(pr)

        content = self._extract_pr_content(pr)

        url = "https://openrouter.ai/api/v1/chat/completions"

        prompt = f"""
あなたはPull Request (PR)の内容を分析し、福祉分野に分類すべきかどうかを判定する専門家です。

福祉分野の定義:
- 高齢者支援（介護、年金、高齢者福祉など）
- 障害者支援（障害者福祉、バリアフリー、就労支援など）
- 生活困窮者支援（生活保護、住宅支援、就労支援など）
- 介護支援（介護保険、介護休業、介護者支援など）
- 社会保障制度全般
- 社会福祉制度

PRの内容:
{content}

以下の形式でJSON形式で回答してください。
{{
  "is_welfare": true/false,
  "confidence": 0.0〜1.0の数値（確信度）,
  "explanation": "判定理由の詳細説明",
  "welfare_aspects": ["該当する福祉分野の具体的な側面のリスト"]
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
                print(
                    f"API使用料: ${cost:.6f} (入力: {input_tokens}トークン, 出力: {output_tokens}トークン)"
                )

            content = result["choices"][0]["message"]["content"]
            analysis = json.loads(content)
            return analysis
        except Exception as e:
            print(f"LLM分析でエラーが発生しました: {e}")
            return self._keyword_based_analysis(pr)

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

    def _keyword_based_analysis(self, pr):
        """キーワードベースの分析（フォールバック）"""
        basic_info = pr.get("basic_info", {})
        title = basic_info.get("title", "").lower()
        body = basic_info.get("body", "").lower()

        files = pr.get("files", [])
        filenames = " ".join([file.get("filename", "") for file in files]).lower()

        content = f"{title} {body} {filenames}"
        matches = [kw for kw in self.welfare_keywords if kw.lower() in content]

        if matches:
            confidence = min(0.8, len(matches) * 0.2)  # キーワード数に基づく信頼度
            return {
                "is_welfare": True,
                "confidence": confidence,
                "explanation": f"福祉関連キーワードが検出されました: {', '.join(matches)}",
                "welfare_aspects": matches,
            }
        else:
            return {
                "is_welfare": False,
                "confidence": 0.3,
                "explanation": "福祉関連キーワードが検出されませんでした",
                "welfare_aspects": [],
            }

    def map_confidence_to_level(self, confidence):
        """信頼度を高/中/低にマッピング"""
        if confidence >= 0.7:
            return "高"
        elif confidence >= 0.4:
            return "中"
        else:
            return "低"

    def generate_welfare_report(self, pr_data, output_file=None, sample_every=None):
        """福祉ラベル割り当てレポートを生成"""
        open_prs = self.filter_open_prs(pr_data)
        welfare_candidates = []

        if sample_every:
            open_prs = [
                pr
                for pr in open_prs
                if pr.get("basic_info", {}).get("number", 0) % sample_every == 0
            ]
            print(
                f"サンプリング: {sample_every}個おきに選択、{len(open_prs)}件のPRを分析対象とします"
            )

        print(f"オープンPR {len(open_prs)}件を分析中...")

        for i, pr in enumerate(open_prs):
            if i % 10 == 0:
                print(f"進捗: {i}/{len(open_prs)}")

            if self.should_exclude_pr(pr):
                continue

            current_classification = self.get_current_classification(pr)

            if any("福祉" in cls for cls in current_classification):
                continue

            analysis = self.analyze_with_llm(pr)

            if analysis["is_welfare"] and analysis["confidence"] >= 0.3:
                basic_info = pr.get("basic_info", {})
                welfare_candidates.append(
                    {
                        "pr": pr,
                        "current_classification": current_classification,
                        "analysis": analysis,
                        "pr_number": basic_info.get("number"),
                        "pr_title": basic_info.get("title"),
                        "pr_url": basic_info.get("html_url"),
                    }
                )

        print(f"分析完了: {len(welfare_candidates)}件のPRで福祉ラベルへの変更を推奨")
        print(f"総API使用料: ${self.total_cost:.6f}")

        markdown = self._generate_markdown_report(welfare_candidates)

        if output_file:
            output_dir = os.path.dirname(output_file)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)

            with open(output_file, "w", encoding="utf-8") as f:
                f.write(markdown)
            print(f"福祉ラベル割り当てレポートを {output_file} に保存しました")

        return markdown

    def _generate_markdown_report(self, candidates):
        """Markdownレポートを生成"""
        if not candidates:
            return "# 福祉ラベル割り当てチェック結果\n\n福祉ラベルに変更すべきPRはありませんでした。\n"

        markdown = "# 福祉ラベル割り当てチェック結果\n\n"
        markdown += f"分析対象: {len(candidates)}件のPRで福祉ラベルへの変更を推奨\n"
        markdown += f"総API使用料: ${self.total_cost:.6f}\n\n"

        by_classification = defaultdict(list)
        for candidate in candidates:
            current = ", ".join(candidate["current_classification"])
            by_classification[current].append(candidate)

        for classification, prs in by_classification.items():
            markdown += f"## {classification}\n\n"

            for candidate in prs:
                confidence_level = self.map_confidence_to_level(
                    candidate["analysis"]["confidence"]
                )
                pr_url = candidate["pr_url"]
                pr_number = candidate["pr_number"]
                explanation = candidate["analysis"]["explanation"]

                markdown += f"- [PR #{pr_number}]({pr_url}): 確信度:({confidence_level}), {explanation}\n"

            markdown += "\n"

        return markdown


def main():
    """メイン関数"""
    import argparse

    parser = argparse.ArgumentParser(description="福祉ラベル割り当てチェッカー")
    parser.add_argument("--input-dir", required=True, help="PRデータディレクトリ")
    parser.add_argument("--output", help="出力ファイル（指定しない場合は標準出力）")
    parser.add_argument(
        "--api-key", help="OpenRouter APIキー（環境変数OPENROUTER_API_KEYでも指定可能）"
    )
    parser.add_argument(
        "--sample-every",
        type=int,
        help="サンプリング間隔（例: 20で20個おきにサンプリング）",
    )

    args = parser.parse_args()

    checker = WelfareLabelChecker(api_key=args.api_key)
    pr_data = checker.load_pr_data_from_directory(args.input_dir)

    if not pr_data:
        print("PRデータが見つかりませんでした")
        return

    report = checker.generate_welfare_report(pr_data, args.output, args.sample_every)

    if not args.output:
        print(report)


if __name__ == "__main__":
    main()
