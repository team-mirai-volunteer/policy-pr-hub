# ============================================================
# ダッシュボード対応版 - 詳細フラグ付きExcel出力
# ============================================================
import re
import time
import torch
import pandas as pd
from tqdm import tqdm
from transformers import (
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
    AutoModelForCausalLM,
    pipeline,
)
from huggingface_hub import login as hf_login
from google.colab import userdata
import gc

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print("🖥️ device =", DEVICE, torch.cuda.get_device_name(0) if DEVICE == "cuda" else "")

hf_token = userdata.get("HUGGINGFACE_TOKEN")
if hf_token:
    hf_login(token=hf_token)

# ============================================================
# 入出力設定
# ============================================================
IN_FILE = "/content/drive/My Drive/Colab Notebooks/pr_labels_with_body.xlsx"
OUT_FILE = "/content/drive/My Drive/pr_labels_flagged.xlsx"  # ダッシュボードが読む名前に合わせる
MAX_ROWS = None  # テスト用、本番は None

df = pd.read_excel(IN_FILE)
if MAX_ROWS:
    df = df.head(MAX_ROWS)
valid = ~df["body"].isin(["error", "本文なし"]) & df["body"].notna()

print(f"📊 処理対象: {valid.sum()}件 / 全{len(df)}件")

# ============================================================
# 要約フェーズ（効率化版）
# ============================================================
print("▼ 要約フェーズ")
SUM_MODEL = "sonoisa/t5-base-japanese"
tok_sum = AutoTokenizer.from_pretrained(SUM_MODEL)
model_sum = AutoModelForSeq2SeqLM.from_pretrained(
    SUM_MODEL, torch_dtype=torch.float16, device_map="auto"
)


def smart_summarize(text):
    """スマート要約（重要部分を優先）"""
    if len(text) <= 200:
        return text

    # 重要キーワード周辺を抽出
    important_keywords = [
        "問題",
        "課題",
        "提案",
        "意見",
        "主張",
        "批判",
        "支持",
        "反対",
    ]
    sentences = re.split(r"[。！？\n]", text)

    # 先頭部分
    summary_parts = [text[:300]]

    # キーワード含有文を追加
    for sentence in sentences:
        if any(kw in sentence for kw in important_keywords):
            summary_parts.append(sentence)
        if len("。".join(summary_parts)) > 800:
            break

    combined = "。".join(summary_parts)[:1000]

    inputs = tok_sum(
        "summarize: " + combined, return_tensors="pt", truncation=True, max_length=512
    ).to(DEVICE)

    with torch.no_grad():
        ids = model_sum.generate(**inputs, max_length=80, min_length=30)

    summary = tok_sum.decode(ids[0], skip_special_tokens=True).replace("\n", " ")

    del inputs, ids
    torch.cuda.empty_cache()
    return summary


# 要約実行
df["summary"] = [
    smart_summarize(b) if ok else ""
    for ok, b in tqdm(zip(valid, df["body"]), total=len(df))
]

print("要約完了、メモリクリーンアップ")
del model_sum, tok_sum
torch.cuda.empty_cache()
gc.collect()

# ============================================================
# スコア取得フェーズ（改良版）
# ============================================================
print("▼ スコア取得フェーズ")
SAR_MODEL = "sbintuitions/sarashina2.2-3b-instruct-v0.1"
tok_gen = AutoTokenizer.from_pretrained(SAR_MODEL)
model_gen = AutoModelForCausalLM.from_pretrained(
    SAR_MODEL, torch_dtype=torch.float16, device_map="auto"
)
generator = pipeline("text-generation", model=model_gen, tokenizer=tok_gen)

# 改良プロンプト
PROMPT = """以下の文章について、2つの観点で数値評価してください。

文章: 「{text}」

評価項目:
1. 立場/スタンス（-5から+5で評価）
   -5: 強く反対・否定的
   -3: 反対・否定的
   -1: やや反対・否定的
    0: 中立・どちらでもない
   +1: やや賛成・肯定的
   +3: 賛成・肯定的
   +5: 強く賛成・肯定的

2. 主張の強さ（-5から+5で評価）
   -5: 非常に弱い・曖昧
   -3: 弱い
   -1: やや弱い
    0: 普通
   +1: やや強い
   +3: 強い
   +5: 非常に強い・断定的

回答（数値のみ）:
立場:
強さ: """


