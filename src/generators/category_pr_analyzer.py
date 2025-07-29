#!/usr/bin/env python3
"""
カテゴリPR分析器

指定されたカテゴリのPRからテキストとURLを抽出し、CSV形式で出力します。
"""

import json
import os
import time
import csv
from pathlib import Path
from datetime import datetime


class CategoryPRAnalyzer:
    """カテゴリPR分析器"""

    def __init__(self):
        """初期化"""
        self.start_time = None
        self.end_time = None

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

    def filter_category_prs(self, pr_data, category_name, keywords):
        """指定されたカテゴリのPRをフィルタリング"""
        category_prs = []
        
        for pr in pr_data:
            if not pr:
                continue
                
            labels = pr.get("labels", [])
            label_names = {label.get("name", "") for label in labels}
            
            # ラベルにカテゴリ名が含まれているかチェック
            if category_name in label_names:
                category_prs.append(pr)
                continue
            
            # タイトルと本文からキーワード検索
            basic_info = pr.get("basic_info", {})
            title = basic_info.get("title") or ""
            body = basic_info.get("body") or ""
            
            content = f"{title.lower()} {body.lower()}"
            if any(keyword in content for keyword in keywords):
                category_prs.append(pr)
        
        print(f"{category_name}関連PR: {len(category_prs)}件を特定しました")
        return category_prs

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

        # diffの内容を追加
        for file in files:
            if file.get("patch"):
                texts.append(f"diff - {file.get('filename', '不明')}:\n{file['patch']}")

        commits = pr.get("commits", [])
        commit_msgs = []
        for commit in commits:
            if commit.get("commit", {}).get("message"):
                commit_msgs.append(commit["commit"]["message"])
        if commit_msgs:
            texts.append("コミットメッセージ:\n" + "\n".join(commit_msgs))

        return "\n\n".join(texts)

    def analyze_category_prs(self, input_dir, category_name, keywords, output_file=None, max_count=None):
        """指定されたカテゴリのPRを分析してCSVで出力"""
        self.start_time = time.time()
        start_datetime = datetime.now()
        
        print(f"=== {category_name}PR分析開始 ===")
        print(f"開始時刻: {start_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        
        pr_data = self.load_pr_data_from_directory(input_dir)
        category_prs = self.filter_category_prs(pr_data, category_name, keywords)
        
        if max_count:
            category_prs = category_prs[:max_count]
            print(f"分析対象を{max_count}件に制限しました")
        
        results = []
        
        if not category_prs:
            print(f"{category_name}関連のPRが見つかりませんでした")
            return results
            
        print(f"{category_name}PR {len(category_prs)}件のテキスト抽出中...")
        
        for i, pr in enumerate(category_prs):
            if i % 10 == 0:
                elapsed = time.time() - self.start_time
                avg_time_per_pr = elapsed / max(i, 1)
                remaining_prs = len(category_prs) - i
                estimated_remaining = avg_time_per_pr * remaining_prs
                print(f"進捗: {i}/{len(category_prs)} ({i/len(category_prs)*100:.1f}%) - "
                      f"経過時間: {elapsed:.1f}秒 - 推定残り時間: {estimated_remaining:.1f}秒")
            
            basic_info = pr.get("basic_info", {})
            pr_url = basic_info.get("html_url")
            
            # PRの本文とdiffをまとめたテキストを抽出
            text_content = self._extract_pr_content(pr)
            
            result = {
                "text": text_content,
                "url": pr_url
            }
            
            results.append(result)
        
        self.end_time = time.time()
        total_duration = self.end_time - self.start_time
        end_datetime = datetime.now()
        
        print(f"\n=== 分析完了 ===")
        print(f"終了時刻: {end_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"総実行時間: {total_duration:.2f}秒 ({total_duration/60:.2f}分)")
        print(f"分析PR数: {len(results)}件")
        if results:
            print(f"平均処理時間: {total_duration/len(results):.2f}秒/PR")
        
        # CSVファイルに出力
        if output_file:
            output_dir = os.path.dirname(output_file)
            if output_dir:
                os.makedirs(output_dir, exist_ok=True)
            
            with open(output_file, "w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=["text", "url"])
                writer.writeheader()
                writer.writerows(results)
            print(f"CSV結果を {output_file} に保存しました")
        
        return results


def main():
    """メイン関数"""
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="カテゴリPR分析器")
    parser.add_argument("--input-dir", required=True, help="PRデータディレクトリ")
    parser.add_argument("--category", required=True, help="カテゴリ名")
    parser.add_argument("--keywords", required=True, help="キーワード（カンマ区切り）")
    parser.add_argument("--output", help="出力ファイル")
    parser.add_argument("--max-count", type=int, help="分析するPRの最大数")

    args = parser.parse_args()

    if not os.path.exists(args.input_dir):
        print(f"エラー: 入力ディレクトリが存在しません: {args.input_dir}")
        sys.exit(1)

    keywords = [kw.strip() for kw in args.keywords.split(",")]
    analyzer = CategoryPRAnalyzer()
    
    try:
        result = analyzer.analyze_category_prs(
            args.input_dir, args.category, keywords, args.output, args.max_count
        )
        
        print("\n=== 実行サマリー ===")
        print(f"分析対象PR数: {len(result)}")
        print("CSV出力完了")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()