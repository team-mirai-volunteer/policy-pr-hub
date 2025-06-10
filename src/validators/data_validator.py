#!/usr/bin/env python3
"""
データ検証モジュール

GitHub APIから取得した統計情報とローカルに保存されたPRデータを比較し、
データの整合性を検証します。
"""

import json
import os
from collections import defaultdict, Counter
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from ..utils.github_api import make_github_api_request, load_config

issues = [181, 182, 194, 215, 802, 931, 1803]


class DataValidator:
    """GitHub APIとローカルデータの整合性を検証するクラス"""

    def __init__(self, config=None):
        """初期化"""
        self.config = config or load_config()
        self.github_config = self.config["github"]
        self.data_config = self.config["data"]

        self.repo_owner = self.github_config["repo_owner"]
        self.repo_name = self.github_config["repo_name"]
        self.api_base_url = self.github_config["api_base_url"]

        self.base_dir = Path(self.data_config["base_dir"])

    def get_github_pr_stats(self) -> Dict:
        """GitHub APIからPR統計を取得"""
        print("GitHub APIからPR統計を取得中...")

        stats = {
            "total_prs": 0,
            "state_counts": {"open": 0, "closed": 0, "merged": 0},
            "label_counts": defaultdict(int),
            "user_counts": defaultdict(int),
            "monthly_counts": defaultdict(int),
        }

        page = 1
        per_page = 100

        while True:
            url = f"{self.api_base_url}/repos/{self.repo_owner}/{self.repo_name}/pulls"
            params = {
                "state": "all",
                "sort": "created",
                "direction": "desc",
                "per_page": per_page,
                "page": page,
            }

            prs = make_github_api_request(url, params)

            if not prs:
                break

            for pr in prs:
                stats["total_prs"] += 1

                if pr["merged_at"]:
                    stats["state_counts"]["merged"] += 1
                else:
                    stats["state_counts"][pr["state"]] += 1

                for label in pr.get("labels", []):
                    stats["label_counts"][label["name"]] += 1

                stats["user_counts"][pr["user"]["login"]] += 1

                created_date = datetime.fromisoformat(
                    pr["created_at"].replace("Z", "+00:00")
                )
                month_key = created_date.strftime("%Y-%m")
                stats["monthly_counts"][month_key] += 1

            page += 1

            if page > 100:  # 最大10,000件
                print("警告: PR数が非常に多いため、最初の10,000件のみを処理しました")
                break

        stats["label_counts"] = dict(stats["label_counts"])
        stats["user_counts"] = dict(stats["user_counts"])
        stats["monthly_counts"] = dict(stats["monthly_counts"])

        return stats

    def get_local_pr_stats(self, data_dir: Optional[str] = None) -> Dict:
        """ローカルPRデータから統計を取得"""
        print("ローカルPRデータから統計を取得中...")

        if data_dir:
            base_dir = Path(data_dir)
            if (base_dir / "prs").exists():
                base_dir = base_dir / "prs"
        else:
            base_dir = self.base_dir

        if not base_dir.exists():
            print(f"警告: データディレクトリ {base_dir} が存在しません")
            return {
                "total_prs": 0,
                "state_counts": {"open": 0, "closed": 0, "merged": 0},
                "label_counts": {},
                "user_counts": {},
                "monthly_counts": {},
                "file_count": 0,
            }

        stats = {
            "total_prs": 0,
            "state_counts": {"open": 0, "closed": 0, "merged": 0},
            "label_counts": defaultdict(int),
            "user_counts": defaultdict(int),
            "monthly_counts": defaultdict(int),
            "file_count": 0,
        }

        json_files = list(base_dir.glob("*.json"))
        stats["file_count"] = len(json_files)

        for json_file in json_files:
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    pr_data = json.load(f)

                basic_info = pr_data.get("basic_info", {})
                if not basic_info:
                    continue

                stats["total_prs"] += 1

                if basic_info.get("merged_at"):
                    stats["state_counts"]["merged"] += 1
                else:
                    stats["state_counts"][basic_info.get("state", "unknown")] += 1

                for label in pr_data.get("labels", []):
                    stats["label_counts"][label["name"]] += 1

                user_info = basic_info.get("user", {})
                if user_info:
                    stats["user_counts"][user_info.get("login", "unknown")] += 1

                created_at = basic_info.get("created_at")
                if created_at:
                    created_date = datetime.fromisoformat(
                        created_at.replace("Z", "+00:00")
                    )
                    month_key = created_date.strftime("%Y-%m")
                    stats["monthly_counts"][month_key] += 1

            except Exception as e:
                print(f"警告: {json_file} の読み込みに失敗しました: {e}")
                continue

        stats["label_counts"] = dict(stats["label_counts"])
        stats["user_counts"] = dict(stats["user_counts"])
        stats["monthly_counts"] = dict(stats["monthly_counts"])

        return stats

    def compare_stats(self, github_stats: Dict, local_stats: Dict) -> Dict:
        """GitHub統計とローカル統計を比較"""
        print("統計データを比較中...")

        comparison = {"summary": {}, "differences": {}, "recommendations": []}

        github_total = github_stats.get("total_prs", 0)
        local_total = local_stats.get("total_prs", 0)

        comparison["summary"] = {
            "github_total_prs": github_total,
            "local_total_prs": local_total,
            "local_file_count": local_stats.get("file_count", 0),
            "difference": github_total - local_total,
            "coverage_percentage": (local_total / github_total * 100)
            if github_total > 0
            else 0,
        }

        comparison["differences"]["states"] = {}
        for state in ["open", "closed", "merged"]:
            github_count = github_stats.get("state_counts", {}).get(state, 0)
            local_count = local_stats.get("state_counts", {}).get(state, 0)
            comparison["differences"]["states"][state] = {
                "github": github_count,
                "local": local_count,
                "difference": github_count - local_count,
            }

        github_labels = github_stats.get("label_counts", {})
        local_labels = local_stats.get("label_counts", {})
        all_labels = set(github_labels.keys()) | set(local_labels.keys())

        label_diffs = {}
        for label in all_labels:
            github_count = github_labels.get(label, 0)
            local_count = local_labels.get(label, 0)
            if github_count > 0 or local_count > 0:
                label_diffs[label] = {
                    "github": github_count,
                    "local": local_count,
                    "difference": github_count - local_count,
                }

        sorted_labels = sorted(
            label_diffs.items(), key=lambda x: abs(x[1]["difference"]), reverse=True
        )[:10]
        comparison["differences"]["labels"] = dict(sorted_labels)

        if comparison["summary"]["difference"] > 0:
            comparison["recommendations"].append(
                f"{comparison['summary']['difference']}件のPRがローカルに不足しています。データ収集を実行してください。"
            )

        if comparison["summary"]["coverage_percentage"] < 95:
            comparison["recommendations"].append(
                f"データカバレッジが{comparison['summary']['coverage_percentage']:.1f}%です。完全性を向上させるため、全体的なデータ再収集を検討してください。"
            )

        for state, counts in comparison["differences"]["states"].items():
            if abs(counts["difference"]) > 10:
                comparison["recommendations"].append(
                    f"{state}状態のPRに{abs(counts['difference'])}件の差異があります。該当するPRの再収集が必要です。"
                )

        return comparison

    def generate_validation_report(
        self, comparison: Dict, output_file: Optional[str] = None
    ) -> str:
        """検証レポートを生成"""
        print("検証レポートを生成中...")

        report_lines = [
            "# GitHub API vs ローカルデータ 整合性検証レポート",
            "",
            f"**生成日時**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## 概要",
            "",
            f"- **GitHub総PR数**: {comparison['summary']['github_total_prs']:,}件",
            f"- **ローカル総PR数**: {comparison['summary']['local_total_prs']:,}件",
            f"- **ローカルファイル数**: {comparison['summary']['local_file_count']:,}件",
            f"- **差異**: {comparison['summary']['difference']:,}件",
            f"- **カバレッジ**: {comparison['summary']['coverage_percentage']:.1f}%",
            "",
            "## 状態別比較",
            "",
            "| 状態 | GitHub | ローカル | 差異 |",
            "|------|--------|----------|------|",
        ]

        for state, counts in comparison["differences"]["states"].items():
            report_lines.append(
                f"| {state} | {counts['github']:,} | {counts['local']:,} | {counts['difference']:+,} |"
            )

        report_lines.extend(
            [
                "",
                "## ラベル別比較（差異上位10件）",
                "",
                "| ラベル | GitHub | ローカル | 差異 |",
                "|--------|--------|----------|------|",
            ]
        )

        for label, counts in comparison["differences"]["labels"].items():
            report_lines.append(
                f"| {label} | {counts['github']:,} | {counts['local']:,} | {counts['difference']:+,} |"
            )

        if comparison["recommendations"]:
            report_lines.extend(["", "## 推奨アクション", ""])
            for i, recommendation in enumerate(comparison["recommendations"], 1):
                report_lines.append(f"{i}. {recommendation}")

        report_lines.extend(["", "---", "*このレポートは自動生成されました*"])

        report_content = "\n".join(report_lines)

        if output_file:
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, "w", encoding="utf-8") as f:
                f.write(report_content)

            print(f"検証レポートを {output_path} に保存しました")

        return report_content

    def validate_data(
        self, data_dir: Optional[str] = None, output_file: Optional[str] = None
    ) -> Dict:
        """データ検証を実行"""
        print("データ検証を開始します...")

        try:
            github_stats = self.get_github_pr_stats()

            local_stats = self.get_local_pr_stats(data_dir)

            comparison = self.compare_stats(github_stats, local_stats)

            report = self.generate_validation_report(comparison, output_file)

            print("データ検証が完了しました")
            return {
                "github_stats": github_stats,
                "local_stats": local_stats,
                "comparison": comparison,
                "report": report,
            }

        except Exception as e:
            print(f"エラー: データ検証中に問題が発生しました: {e}")
            raise
