#!/usr/bin/env python3
"""
改善貢献PR統計分析スクリプト

pr-dataに保存されているPRデータを分析して、改善貢献PR（merged または thankyou label付きclosed）の
統計情報を取得し、結果を報告します。
"""

import json
import os
from pathlib import Path
from datetime import datetime
from collections import defaultdict

def analyze_contribution_prs():
    """改善貢献PRの統計を分析する"""
    
    pr_data_dir = Path('../pr-data/prs')
    print(f'PRデータディレクトリ: {pr_data_dir}')
    print(f'ディレクトリ存在確認: {pr_data_dir.exists()}')
    
    if not pr_data_dir.exists():
        print("エラー: PRデータディレクトリが存在しません")
        return
    
    total_prs = 0
    contribution_prs = 0
    merged_prs = 0
    thankyou_closed_prs = 0
    daily_counts = defaultdict(int)
    
    json_files = list(pr_data_dir.glob('*.json'))
    print(f'見つかったPRファイル数: {len(json_files)}')
    
    for json_file in json_files:
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                pr_data = json.load(f)
            
            total_prs += 1
            basic_info = pr_data.get('basic_info', {})
            
            merged_at = basic_info.get('merged_at')
            is_merged = merged_at is not None
            
            state = basic_info.get('state')
            closed_at = basic_info.get('closed_at')
            labels = pr_data.get('labels', [])
            has_thankyou = any(label.get('name') == 'thankyou' for label in labels)
            is_thankyou_closed = (state == 'closed' and closed_at is not None and has_thankyou)
            
            is_contribution = is_merged or is_thankyou_closed
            
            if is_contribution:
                contribution_prs += 1
                if is_merged:
                    merged_prs += 1
                    date_str = merged_at[:10]
                else:
                    thankyou_closed_prs += 1
                    date_str = closed_at[:10]
                
                daily_counts[date_str] += 1
                
        except Exception as e:
            print(f'エラー {json_file}: {e}')
    
    print(f'\n=== 改善貢献PR統計結果 ===')
    print(f'総PR数: {total_prs}')
    print(f'改善貢献PR数: {contribution_prs}')
    print(f'  - マージされたPR: {merged_prs}')
    print(f'  - thankyouラベル付きクローズPR: {thankyou_closed_prs}')
    print(f'\n日別統計（上位10日）:')
    sorted_daily = sorted(daily_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    for date, count in sorted_daily:
        print(f'  {date}: {count}件')
    
    return {
        'total_prs': total_prs,
        'contribution_prs': contribution_prs,
        'merged_prs': merged_prs,
        'thankyou_closed_prs': thankyou_closed_prs,
        'daily_counts': dict(daily_counts)
    }

if __name__ == '__main__':
    analyze_contribution_prs()
