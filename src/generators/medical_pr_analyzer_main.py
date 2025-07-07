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
            
        print(f"\n=== 実行サマリー ===")
        metadata = result['metadata']
        print(f"分析対象PR数: {metadata['total_analyzed']}")
        print(f"総実行時間: {metadata['total_duration_seconds']:.2f}秒 ({metadata['total_duration_minutes']:.2f}分)")
        print(f"平均処理時間: {metadata['average_time_per_pr']:.2f}秒/PR")
        print(f"API呼び出し回数: {metadata['api_call_count']}")
        print(f"総API使用料: ${metadata['total_cost']:.6f}")
        if metadata['api_call_count'] > 0:
            print(f"平均API使用料: ${metadata['average_cost_per_api_call']:.6f}/回")
        print(f"総トークン数: {metadata['total_input_tokens']:,} (入力) + {metadata['total_output_tokens']:,} (出力)")
        
    except Exception as e:
        print(f"エラーが発生しました: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
