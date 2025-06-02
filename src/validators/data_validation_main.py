#!/usr/bin/env python3
"""
データ検証スクリプト

GitHub APIとローカルデータの整合性を検証するためのコマンドラインスクリプトです。
"""

import argparse
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.validators.data_validator import DataValidator
from src.utils.github_api import load_config


def parse_args():
    """コマンドライン引数をパースする"""
    parser = argparse.ArgumentParser(description="GitHub APIとローカルデータの整合性を検証するスクリプト")
    
    parser.add_argument(
        "--data-dir",
        help="検証対象のローカルデータディレクトリ（デフォルト: config設定値）"
    )
    
    parser.add_argument(
        "--output-file",
        help="検証レポートの出力ファイルパス（デフォルト: data/reports/validation_report_YYYYMMDD_HHMMSS.md）"
    )
    
    parser.add_argument(
        "--console-only",
        action="store_true",
        help="コンソール出力のみ（ファイル保存しない）"
    )
    
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="詳細な出力を表示"
    )
    
    return parser.parse_args()


def main():
    """メイン関数"""
    args = parse_args()
    config = load_config()
    
    output_file = None
    if not args.console_only:
        if args.output_file:
            output_file = args.output_file
        else:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            reports_dir = config["data"]["reports_dir"]
            output_file = f"{reports_dir}/validation_report_{timestamp}.md"
    
    try:
        validator = DataValidator(config)
        result = validator.validate_data(
            data_dir=args.data_dir,
            output_file=output_file
        )
        
        print("\n" + "="*60)
        print("検証結果サマリー")
        print("="*60)
        
        summary = result["comparison"]["summary"]
        print(f"GitHub総PR数: {summary['github_total_prs']:,}件")
        print(f"ローカル総PR数: {summary['local_total_prs']:,}件")
        print(f"差異: {summary['difference']:,}件")
        print(f"カバレッジ: {summary['coverage_percentage']:.1f}%")
        
        if result["comparison"]["recommendations"]:
            print("\n推奨アクション:")
            for i, rec in enumerate(result["comparison"]["recommendations"], 1):
                print(f"  {i}. {rec}")
        
        if args.verbose:
            print("\n" + "-"*40)
            print("詳細統計")
            print("-"*40)
            
            print("\n状態別比較:")
            for state, counts in result["comparison"]["differences"]["states"].items():
                print(f"  {state}: GitHub={counts['github']:,}, ローカル={counts['local']:,}, 差異={counts['difference']:+,}")
            
            if result["comparison"]["differences"]["labels"]:
                print("\nラベル別比較（上位5件）:")
                for i, (label, counts) in enumerate(list(result["comparison"]["differences"]["labels"].items())[:5], 1):
                    print(f"  {i}. {label}: GitHub={counts['github']:,}, ローカル={counts['local']:,}, 差異={counts['difference']:+,}")
        
        if output_file:
            print(f"\n詳細レポートが {output_file} に保存されました")
        
        if summary["difference"] == 0:
            print("\n✅ データは完全に同期されています")
            return 0
        elif summary["coverage_percentage"] >= 95:
            print("\n⚠️  軽微な差異がありますが、概ね同期されています")
            return 0
        else:
            print("\n❌ 重要な差異があります。データ収集の実行を推奨します")
            return 1
            
    except Exception as e:
        print(f"エラー: 検証処理中に問題が発生しました: {e}")
        if args.verbose:
            import traceback
            traceback.print_exc()
        return 2


if __name__ == "__main__":
    sys.exit(main())
