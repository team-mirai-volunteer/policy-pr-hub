#!/usr/bin/env python3
"""
改善貢献PR統計の日別件数をCSV形式で出力するスクリプト
"""

import json
import csv
from pathlib import Path
from io import StringIO


def generate_daily_counts_csv():
    """日別件数をCSV形式で生成する"""

    json_file_path = Path("../pr-data/reports/contribution_stats.json")

    if not json_file_path.exists():
        print(f"統計JSONファイルが見つかりません: {json_file_path}")
        return None

    try:
        with open(json_file_path, "r", encoding="utf-8") as f:
            stats_data = json.load(f)

        daily_counts = stats_data.get("daily_counts", {})

        if not daily_counts:
            print("日別統計データが見つかりません")
            return None

        output = StringIO()
        writer = csv.writer(output)

        writer.writerow(["Date", "Count"])

        sorted_dates = sorted(daily_counts.items())
        for date, count in sorted_dates:
            writer.writerow([date, count])

        csv_content = output.getvalue()
        output.close()

        return csv_content

    except Exception as e:
        print(f"エラー: {e}")
        return None


def main():
    """メイン関数"""
    print("改善貢献PR日別件数のCSV生成...")

    csv_content = generate_daily_counts_csv()

    if csv_content:
        print("\n=== CSV形式の日別件数 ===")
        print(csv_content)

        output_file = Path("daily_counts.csv")
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(csv_content)
        print(f"CSVファイルを {output_file} に保存しました")

        return csv_content
    else:
        print("CSV生成に失敗しました")
        return None


if __name__ == "__main__":
    main()
