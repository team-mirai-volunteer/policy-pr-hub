'use client'

import React, { useState, useEffect } from 'react'
import { HierarchicalData, HierarchicalArgument } from '@/types/hierarchical'
import { loadProblemMappings, getPRUrlForArgument } from '@/lib/csvLoader'

interface HierarchicalBulletListProps {
  data: HierarchicalData
}

interface ArgumentsDisplayProps {
  clusterId: string
  arguments: HierarchicalArgument[]
  maxDisplay?: number
}

interface ClusterNode {
  id: string
  level: number
  parent: string | null
  label: string
  takeaway: string
  children: ClusterNode[]
  isExpanded: boolean
  isChildrenExpanded: boolean
  arguments?: HierarchicalArgument[]
}

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
      
      if (matched < clusterArguments.length) {
        console.log(`Cluster ${clusterId}: ${matched}/${clusterArguments.length} arguments have PR links (${(matched/clusterArguments.length*100).toFixed(1)}%)`)
      }
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
    return <div className="text-gray-500 text-sm">個別データが見つかりません</div>
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="text-sm font-medium text-gray-200">
        個別データ ({clusterArguments.length}件)
        {mappingsLoaded && mappingStats.total > 0 && (
          <span className="ml-2 text-xs text-gray-400">
            PRリンク: {mappingStats.matched}/{mappingStats.total} ({(mappingStats.matched/mappingStats.total*100).toFixed(1)}%)
          </span>
        )}
      </div>
      <ul>
        {displayArguments.map((arg) => {
          const prUrl = mappingsLoaded ? getPRUrlForArgument(arg.argument, arg.arg_id) : null
          const prNumber = prUrl ? extractPRNumber(prUrl) : null
          
          if (mappingsLoaded && !prUrl) {
            console.log(`No PR URL found for arg_id: "${arg.arg_id}"`);
          }
          
          return (
            <li key={arg.arg_id} className="mb-2 ml-4">
              {/* <div className="text-xs text-gray-500 mb-1">ID: {arg.arg_id}</div> */}
              <div className="text-sm text-gray-200 flex items-start gap-2">
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
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          {showAll ? '表示を減らす' : `さらに表示 (残り${clusterArguments.length - maxDisplay}件)`}
        </button>
      )}
    </div>
  )
}

export default function HierarchicalBulletList({ data }: HierarchicalBulletListProps) {
  const [treeData, setTreeData] = useState<ClusterNode[]>([])

  useEffect(() => {
    const clusterMap = new Map<string, ClusterNode>()

    data.clusters.forEach(cluster => {
      const clusterArguments = data.arguments?.filter(arg => {
        const targetClusterId = cluster.level === 1 ? `2_${cluster.id.split('_')[1]}` : cluster.id
        return arg.cluster_ids.includes(targetClusterId)
      }) || []

      clusterMap.set(cluster.id, {
        ...cluster,
        children: [],
        isExpanded: false,
        isChildrenExpanded: false,
        arguments: clusterArguments
      })
    })

    const rootNodes: ClusterNode[] = []
    data.clusters.forEach(cluster => {
      const node = clusterMap.get(cluster.id)!

      if (cluster.parent === null) {
        rootNodes.push(node)
      } else {
        const parent = clusterMap.get(cluster.parent)
        if (parent) {
          parent.children.push(node)
        }
      }
    })

    setTreeData(rootNodes)
  }, [data])

  const closeAllDescendants = (nodes: ClusterNode[]): ClusterNode[] => {
    return nodes.map(node => ({
      ...node,
      isExpanded: false,
      isChildrenExpanded: false,
      children: closeAllDescendants(node.children)
    }))
  }

  const toggleExpanded = (nodeId: string) => {
    const updateNode = (nodes: ClusterNode[]): ClusterNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          const newIsExpanded = !node.isExpanded
          return { 
            ...node, 
            isExpanded: newIsExpanded,
            isChildrenExpanded: newIsExpanded ? node.isChildrenExpanded : false,
            children: newIsExpanded ? node.children : closeAllDescendants(node.children)
          }
        }
        return { ...node, children: updateNode(node.children) }
      })
    }

    setTreeData(updateNode(treeData))
  }

  const toggleChildrenExpanded = (nodeId: string) => {
    const updateNode = (nodes: ClusterNode[]): ClusterNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isChildrenExpanded: !node.isChildrenExpanded }
        }
        return { ...node, children: updateNode(node.children) }
      })
    }

    setTreeData(updateNode(treeData))
  }

  const renderClusterNode = (node: ClusterNode, depth: number = 0) => {
    const hasChildren = node.children.length > 0
    const childCount = node.children.length
    const hasArguments = node.level === 1 && node.arguments && node.arguments.length > 0
    const hasExpandableContent = hasChildren || node.takeaway || hasArguments

    const indentStyle = depth > 0 ? { paddingLeft: `${depth * 40}px` } : {}

    return (
      <div key={node.id} className="mb-4" style={indentStyle}>
        <div className="flex items-start space-x-2">
          {hasExpandableContent && (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
              aria-label={node.isExpanded ? "折りたたむ" : "展開する"}
            >
              <svg
                className={`w-4 h-4 transform transition-transform ${node.isExpanded ? 'rotate-90' : ''
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
          {!hasExpandableContent && (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-primary mb-1">{node.label}</h3>
            {node.isExpanded && (
              <div className="mb-2">
                <p className="text-secondary text-sm leading-relaxed mb-1">{node.takeaway}</p>
                {hasChildren && childCount > 0 && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleChildrenExpanded(node.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      {node.isChildrenExpanded ? '子要素を閉じる' : `子要素を表示 (${childCount}件)`}
                    </button>
                  </div>
                )}
                {hasArguments && (
                  <div className="mt-2">
                    <button
                      onClick={() => toggleChildrenExpanded(node.id)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      {node.isChildrenExpanded ? '個別データを閉じる' : `個別データを表示 (${node.arguments?.length || 0}件)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {hasChildren && node.isChildrenExpanded && (
          <div className="mt-3">
            {node.children.map(child => renderClusterNode(child, depth + 1))}
          </div>
        )}

        {hasArguments && node.isChildrenExpanded && data.arguments && (
          <div className="mt-3" style={{ paddingLeft: `${(depth + 1) * 40}px` }}>
            <ArgumentsDisplay
              clusterId={node.id}
              arguments={data.arguments}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-primary mb-2">
          階層クラスタリング結果
        </h2>
        <p className="text-secondary">
          政策提案の階層的な分析結果です。項目をクリックして詳細を展開できます。
        </p>
      </div>

      <div className="space-y-2">
        {treeData.map(node => renderClusterNode(node))}
      </div>
    </div>
  )
}
