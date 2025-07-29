#!/usr/bin/env python3
"""
全カテゴリのPR分析を実行してCSVファイルを生成するスクリプト
"""

import subprocess
import sys
from pathlib import Path

# カテゴリ定義（実際のラベルに基づく）
CATEGORIES = [
    "教育",
    "経済財政",
    "科学技術",
    "デジタル民主主義",
    "医療",
    "子育て",
    "ビジョン",
    "産業政策",
    "行政改革",
    "その他政策",
    "エネルギー",
    "システム",
    "福祉"
]

def run_analysis(input_dir, category, output_dir):
    """指定されたカテゴリの分析を実行"""
    output_file = Path(output_dir) / f"{category}_prs.csv"
    
    cmd = [
        sys.executable, "-m", "src.generators.category_pr_analyzer",
        "--input-dir", input_dir,
        "--category", category,
        "--keywords", category,  # ラベルベースなのでキーワードはカテゴリ名と同じ
        "--output", str(output_file)
    ]
    
    print(f"\n{'='*50}")
    print(f"カテゴリ: {category}")
    print(f"出力ファイル: {output_file}")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode == 0:
            print(result.stdout)
            print(f"✅ {category}の分析が完了しました")
        else:
            print(f"❌ {category}の分析でエラーが発生しました")
            print(f"エラー出力: {result.stderr}")
            
    except Exception as e:
        print(f"❌ {category}の分析実行中にエラーが発生しました: {e}")

def main():
    """メイン関数"""
    import argparse
    
    parser = argparse.ArgumentParser(description="全カテゴリのPR分析を実行")
    parser.add_argument("--input-dir", default="../pr-data/prs", help="PRデータディレクトリ")
    parser.add_argument("--output-dir", default="category_csv_output", help="出力ディレクトリ")
    parser.add_argument("--categories", help="処理するカテゴリ（カンマ区切り、指定しない場合は全カテゴリ）")
    
    args = parser.parse_args()
    
    # 出力ディレクトリを作成
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)
    
    # 処理するカテゴリを決定
    if args.categories:
        target_categories = [cat.strip() for cat in args.categories.split(",")]
        target_categories = [cat for cat in target_categories if cat in CATEGORIES]
    else:
        target_categories = CATEGORIES
    
    print(f"=== 全カテゴリPR分析開始 ===")
    print(f"入力ディレクトリ: {args.input_dir}")
    print(f"出力ディレクトリ: {args.output_dir}")
    print(f"処理対象カテゴリ数: {len(target_categories)}")
    
    # 各カテゴリの分析を実行
    for category in target_categories:
        run_analysis(args.input_dir, category, args.output_dir)
    
    print(f"\n{'='*50}")
    print("🎉 全カテゴリの分析が完了しました")
    print(f"出力ディレクトリ: {args.output_dir}")
    print(f"生成されたCSVファイル:")
    
    # 生成されたファイルの一覧を表示
    csv_files = list(output_dir.glob("*.csv"))
    for csv_file in sorted(csv_files):
        print(f"  - {csv_file.name}")
    
    print(f"合計: {len(csv_files)}ファイル")

if __name__ == "__main__":
    main()