def get_enhanced_scores(txt: str):
    """強化版スコア取得"""
    if not txt or len(txt.strip()) < 5:
        return 0, 0

    # テキスト前処理
    if len(txt) > 800:
        sentences = re.split(r"[。！？]", txt)
        important = [
            s
            for s in sentences
            if any(
                word in s
                for word in [
                    "思う",
                    "考える",
                    "主張",
                    "意見",
                    "批判",
                    "支持",
                    "反対",
                    "問題",
                ]
            )
        ]
        txt = "。".join(important[:4]) if important else txt[:800]

    prompt = PROMPT.format(text=txt)

    try:
        with torch.no_grad():
            outputs = generator(
                prompt,
                max_new_tokens=20,
                do_sample=False,
                temperature=0.0,
                pad_token_id=tok_gen.eos_token_id,
            )

        generated = outputs[0]["generated_text"]
        gen_part = generated[len(prompt) :].strip()

        # 数値抽出の改良
        stance_score, assert_score = 0, 0

        # 行ごとに処理
        lines = [line.strip() for line in gen_part.split("\n") if line.strip()]

        for i, line in enumerate(lines[:4]):
            numbers = re.findall(r"-?\d+", line)
            if not numbers:
                continue

            num = int(numbers[0])

            # より柔軟な判定
            if "立場" in line or "スタンス" in line or i == 0:
                stance_score = num
            elif "強" in line or "主張" in line or i == 1:
                assert_score = num

        # フォールバック: 最初の2つの数値
        if stance_score == 0 and assert_score == 0:
            all_nums = re.findall(r"-?\d+", gen_part)
            if len(all_nums) >= 2:
                stance_score, assert_score = int(all_nums[0]), int(all_nums[1])
            elif len(all_nums) == 1:
                stance_score = int(all_nums[0])

        # 範囲制限
        stance_score = max(-5, min(5, stance_score))
        assert_score = max(-5, min(5, assert_score))

        return stance_score, assert_score

    except Exception as e:
        print(f"⚠️ エラー: {e}")
        return 0, 0


# バッチ処理でスコア取得
stance_vals, assert_vals = [], []

print("スコア取得中...")
for i, (ok, summ) in enumerate(tqdm(zip(valid, df["summary"]), total=len(df))):
    if not ok or not summ:
        stance_vals.append(0)
        assert_vals.append(0)
        continue

    s, a = get_enhanced_scores(summ)
    stance_vals.append(s)
    assert_vals.append(a)

    # 進捗表示
    if i % 5 == 0 and i > 0:
        print(f"  処理済み: {i + 1}/{len(df)}, 最新スコア: {s}/{a}")

    time.sleep(0.05)  # レート制限対策

df["stance_val"] = stance_vals
df["assert_val"] = assert_vals

# ============================================================
# ダッシュボード用詳細フラグ作成
# ============================================================
print("▼ 詳細フラグ作成")


