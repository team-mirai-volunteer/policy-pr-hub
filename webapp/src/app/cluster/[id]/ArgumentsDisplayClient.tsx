'use client'

import React, { useEffect, useState } from 'react'
import { loadProblemMappings, getPRUrlForArgument } from '@/lib/csvLoader'

interface ArgumentsDisplayProps {
  clusterId: string
  arguments: any[]
  maxDisplay?: number
}

export default function ArgumentsDisplayClient({ clusterId, arguments: argumentsList, maxDisplay = 10 }: ArgumentsDisplayProps) {
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
