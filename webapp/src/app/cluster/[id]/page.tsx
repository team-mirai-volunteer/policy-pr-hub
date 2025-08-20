'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { loadHierarchicalData } from '@/lib/hierarchicalData'
import { HierarchicalData, HierarchicalCluster } from '@/types/hierarchical'
import { loadProblemMappings, getPRUrlForArgument } from '@/lib/csvLoader'

interface ArgumentsDisplayProps {
  clusterId: string
  arguments: any[]
  maxDisplay?: number
  extractPRNumber: (url: string) => number
}

function ArgumentsDisplay({ clusterId, arguments: argumentsList, maxDisplay = 10, extractPRNumber }: ArgumentsDisplayProps) {
  const [showAll, setShowAll] = useState(false)
  const [mappingsLoaded, setMappingsLoaded] = useState(false)
  const [mappingStats, setMappingStats] = useState({ total: 0, matched: 0 })

  useEffect(() => {
    loadProblemMappings().then(() => {
      setMappingsLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (mappingsLoaded) {
      const clusterArguments = argumentsList.filter(arg => {
        const adjustedClusterId = clusterId.startsWith('2_') ? clusterId : `2_${clusterId.split('_')[1]}`
        return arg.cluster_ids.includes(adjustedClusterId)
      })
      
      const matched = clusterArguments.filter(arg => getPRUrlForArgument(arg.argument, arg.arg_id)).length
      setMappingStats({ total: clusterArguments.length, matched })
    }
  }, [mappingsLoaded, clusterId, argumentsList])

  const clusterArguments = argumentsList.filter(arg => {
    const adjustedClusterId = clusterId.startsWith('2_') ? clusterId : `2_${clusterId.split('_')[1]}`
    return arg.cluster_ids.includes(adjustedClusterId)
  })

  const displayArguments = showAll ? clusterArguments : clusterArguments.slice(0, maxDisplay)

  if (clusterArguments.length === 0) {
    return <div className="text-muted text-sm">個別データが見つかりません</div>
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="text-sm font-medium text-primary">
        個別データ ({clusterArguments.length}件)
        {mappingsLoaded && mappingStats.total > 0 && (
          <span className="ml-2 text-xs text-muted">
            PRリンク: {mappingStats.matched}/{mappingStats.total} ({(mappingStats.matched/mappingStats.total*100).toFixed(1)}%)
          </span>
        )}
      </div>
      <ul>
        {displayArguments.map((arg) => {
          const prUrl = mappingsLoaded ? getPRUrlForArgument(arg.argument, arg.arg_id) : null
          const prNumber = prUrl ? extractPRNumber(prUrl) : null
          
          return (
            <li key={arg.arg_id} className="mb-2 ml-4">
              <div className="text-sm text-secondary flex items-start gap-2">
                <span className="flex-1">{arg.argument}</span>
                {prNumber && prUrl && (
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="blue-text hover:blue-text-light underline text-xs whitespace-nowrap"
                  >
                    #{prNumber}
                  </a>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {clusterArguments.length > maxDisplay && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs blue-text hover:blue-text-light underline"
        >
          {showAll ? '表示を減らす' : `さらに表示 (残り${clusterArguments.length - maxDisplay}件)`}
        </button>
      )}
    </div>
  )
}

export default function ClusterPage() {
  const params = useParams()
  const [data, setData] = useState<HierarchicalData | null>(null)
  const [cluster, setCluster] = useState<HierarchicalCluster | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const clusterId = decodeURIComponent(params.id as string)
        const hierarchicalData = await loadHierarchicalData()
        const foundCluster = hierarchicalData.clusters.find(c => c.id === clusterId)
        
        if (!foundCluster) {
          setNotFound(true)
        } else {
          setData(hierarchicalData)
          setCluster(foundCluster)
        }
      } catch (error) {
        console.error('Error loading cluster data:', error)
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  const extractPRNumber = (url: string): number => {
    const match = url.match(/\/pull\/(\d+)$/)
    return match ? parseInt(match[1]) : 0
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  if (notFound || !cluster || !data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-4">クラスタが見つかりません</h1>
          <Link
            href="/hierarchical-clusters"
            className="text-sm blue-text hover:blue-text-light underline"
          >
            ← 子クラスタ一覧に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link
          href="/hierarchical-clusters"
          className="text-sm blue-text hover:blue-text-light underline mb-4 inline-block"
        >
          ← 子クラスタ一覧に戻る
        </Link>
        <h1 className="text-3xl font-bold text-primary mb-4">
          {cluster.label}
        </h1>
        <p className="text-secondary text-lg leading-relaxed mb-4">
          {cluster.takeaway}
        </p>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <span>意見数: {cluster.count || cluster.value || 0}件</span>
          <span>レベル: {cluster.level}</span>
        </div>
      </div>

      <div className="card rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">個別データ</h2>
        <ArgumentsDisplay
          clusterId={cluster.id}
          arguments={data.arguments || []}
          extractPRNumber={extractPRNumber}
        />
      </div>
    </div>
  )
}
