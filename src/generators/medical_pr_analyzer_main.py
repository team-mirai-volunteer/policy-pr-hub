#!/usr/bin/env python3
"""
医療PR課題・解決策抽出分析器のメインスクリプト
"""

import sys
import os
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.generators.medical_pr_analyzer import MedicalPRAnalyzer


def main():
    """メイン関数"""
    import argparse

    parser = argparse.ArgumentParser(description="医療PR課題・解決策抽出分析器")
    parser.add_argument("--input-dir", required=True, help="PRデータディレクトリ")
    parser.add_argument("--output", help="出力ファイル（指定しない場合は標準出力）")
    parser.add_argument("--api-key", help="OpenRouter APIキー（環境変数OPENROUTER_API_KEYでも指定可能）")
    parser.add_argument("--max-count", type=int, help="分析するPRの最大数（テスト用）")

    args = parser.parse_args()

    if not os.path.exists(args.input_dir):
        print(f"エラー: 入力ディレクトリが存在しません: {args.input_dir}")
        sys.exit(1)

    analyzer = MedicalPRAnalyzer(api_key=args.api_key)
    
    try:
        result = analyzer.analyze_medical_prs(args.input_dir, args.output, args.max_count)
        
        if not args.output:
            import json
            print(json.dumps(result, ensure_ascii=False, indent=2))
            
        print(f"\n=== 分析完了 ===")
        print(f"分析対象PR数: {result['metadata']['total_analyzed']}")
        print(f"API使用料: ${result['metadata']['total_cost']:.6f}")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
