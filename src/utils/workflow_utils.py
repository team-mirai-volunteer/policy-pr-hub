#!/usr/bin/env python3
"""
ワークフロー実行のためのユーティリティ関数
"""

import time
import logging
from functools import wraps
from datetime import datetime

def setup_logging(log_level="INFO"):
    """ログ設定を初期化する"""
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    return logging.getLogger(__name__)

def retry_on_failure(max_retries=3, delay=1, backoff=2):
    """失敗時の再試行デコレータ"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            current_delay = delay
            
            while retries < max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries >= max_retries:
                        raise e
                    
                    print(f"エラーが発生しました（{retries}/{max_retries}回目）: {e}")
                    print(f"{current_delay}秒後に再試行します...")
                    time.sleep(current_delay)
                    current_delay *= backoff
            
            return None
        return wrapper
    return decorator

def log_execution_time(func):
    """実行時間をログ出力するデコレータ"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = datetime.now()
        print(f"開始: {func.__name__} - {start_time}")
        
        try:
            result = func(*args, **kwargs)
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            print(f"完了: {func.__name__} - 実行時間: {duration:.2f}秒")
            return result
        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            print(f"エラー: {func.__name__} - 実行時間: {duration:.2f}秒 - {e}")
            raise
    
    return wrapper