def create_dashboard_flags(stance_val, assert_val, text_length=0):
    """
    ダッシュボード表示用の詳細フラグ
    """
    flags = {}

    # 基本分類フラグ
    flags["positive"] = stance_val > 0
    flags["negative"] = stance_val < 0
    flags["neutral"] = stance_val == 0

    # 強度分類フラグ
    flags["strong"] = abs(stance_val) >= 3
    flags["moderate"] = 1 <= abs(stance_val) <= 2
    flags["weak"] = abs(stance_val) == 1

    # 主張の強さフラグ
    flags["assertive"] = assert_val >= 2
    flags["mild"] = -1 <= assert_val <= 1
    flags["uncertain"] = assert_val <= -2

    # 組み合わせフラグ（ダッシュボードでの色分け・フィルタ用）
    flags["strong_positive"] = stance_val >= 3 and assert_val >= 1
    flags["strong_negative"] = stance_val <= -3 and assert_val >= 1
    flags["confident_neutral"] = stance_val == 0 and assert_val >= 2
    flags["weak_positive"] = 0 < stance_val <= 2 and assert_val <= 0
    flags["weak_negative"] = -2 <= stance_val < 0 and assert_val <= 0

    # 実用的分類フラグ
    flags["attention_high"] = abs(stance_val) >= 4 or assert_val >= 4  # 要注意
    flags["attention_medium"] = abs(stance_val) == 3 or assert_val == 3  # 中注意
    flags["review_needed"] = abs(stance_val) >= 2 and assert_val <= -1  # レビュー必要
    flags["low_priority"] = abs(stance_val) <= 1 and abs(assert_val) <= 1  # 低優先度

    # 極端ケースフラグ
    flags["extreme"] = abs(stance_val) == 5 or abs(assert_val) == 5
    flags["polarized"] = abs(stance_val) >= 4 and abs(assert_val) >= 3

    # テキスト長考慮フラグ
    if text_length > 0:
        flags["long_strong"] = text_length > 1000 and abs(stance_val) >= 3
        flags["short_strong"] = text_length <= 300 and abs(stance_val) >= 3

    return flags


# 各行にフラグを適用
print("フラグ適用中...")
for i, row in tqdm(df.iterrows(), total=len(df)):
    text_len = len(str(row.get("body", "")))
    flags = create_dashboard_flags(row["stance_val"], row["assert_val"], text_len)

    for flag_name, flag_value in flags.items():
        df.loc[i, f"flag_{flag_name}"] = flag_value


# ============================================================
# ダッシュボード用カテゴリ列追加
# ============================================================
def get_category(stance_val, assert_val):
    """ダッシュボード表示用カテゴリ"""
    if abs(stance_val) >= 4:
        return "極端" + ("肯定" if stance_val > 0 else "否定")
    elif abs(stance_val) >= 3:
        return "強い" + ("肯定" if stance_val > 0 else "否定")
    elif abs(stance_val) >= 1:
        return "やや" + ("肯定" if stance_val > 0 else "否定")
    else:
        return "中立"


df["category"] = [
    get_category(s, a) for s, a in zip(df["stance_val"], df["assert_val"])
]


# ダッシュボード用の色分けレベル
def get_priority_level(stance_val, assert_val):
    """優先度レベル（ダッシュボードの色分け用）"""
    if abs(stance_val) >= 4 or assert_val >= 4:
        return "High"
    elif abs(stance_val) >= 3 or assert_val >= 3:
        return "Medium"
    elif abs(stance_val) >= 1 or abs(assert_val) >= 1:
        return "Low"
    else:
        return "Minimal"


df["priority"] = [
    get_priority_level(s, a) for s, a in zip(df["stance_val"], df["assert_val"])
]

# ============================================================
# 結果統計と保存
# ============================================================
print("\n📊 詳細結果統計:")
print("=" * 50)
print("スタンス分布:")
for val in sorted(df["stance_val"].unique()):
    count = (df["stance_val"] == val).sum()
    print(f"  {val:+2d}: {count:3d}件")

print("\n主張強度分布:")
for val in sorted(df["assert_val"].unique()):
    count = (df["assert_val"] == val).sum()
    print(f"  {val:+2d}: {count:3d}件")

print("\nカテゴリ分布:")
print(df["category"].value_counts())

print("\n優先度分布:")
print(df["priority"].value_counts())

print("\n主要フラグ統計:")
flag_cols = [col for col in df.columns if col.startswith("flag_")]
for flag in [
    "flag_attention_high",
    "flag_strong_positive",
    "flag_strong_negative",
    "flag_review_needed",
    "flag_extreme",
]:
    if flag in flag_cols:
        count = df[flag].sum()
        print(f"  {flag.replace('flag_', '')}: {count}件")

# Excel保存
df.to_excel(OUT_FILE, index=False)
print(f"\n✅ 完了！保存先: {OUT_FILE}")
print(f"📁 列数: {len(df.columns)}, 行数: {len(df)}")

# メモリクリーンアップ
del model_gen, tok_gen, generator
torch.cuda.empty_cache()
print("🧹 メモリクリーンアップ完了")
