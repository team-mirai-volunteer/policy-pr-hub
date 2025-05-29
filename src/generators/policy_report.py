#!/usr/bin/env python3
"""
政策レポート生成モジュール

PRデータから政策チーム向けのマークダウンレポートを生成します。
"""

import json
import os
from collections import defaultdict
from pathlib import Path

from ..utils.github_api import load_config


class PolicyReportGenerator:
    """政策レポートを生成するクラス"""
    
    def __init__(self, config=None):
        """初期化"""
        self.config = config or load_config()
        
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
        
    def group_prs_by_policy_area(self, pr_data):
        """PRを政策分野ごとにグループ化する"""
        policy_areas = defaultdict(list)
        
        area_keywords = {
            "教育": ["教育", "学校", "学習", "教師", "先生", "生徒", "学生"],
            "子育て": ["子育て", "保育", "児童", "子ども", "子供"],
            "行政改革": ["行政", "改革", "デジタル化", "効率化", "手続き"],
            "産業": ["産業", "経済", "企業", "ビジネス", "起業"],
            "科学技術": ["科学", "技術", "研究", "開発", "イノベーション"],
            "医療": ["医療", "健康", "病院", "診療", "介護"],
            "エネルギー": ["エネルギー", "電力", "再生可能", "環境"],
            "経済財政": ["経済", "財政", "税金", "予算", "財源"],
            "デジタル民主主義": ["デジタル", "民主主義", "参加", "透明性"]
        }
        
        for pr in pr_data:
            if not pr:  # Noneの場合はスキップ
                continue
                
            basic_info = pr.get("basic_info", {})
            title = basic_info.get("title", "")
            
            files = pr.get("files", [])
            filenames = [file.get("filename", "") for file in files]
            
            assigned_areas = set()
            
            for filename in filenames:
                for area, keywords in area_keywords.items():
                    if any(keyword in filename for keyword in keywords):
                        assigned_areas.add(area)
            
            for area, keywords in area_keywords.items():
                if any(keyword in title for keyword in keywords):
                    assigned_areas.add(area)
                    
            labels = pr.get("labels", [])
            for label in labels:
                label_name = label.get("name", "")
                for area, keywords in area_keywords.items():
                    if any(keyword in label_name for keyword in keywords):
                        assigned_areas.add(area)
            
            if not assigned_areas:
                policy_areas["その他"].append(pr)
            else:
                for area in assigned_areas:
                    policy_areas[area].append(pr)
                    
        return policy_areas
        
    def analyze_contributor_expertise(self, pr_data):
        """貢献者の専門分野を分析する"""
        contributor_expertise = defaultdict(lambda: defaultdict(int))
        
        for pr in pr_data:
            if not pr:  # Noneの場合はスキップ
                continue
                
            basic_info = pr.get("basic_info", {})
            user = basic_info.get("user", {})
            username = user.get("login", "unknown")
            
            files = pr.get("files", [])
            filenames = [file.get("filename", "") for file in files]
            
            area_keywords = {
                "教育": ["教育", "学校", "学習", "教師", "先生", "生徒", "学生"],
                "子育て": ["子育て", "保育", "児童", "子ども", "子供"],
                "行政改革": ["行政", "改革", "デジタル化", "効率化", "手続き"],
                "産業": ["産業", "経済", "企業", "ビジネス", "起業"],
                "科学技術": ["科学", "技術", "研究", "開発", "イノベーション"],
                "医療": ["医療", "健康", "病院", "診療", "介護"],
                "エネルギー": ["エネルギー", "電力", "再生可能", "環境"],
                "経済財政": ["経済", "財政", "税金", "予算", "財源"],
                "デジタル民主主義": ["デジタル", "民主主義", "参加", "透明性"]
            }
            
            assigned_areas = set()
            
            for filename in filenames:
                for area, keywords in area_keywords.items():
                    if any(keyword in filename for keyword in keywords):
                        assigned_areas.add(area)
            
            title = basic_info.get("title", "")
            for area, keywords in area_keywords.items():
                if any(keyword in title for keyword in keywords):
                    assigned_areas.add(area)
                    
            labels = pr.get("labels", [])
            for label in labels:
                label_name = label.get("name", "")
                for area, keywords in area_keywords.items():
                    if any(keyword in label_name for keyword in keywords):
                        assigned_areas.add(area)
            
            if not assigned_areas:
                contributor_expertise[username]["その他"] += 1
            else:
                for area in assigned_areas:
                    contributor_expertise[username][area] += 1
                    
        return contributor_expertise
        
    def generate_policy_area_report(self, policy_areas, output_file=None):
        """政策分野別レポートを生成する"""
        if not policy_areas:
            return "# 政策分野別レポート\n\n政策分野別のPRはありません。\n"
            
        markdown = "# 政策分野別レポート\n\n"
        
        sorted_areas = sorted(policy_areas.keys())
        
        markdown += "## 目次\n\n"
        for area in sorted_areas:
            area_link = area.lower().replace(" ", "-")
            markdown += f"- [{area}](#{area_link}) ({len(policy_areas[area])}件)\n"
            
        markdown += "\n---\n\n"
        
        for area in sorted_areas:
            prs = policy_areas[area]
            markdown += f"## {area}\n\n"
            
            open_prs = [pr for pr in prs if pr.get("basic_info", {}).get("state") == "open"]
            closed_prs = [pr for pr in prs if pr.get("basic_info", {}).get("state") == "closed"]
            
            if open_prs:
                markdown += f"### オープン ({len(open_prs)}件)\n\n"
                for pr in open_prs:
                    basic_info = pr.get("basic_info", {})
                    pr_number = basic_info.get("number", "?")
                    pr_title = basic_info.get("title", "タイトルなし")
                    pr_url = basic_info.get("html_url", "#")
                    
                    markdown += f"- [PR #{pr_number}]({pr_url}) {pr_title}\n"
                markdown += "\n"
                
            if closed_prs:
                markdown += f"### クローズド ({len(closed_prs)}件)\n\n"
                for pr in closed_prs:
                    basic_info = pr.get("basic_info", {})
                    pr_number = basic_info.get("number", "?")
                    pr_title = basic_info.get("title", "タイトルなし")
                    pr_url = basic_info.get("html_url", "#")
                    
                    markdown += f"- [PR #{pr_number}]({pr_url}) {pr_title}\n"
                markdown += "\n"
                
        if output_file:
            output_dir = os.path.dirname(output_file)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
                
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(markdown)
            print(f"政策分野別レポートを {output_file} に保存しました")
            
        return markdown
        
    def generate_expertise_report(self, contributor_expertise, output_file=None):
        """貢献者の専門分野レポートを生成する"""
        if not contributor_expertise:
            return "# 貢献者専門分野レポート\n\n貢献者の専門分野データがありません。\n"
            
        markdown = "# 貢献者専門分野レポート\n\n"
        
        contributor_totals = {}
        for username, areas in contributor_expertise.items():
            contributor_totals[username] = sum(areas.values())
            
        sorted_contributors = sorted(contributor_totals.keys(), key=lambda x: contributor_totals[x], reverse=True)
        
        for username in sorted_contributors:
            areas = contributor_expertise[username]
            total = contributor_totals[username]
            
            markdown += f"## {username} (合計: {total}件)\n\n"
            
            sorted_areas = sorted(areas.keys(), key=lambda x: areas[x], reverse=True)
            
            markdown += "| 政策分野 | PR数 | 割合 |\n"
            markdown += "|---------|------|------|\n"
            
            for area in sorted_areas:
                count = areas[area]
                percentage = (count / total) * 100
                markdown += f"| {area} | {count} | {percentage:.1f}% |\n"
                
            markdown += "\n"
            
        if output_file:
            output_dir = os.path.dirname(output_file)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
                
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(markdown)
            print(f"貢献者専門分野レポートを {output_file} に保存しました")
            
        return markdown
        
    def generate_reports(self, input_data, output_dir):
        """すべてのレポートを生成する"""
        if isinstance(input_data, (str, Path)) and Path(input_data).is_dir():
            pr_data = self.load_pr_data_from_directory(input_data)
        else:
            pr_data = input_data
            
        if not pr_data:
            print("PRデータがありません")
            return False
            
        os.makedirs(output_dir, exist_ok=True)
        
        policy_areas = self.group_prs_by_policy_area(pr_data)
        policy_area_file = os.path.join(output_dir, "policy_areas.md")
        self.generate_policy_area_report(policy_areas, policy_area_file)
        
        contributor_expertise = self.analyze_contributor_expertise(pr_data)
        expertise_file = os.path.join(output_dir, "contributor_expertise.md")
        self.generate_expertise_report(contributor_expertise, expertise_file)
        
        return True
