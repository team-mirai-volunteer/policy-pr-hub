'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { HierarchicalData, HierarchicalArgument, HierarchicalCluster } from '@/types/hierarchical'
import { loadProblemMappings, getPRUrlForArgument } from '@/lib/csvLoader'
import { loadDensityData } from '@/lib/densityData'

interface ChildClusterListProps {
  data: HierarchicalData
}

interface ArgumentsDisplayProps {
  clusterId: string
  arguments: HierarchicalArgument[]
  maxDisplay?: number
}

interface EnhancedCluster extends HierarchicalCluster {
  densityRankPercentile?: number
  agreeRatio?: number
  uniquePRCount?: number
  isExpanded: boolean
}

type SortMethod = 'density' | 'agreeRatio'

function ArgumentsDisplay({ clusterId, arguments: argumentsList, maxDisplay = 10 }: ArgumentsDisplayProps) {
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

  const extractPRNumber = (url: string): number => {
    const match = url.match(/\/pull\/(\d+)$/)
    return match ? parseInt(match[1]) : 0
  }

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
                    className="text-blue-400 hover:text-blue-300 underline text-xs whitespace-nowrap"
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

export default function ChildClusterList({ data }: ChildClusterListProps) {
  const [sortMethod, setSortMethod] = useState<SortMethod>('density')
  const [enhancedClusters, setEnhancedClusters] = useState<EnhancedCluster[]>([])
  const [mappingsLoaded, setMappingsLoaded] = useState(false)
  const [densityDataLoaded, setDensityDataLoaded] = useState(false)

  useEffect(() => {
    loadProblemMappings().then(() => {
      setMappingsLoaded(true)
    })
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        await loadDensityData()
        setDensityDataLoaded(true)
      } catch (error) {
        console.error('Failed to load density data:', error)
        setDensityDataLoaded(true)
      }
    }
    loadData()
  }, [])

  const childClusters = useMemo(() => {
    return data.clusters.filter(cluster => cluster.level === 1)
  }, [data.clusters])

  useEffect(() => {
    if (!mappingsLoaded || !densityDataLoaded) return

    const enhanceCluster = async (cluster: HierarchicalCluster): Promise<EnhancedCluster> => {
      const clusterArguments = data.arguments?.filter(arg => {
        const targetClusterId = `2_${cluster.id.split('_')[1]}`
        return arg.cluster_ids.includes(targetClusterId)
      }) || []

      const prUrls = new Set<string>()
      clusterArguments.forEach(arg => {
        const prUrl = getPRUrlForArgument(arg.argument, arg.arg_id)
        if (prUrl) {
          prUrls.add(prUrl)
        }
      })

      const uniquePRCount = prUrls.size
      const agreeRatio = (uniquePRCount + 1) / (uniquePRCount + 0 + 2)

      const densityData = await loadDensityData()
      const densityInfo = densityData.find(d => d.id === cluster.id)
      const densityRankPercentile = densityInfo?.density_rank_percentile

      return {
        ...cluster,
        densityRankPercentile,
        agreeRatio,
        uniquePRCount,
        isExpanded: false
      }
    }

    const enhanceAllClusters = async () => {
      const enhanced = await Promise.all(childClusters.map(enhanceCluster))
      setEnhancedClusters(enhanced)
    }

    enhanceAllClusters()
  }, [childClusters, data.arguments, mappingsLoaded, densityDataLoaded])

  const sortedClusters = useMemo(() => {
    if (enhancedClusters.length === 0) return []

    const sorted = [...enhancedClusters].sort((a, b) => {
      if (sortMethod === 'density') {
        if (a.densityRankPercentile === undefined && b.densityRankPercentile === undefined) return 0
        if (a.densityRankPercentile === undefined) return 1
        if (b.densityRankPercentile === undefined) return -1
        return a.densityRankPercentile - b.densityRankPercentile
      } else {
        if (a.agreeRatio === undefined && b.agreeRatio === undefined) return 0
        if (a.agreeRatio === undefined) return 1
        if (b.agreeRatio === undefined) return -1
        return b.agreeRatio - a.agreeRatio
      }
    })

    return sorted
  }, [enhancedClusters, sortMethod])

  const toggleExpanded = (clusterId: string) => {
    setEnhancedClusters(prev => 
      prev.map(cluster => 
        cluster.id === clusterId 
          ? { ...cluster, isExpanded: !cluster.isExpanded }
          : cluster
      )
    )
  }

  if (enhancedClusters.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">データを処理中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-4">
          子クラスタ一覧 ({sortedClusters.length}件)
        </h2>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-secondary">ソート順序:</span>
            <label className="flex items-center">
              <input
                type="radio"
                name="sortMethod"
                value="density"
                checked={sortMethod === 'density'}
                onChange={(e) => setSortMethod(e.target.value as SortMethod)}
                className="mr-2"
              />
              <span className="text-sm">密度順</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="sortMethod"
                value="agreeRatio"
                checked={sortMethod === 'agreeRatio'}
                onChange={(e) => setSortMethod(e.target.value as SortMethod)}
                className="mr-2"
              />
              <span className="text-sm">賛否比率順</span>
            </label>
          </div>
        </div>

        <div className="text-sm text-muted mb-4">
          {sortMethod === 'density' 
            ? '密度ランクパーセンタイルの低い順（密度の高い順）で表示'
            : '賛否比率の高い順で表示（PR由来の賛成票数ベース）'
          }
        </div>
      </div>

      <div className="space-y-3">
        {sortedClusters.map((cluster, index) => (
          <div key={cluster.id} className="card rounded-lg p-4 hover:opacity-90 transition-opacity">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                {index + 1}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-2">{cluster.label}</h3>
                    <p className="text-secondary text-sm leading-relaxed mb-2">{cluster.takeaway}</p>
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted mb-2">
                      <span>引数数: {cluster.count || cluster.value || 0}件</span>
                      {cluster.densityRankPercentile !== undefined && (
                        <span>密度ランク: {(cluster.densityRankPercentile * 100).toFixed(1)}%</span>
                      )}
                      {cluster.agreeRatio !== undefined && (
                        <span>賛否比率: {(cluster.agreeRatio * 100).toFixed(1)}%</span>
                      )}
                      {cluster.uniquePRCount !== undefined && (
                        <span>PR数: {cluster.uniquePRCount}件</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleExpanded(cluster.id)}
                  className="text-xs blue-text hover:blue-text-light underline"
                >
                  {cluster.isExpanded ? '個別データを閉じる' : '個別データを表示'}
                </button>

                {cluster.isExpanded && data.arguments && (
                  <ArgumentsDisplay
                    clusterId={cluster.id}
                    arguments={data.arguments}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
