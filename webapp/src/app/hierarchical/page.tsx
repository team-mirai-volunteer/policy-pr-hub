'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import HierarchicalBulletList from '@/components/HierarchicalBulletList'
import { loadHierarchicalData } from '@/lib/hierarchicalData'
import { HierarchicalData } from '@/types/hierarchical'

export default function HierarchicalPage() {
  const [data, setData] = useState<HierarchicalData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const hierarchicalData = await loadHierarchicalData()
        setData(hierarchicalData)
      } catch (error) {
        console.error('Failed to load hierarchical data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <div className="text-lg">データを読み込み中...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <div className="text-lg text-red-600">データの読み込みに失敗しました</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="card rounded-lg shadow-sm border p-6">
        <HierarchicalBulletList data={data} />
      </div>

      <div className="mt-8 blue-card rounded-lg p-6">
        <h3 className="text-lg font-semibold blue-text mb-2">
          階層クラスタリングについて
        </h3>
        <div className="blue-text-light space-y-2">
          <p>• 政策提案を階層的にグループ化した分析結果</p>
          <p>• 上位レベルは大きなテーマ、下位レベルは具体的な課題</p>
          <p>• 各項目をクリックして詳細を展開・折りたたみ可能</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/hierarchical-clusters"
          className="inline-flex items-center px-4 py-2 green-card text-white rounded-md hover:opacity-80 transition-opacity mr-4"
        >
          子クラスタ一覧を見る
        </Link>
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
