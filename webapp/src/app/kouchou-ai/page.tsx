import Link from "next/link";
import { Overview } from "../../components/Overview";
import { Reporter } from "../../components/Reporter";
import type { Meta, Result } from "../../types/kouchou";

const mockMeta: Meta = {
  isDefault: false,
  reporter: "デモレポーター",
  message: "これは広聴AIの実験的なUIデモページです。\n実際のデータではなく、サンプルデータを表示しています。",
  webLink: "https://dd2030.org/kouchou-ai",
  brandColor: "#2577b1",
};

const mockResult: Result = {
  arguments: Array.from({ length: 1234 }, (_, i) => ({
    arg_id: `arg_${i}`,
    argument: `サンプル意見 ${i + 1}`,
    comment_id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    p: Math.random(),
    cluster_ids: [`cluster_${Math.floor(i / 10)}`],
  })),
  clusters: [],
  comments: {},
  propertyMap: {},
  translations: {},
  overview: "これは広聴AIの実験的なUIページです。実際のレポートデータの代わりに、サンプルデータを表示しています。将来的には、実際の分析結果やインタラクティブな可視化機能を追加予定です。",
  config: {
    name: "デモ設定",
    question: "広聴AIの実験的UIはどのように改善できるでしょうか？",
    input: "sample_input",
    model: "gpt-4",
    intro: "これは実験的なUIのデモンストレーションです。",
    output_dir: "demo_output",
    is_embedded_at_local: false,
    extraction: {
      workers: 4,
      limit: 1000,
      properties: ["content"],
      categories: {},
      category_batch_size: 100,
      source_code: "",
      prompt: "",
      model: "gpt-4",
    },
    hierarchical_clustering: {
      cluster_nums: [10, 5],
      source_code: "",
    },
    embedding: {
      model: "text-embedding-ada-002",
      source_code: "",
    },
    hierarchical_initial_labelling: {
      workers: 2,
      source_code: "",
      prompt: "",
      model: "gpt-4",
    },
    hierarchical_merge_labelling: {
      workers: 2,
      source_code: "",
      prompt: "",
      model: "gpt-4",
    },
    hierarchical_overview: {
      source_code: "",
      prompt: "",
      model: "gpt-4",
    },
    hierarchical_aggregation: {
      hidden_properties: {},
      source_code: "",
    },
    hierarchical_visualization: {
      replacements: {},
      source_code: "",
    },
    plan: [
      {
        step: "extraction",
        run: true,
        reason: "意見抽出のため",
      },
      {
        step: "clustering",
        run: true,
        reason: "意見グループ化のため",
      },
    ],
    status: "ready",
  },
  comment_num: 2500,
};

export default function KouchouAIPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              広聴AI - 実験的UI
            </h1>
            <p className="text-gray-600">
              kouchou-aiのクライアントビューを移植した実験的なユーザーインターフェースです。
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <Overview result={mockResult} />
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="border-t border-gray-200 my-12"></div>
            <div className="max-w-3xl mx-auto mb-6">
              <Reporter meta={mockMeta} />
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>
              このページは実験的な機能です。実際のデータ分析機能は今後追加予定です。
            </p>
            <p className="mt-2">
              <Link href="/" className="text-blue-600 hover:underline">
                ← ホームページに戻る
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
