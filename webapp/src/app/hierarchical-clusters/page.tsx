'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import ChildClusterList from '@/components/ChildClusterList'
import { loadHierarchicalData } from '@/lib/hierarchicalData'
import { HierarchicalData } from '@/types/hierarchical'

export default function HierarchicalClustersPage() {
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary mb-4">
          子クラスタ一覧
        </h1>
        <p className="text-secondary">
          400の子クラスタを密度順または賛否比率順で表示します。
        </p>
      </div>

      <div className="card rounded-lg shadow-sm border p-6">
        <ChildClusterList data={data} />
      </div>

      <div className="mt-8 blue-card rounded-lg p-6">
        <h3 className="text-lg font-semibold blue-text mb-2">
          子クラスタ一覧について
        </h3>
        <div className="blue-text-light space-y-2">
          <p>• 階層クラスタリングの子クラスタ（400件）を一覧表示</p>
          <p>• 密度順：クラスタの密度ランクパーセンタイルでソート</p>
          <p>• 賛否比率順：PR由来の賛成票数に基づく比率でソート</p>
          <p>• 各クラスタをクリックして個別データを展開可能</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/hierarchical"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mr-4"
        >
          階層表示に戻る
        </Link>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  )
}
