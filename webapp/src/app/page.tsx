import Link from 'next/link'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">
          改善提案
        </h1>
        <p className="text-lg text-secondary mb-8">
          高度な分析結果をシェアし、より良い政策のためのプロトタイプを提供します
        </p>
      </div>

      <div className="card rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-semibold text-primary mb-4">使い方</h2>
        <div className="space-y-4">
          <p className="text-secondary">
            URLに <code className="code-bg px-2 py-1 rounded">/pr/[番号]</code> を追加してPRの詳細を表示できます。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <Link href="/scatter" className="block p-4 orange-card rounded-lg hover:opacity-80 transition-opacity">
              <div className="font-medium orange-text">散布図分析</div>
              <div className="text-sm orange-text-light">PRを可視化して分析</div>
            </Link>
            <a href="https://kouchou-ai.team-mir.ai/ee61bb2f-9690-4bd2-9737-1b9cc427ff97/" target="_blank" rel="noopener noreferrer" className="block p-4 blue-card rounded-lg hover:opacity-80 transition-opacity">
              <div className="font-medium blue-text">広聴AI分析</div>
              <div className="text-sm blue-text-light">高度な分析結果を確認</div>
            </a>
            <Link href="/hierarchical" className="block p-4 purple-card rounded-lg hover:opacity-80 transition-opacity">
              <div className="font-medium purple-text">階層クラスタリング</div>
              <div className="text-sm purple-text-light">階層的な分析結果を表示</div>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 blue-card rounded-lg p-6">
        <h3 className="text-lg font-semibold blue-text mb-2">
          データについて
        </h3>
        <p className="blue-text-light">
          このアプリケーションは<a href="https://github.com/team-mirai/policy" className="underline hover:no-underline" target="_blank" rel="noopener noreferrer">team-mirai/policy</a>リポジトリから収集された政策改善提案PRデータを表示しています。
        </p>
      </div>
    </div>
  )
}
