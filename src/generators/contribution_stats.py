#!/usr/bin/env python3
"""
改善貢献PR統計生成モジュール

PRデータから改善貢献PR（merged または thankyou label付きclosed）の統計情報を
JSON形式で生成します。
"""

import json
import os
from collections import defaultdict
from datetime import datetime
from pathlib import Path


class ContributionStatsGenerator:
    """改善貢献PR統計を生成するクラス"""

    def __init__(self, config=None):
        """初期化"""
        self.config = config or {}

    def load_pr_data_from_directory(self, input_dir):
        """PRデータをディレクトリから読み込む（ファイルごとのPRデータ）"""
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

    def analyze_contribution_prs(self, pr_data):
        """改善貢献PRを分析する"""
        stats = {
            "total_prs": len(pr_data),
            "contribution_prs": 0,
            "merged_prs": 0,
            "thankyou_closed_prs": 0,
            "daily_counts": defaultdict(int),
        }

        for pr in pr_data:
            if not pr:
                continue

            basic_info = pr.get("basic_info", {})
            
            merged_at = basic_info.get("merged_at")
            is_merged = merged_at is not None
            
            state = basic_info.get("state")
            closed_at = basic_info.get("closed_at")
            labels = pr.get("labels", [])
            has_thankyou = any(label.get("name") == "thankyou" for label in labels)
            is_thankyou_closed = (state == "closed" and closed_at is not None and has_thankyou)
            
            is_contribution = is_merged or is_thankyou_closed
            
            if is_contribution:
                stats["contribution_prs"] += 1
                if is_merged:
                    stats["merged_prs"] += 1
                    date_str = merged_at[:10]
                else:
                    stats["thankyou_closed_prs"] += 1
                    date_str = closed_at[:10]
                
                stats["daily_counts"][date_str] += 1

        stats["daily_counts"] = dict(stats["daily_counts"])
        return stats

    def generate_json_stats(self, stats, output_file):
        """統計をJSON形式で出力する"""
        daily_counts_array = [
            {"date": date, "count": count}
            for date, count in sorted(stats["daily_counts"].items())
        ]
        
        json_data = {
            "total_contribution_prs": stats["contribution_prs"],
            "merged_prs": stats["merged_prs"],
            "thankyou_closed_prs": stats["thankyou_closed_prs"],
            "daily_counts": daily_counts_array,
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)

        print(f"統計JSONファイルを {output_path} に保存しました")
        return json_data

    def generate_stats(self, input_dir, output_file):
        """統計を生成する"""
        print("改善貢献PR統計の生成を開始します...")

        pr_data = self.load_pr_data_from_directory(input_dir)
        if not pr_data:
            print("PRデータがありません")
            return False

        stats = self.analyze_contribution_prs(pr_data)
        
        print(f"\n=== 統計結果 ===")
        print(f"総PR数: {stats['total_prs']}")
        print(f"改善貢献PR数: {stats['contribution_prs']}")
        print(f"  - マージされたPR: {stats['merged_prs']}")
        print(f"  - thankyouラベル付きクローズPR: {stats['thankyou_closed_prs']}")
        print(f"日別統計件数: {len(stats['daily_counts'])}日分")

        json_data = self.generate_json_stats(stats, output_file)
        
        print("改善貢献PR統計の生成が完了しました")
        return json_data
