'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ScatterChart from '@/components/ScatterChart'
import { loadPRDashboardData, PRDashboardData } from '@/lib/prDashboardData'

export default function ScatterPage() {
  const [data, setData] = useState<PRDashboardData[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadData = async () => {
      try {
        const prData = await loadPRDashboardData()
        setData(prData)
      } catch (error) {
        console.error('Failed to load PR data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  const handlePointClick = (prNumber: number) => {
    router.push(`/pr/${prNumber}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <div className="text-lg">データを読み込み中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-4">
          PR散布図分析
        </h1>
        <p className="text-lg text-secondary mb-8">
          政策改善提案PRのスタンスと主張強度を可視化します。点をクリックして個別のPRを表示できます。
        </p>
      </div>

      <div className="card rounded-lg shadow-sm border card-border p-6">
        <ScatterChart data={data} onPointClick={handlePointClick} />
      </div>

      <div className="mt-8 blue-card rounded-lg p-6">
        <h3 className="text-lg font-semibold blue-text mb-2">
          散布図について
        </h3>
        <div className="blue-text space-y-2">
          <p>• X軸: スタンス（-5: 否定的 ～ +5: 肯定的）</p>
          <p>• Y軸: 主張強度（-5: 弱い ～ +5: 強い）</p>
          <p>• 色分け: ラベル（政策分野）別</p>
          <p>• クリック: 個別のPR詳細ページに移動</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 blue-card text-white rounded-md hover:opacity-80 transition-opacity"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
