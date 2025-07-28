import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          政策PR Hub
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          チームみらいの政策改善提案プルリクエストを閲覧できます
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold mb-4">使い方</h2>
        <div className="space-y-4">
          <p className="text-gray-700">
            URLに <code className="bg-gray-100 px-2 py-1 rounded">/pr/[番号]</code> を追加してPRの詳細を表示できます。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Link href="/pr/108" className="block p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="font-medium text-blue-900">PR #108</div>
              <div className="text-sm text-blue-700">サンプルPRを見る</div>
            </Link>
            <Link href="/pr/1" className="block p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="font-medium text-green-900">PR #1</div>
              <div className="text-sm text-green-700">最初のPRを見る</div>
            </Link>
            <Link href="/pr/1000" className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <div className="font-medium text-purple-900">PR #1000</div>
              <div className="text-sm text-purple-700">記念すべきPRを見る</div>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          データについて
        </h3>
        <p className="text-blue-800">
          このアプリケーションは<a href="https://github.com/team-mirai/policy" className="underline" target="_blank" rel="noopener noreferrer">team-mirai/policy</a>リポジトリから収集された政策改善提案PRデータを表示しています。
        </p>
      </div>
    </div>
  )
}
