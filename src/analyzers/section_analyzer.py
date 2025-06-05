#!/usr/bin/env python3
"""
PRのセクション分析モジュール

PRで変更されたマークダウンファイルのセクション（見出し）を分析します。
"""

import json
import os
import re
from pathlib import Path

from ..utils.github_api import load_config


class SectionAnalyzer:
    """PRのセクション分析を行うクラス"""

    def __init__(self, config=None):
        """初期化"""
        self.config = config or load_config()

    def extract_sections_from_patch(self, patch):
        """パッチからセクション（見出し）を抽出する"""
        if not patch:
            return []

        heading_pattern = r"^\+\s*(#{1,6})\s+(.+)$"

        sections = []
        for line in patch.split("\n"):
            match = re.match(heading_pattern, line)
            if match:
                level = len(match.group(1))  # #の数（見出しレベル）
                title = match.group(2).strip()
                sections.append({"level": level, "title": title, "line": line})

        return sections

    def analyze_pr_files(self, pr_data):
        """PRのファイル変更からセクション情報を抽出する"""
        if not pr_data or "files" not in pr_data:
            return []

        sections = []
        for file_info in pr_data["files"]:
            filename = file_info.get("filename", "")
            if not filename.lower().endswith((".md", ".markdown")):
                continue

            patch = file_info.get("patch")
            if not patch:
                continue

            file_sections = self.extract_sections_from_patch(patch)
            if file_sections:
                sections.append({"filename": filename, "sections": file_sections})

        return sections

    def analyze_prs(self, pr_data_list):
        """複数のPRのセクション分析を行う"""
        results = {}

        for pr_data in pr_data_list:
            if not pr_data or "basic_info" not in pr_data:
                continue

            pr_number = pr_data["basic_info"]["number"]
            pr_title = pr_data["basic_info"]["title"]
            pr_url = pr_data["basic_info"]["html_url"]

            sections_info = self.analyze_pr_files(pr_data)
            if not sections_info:
                continue

            pr_info = {
                "number": pr_number,
                "title": pr_title,
                "url": pr_url,
                "files": [],
            }

            for file_info in sections_info:
                filename = file_info["filename"]
                pr_info["files"].append(
                    {"filename": filename, "sections": file_info["sections"]}
                )

                for section in file_info["sections"]:
                    section_title = section["title"]
                    if section_title not in results:
                        results[section_title] = []

                    if not any(
                        pr["number"] == pr_number for pr in results[section_title]
                    ):
                        results[section_title].append(
                            {
                                "number": pr_number,
                                "title": pr_title,
                                "url": pr_url,
                                "filename": filename,
                            }
                        )

        return results

    def generate_section_report(self, section_results, output_file=None):
        """セクション分析結果からマークダウンレポートを生成する"""
        if not section_results:
            return "セクション分析結果がありません。"

        report = "# セクション別PR分析レポート\n\n"

        sorted_sections = sorted(section_results.keys())

        report += "## 目次\n\n"
        for section in sorted_sections:
            section_link = (
                section.lower()
                .replace(" ", "-")
                .replace(".", "")
                .replace("(", "")
                .replace(")", "")
            )
            report += (
                f"- [{section}](#{section_link}) ({len(section_results[section])}件)\n"
            )

        report += "\n---\n\n"

        for section in sorted_sections:
            prs = section_results[section]
            report += f"## {section}\n\n"

            for pr in prs:
                report += f"- [PR #{pr['number']}]({pr['url']}) {pr['title']} ({pr['filename']})\n"

            report += "\n"

        if output_file:
            output_dir = os.path.dirname(output_file)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)

            with open(output_file, "w", encoding="utf-8") as f:
                f.write(report)
            print(f"セクションレポートを {output_file} に保存しました")

        return report
