#!/usr/bin/env python3
"""
データ整合性確認スクリプト

GitHubとローカルデータの包括的な整合性確認を行います。
既存のDataValidatorクラスを活用して、統計比較とレポート生成を実行します。

使用目的:
- 定期的なデータ品質監査
- 大規模データ収集後の検証
- システム異常時の診断

実行方法:
    python scripts/data_integrity_checker.py [--detailed] [--output-dir OUTPUT_DIR]
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.validators.data_validator import DataValidator
from src.utils.github_api import load_config


def check_data_integrity(detailed=False, output_dir=None):
    """データ整合性の確認を実行する"""
    config = load_config()
    validator = DataValidator(config)

    print("=== データ整合性確認開始 ===\n")

    print("GitHub APIからデータを取得中...")
    github_stats = validator.get_github_pr_stats()

    print("ローカルデータを分析中...")
    local_stats = validator.get_local_pr_stats(config["data"]["base_dir"])

    print("データ比較を実行中...")
    comparison = validator.compare_stats(github_stats, local_stats)

    print("\n=== 整合性確認結果 ===")
    print(f"GitHub総PR数: {comparison['summary']['github_total_prs']:,}件")
    print(f"ローカル総PR数: {comparison['summary']['local_total_prs']:,}件")
    print(f"カバレッジ: {comparison['summary']['coverage_percentage']:.1f}%")
    print(f"不足PR数: {comparison['summary']['difference']:,}件")

    if detailed:
        print("\n=== 詳細統計 ===")
        print(
            f"Open PR - GitHub: {github_stats['state_counts']['open']}, ローカル: {local_stats['state_counts']['open']}"
        )
        print(
            f"Closed PR - GitHub: {github_stats['state_counts']['closed']}, ローカル: {local_stats['state_counts']['closed']}"
        )
        print(
            f"Merged PR - GitHub: {github_stats['state_counts']['merged']}, ローカル: {local_stats['state_counts']['merged']}"
        )

    if output_dir:
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        report_file = output_path / "data_integrity_report.md"
        report = validator.generate_validation_report(comparison, str(report_file))

        with open(report_file, "w", encoding="utf-8") as f:
            f.write(report)

        print(f"\n📄 詳細レポートを生成: {report_file}")

    if comparison["summary"]["coverage_percentage"] < 95.0:
        print("\n⚠️  カバレッジが95%未満です。データ収集の実行を推奨します。")
    elif comparison["summary"]["coverage_percentage"] < 99.0:
        print("\n💡 カバレッジは良好ですが、さらなる改善が可能です。")
    else:
        print("\n✅ データ整合性は良好です。")


def main():
    """メイン実行関数"""
    parser = argparse.ArgumentParser(description="データ整合性確認")
    parser.add_argument("--detailed", action="store_true", help="詳細統計を表示")
    parser.add_argument("--output-dir", help="レポート出力ディレクトリ")
    args = parser.parse_args()

    check_data_integrity(detailed=args.detailed, output_dir=args.output_dir)


if __name__ == "__main__":
    main()
