#!/usr/bin/env python3
"""
args.csvからargumentテキストを読み込み、OpenAI APIでembeddingを作成するスクリプト
"""

import csv
import json
import os
import pickle
import sys
import time
from pathlib import Path
from typing import List, Dict

from dotenv import load_dotenv
from openai import OpenAI

# .envファイルから環境変数を読み込む
load_dotenv()


def load_args_from_csv(csv_path: str) -> List[Dict[str, str]]:
    """CSVファイルからargumentデータを読み込む"""
    args_data = []
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            args_data.append({
                'arg_id': row['arg-id'],
                'argument': row['argument']
            })
    return args_data


def create_embeddings(args_data: List[Dict[str, str]],
                     api_key: str = None,
                     model: str = "text-embedding-3-small",
                     batch_size: int = 100,
                     output_file: str = "embeddings-1536dim.pickle") -> Dict:
    """
    argumentテキストに対してembeddingを作成

    Args:
        args_data: argumentデータのリスト
        api_key: OpenAI APIキー（環境変数OPENAI_API_KEYから取得可能）
        model: 使用するembeddingモデル
        batch_size: 一度に処理する件数
        output_file: 出力ファイル名

    Returns:
        embedding結果を含む辞書
    """
    # OpenAI クライアントの初期化
    client = OpenAI(api_key=api_key or os.getenv("OPENAI_API_KEY"))

    results = {}
    total = len(args_data)

    print(f"Total arguments to process: {total}")
    print(f"Model: {model}")
    print(f"Batch size: {batch_size}")
    print(f"Output file: {output_file}")
    print("-" * 60)

    # バッチ処理
    for i in range(0, total, batch_size):
        batch = args_data[i:i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (total + batch_size - 1) // batch_size

        print(f"Processing batch {batch_num}/{total_batches} ({len(batch)} items)...")

        try:
            # テキストのリストを作成
            texts = [item['argument'] for item in batch]

            # Embedding APIを呼び出し
            response = client.embeddings.create(
                input=texts,
                model=model
            )

            # 結果を保存
            for j, (item, embedding_obj) in enumerate(zip(batch, response.data)):
                arg_id = item['arg_id']
                results[arg_id] = {
                    'argument': item['argument'],
                    'embedding': embedding_obj.embedding,
                    'model': model
                }

            # API使用量の表示
            if hasattr(response, 'usage'):
                print(f"  Tokens used: {response.usage.total_tokens}")

            # 進捗保存（定期的に保存してエラー時のロスを減らす）
            if batch_num % 10 == 0 or i + batch_size >= total:
                print(f"  Saving progress... ({len(results)} embeddings created)")
                with open(output_file, 'wb') as f:
                    pickle.dump(results, f)

            # レート制限対策（短い待機時間）
            if i + batch_size < total:
                time.sleep(0.1)

        except Exception as e:
            print(f"Error processing batch {batch_num}: {e}")
            # エラーが発生しても、これまでの結果は保存
            print("Saving current progress before exit...")
            with open(output_file, 'wb') as f:
                pickle.dump(results, f)
            raise

    print("-" * 60)
    print(f"Completed! {len(results)} embeddings created.")
    print(f"Results saved to: {output_file}")

    # 最終保存
    with open(output_file, 'wb') as f:
        pickle.dump(results, f)

    return results


def estimate_cost(num_items: int, model: str = "text-embedding-3-small"):
    """コスト見積もり（概算）"""
    # text-embedding-3-small: $0.020 / 1M tokens
    # text-embedding-3-large: $0.130 / 1M tokens
    # 日本語テキストは平均して1文あたり約50-100トークン程度と仮定
    avg_tokens_per_item = 75
    total_tokens = num_items * avg_tokens_per_item

    if model == "text-embedding-3-small":
        cost_per_1m = 0.020
    elif model == "text-embedding-3-large":
        cost_per_1m = 0.130
    else:
        cost_per_1m = 0.020  # デフォルト

    estimated_cost = (total_tokens / 1_000_000) * cost_per_1m

    print(f"\n=== Cost Estimation ===")
    print(f"Model: {model}")
    print(f"Number of items: {num_items:,}")
    print(f"Estimated tokens: {total_tokens:,}")
    print(f"Estimated cost: ${estimated_cost:.4f}")
    print(f"======================\n")

    return estimated_cost


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Create embeddings for arguments using OpenAI API")
    parser.add_argument("--input", default="args.csv", help="Input CSV file path")
    parser.add_argument("--output", default="embeddings-1536dim.pickle", help="Output pickle file path")
    parser.add_argument("--model", default="text-embedding-3-small",
                       choices=["text-embedding-3-small", "text-embedding-3-large"],
                       help="OpenAI embedding model")
    parser.add_argument("--batch-size", type=int, default=100, help="Batch size for API calls")
    parser.add_argument("--api-key", help="OpenAI API key (or set OPENAI_API_KEY env var)")
    parser.add_argument("--limit", type=int, help="Limit number of items to process (for testing)")
    parser.add_argument("--estimate-only", action="store_true", help="Only show cost estimation")

    args = parser.parse_args()

    # CSVファイルの読み込み
    print(f"Loading arguments from {args.input}...")
    args_data = load_args_from_csv(args.input)
    print(f"Loaded {len(args_data)} arguments")

    # 件数制限（テスト用）
    if args.limit:
        args_data = args_data[:args.limit]
        print(f"Limited to {len(args_data)} arguments for testing")

    # コスト見積もり
    estimate_cost(len(args_data), args.model)

    if args.estimate_only:
        print("Estimation only mode. Exiting.")
        return 0

    # Embedding作成
    results = create_embeddings(
        args_data,
        api_key=args.api_key,
        model=args.model,
        batch_size=args.batch_size,
        output_file=args.output
    )

    print(f"\n✓ Successfully created {len(results)} embeddings")
    print(f"✓ Output saved to: {args.output}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
