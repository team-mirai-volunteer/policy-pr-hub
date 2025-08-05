'use client'

import React, { useState, useEffect } from 'react'
import { HierarchicalData } from '@/types/hierarchical'

interface HierarchicalBulletListProps {
  data: HierarchicalData
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
}

export default function HierarchicalBulletList({ data }: HierarchicalBulletListProps) {
  const [treeData, setTreeData] = useState<ClusterNode[]>([])

  useEffect(() => {
    const clusterMap = new Map<string, ClusterNode>()
    
    data.clusters.forEach(cluster => {
      clusterMap.set(cluster.id, {
        ...cluster,
        children: [],
        isExpanded: false,
        isChildrenExpanded: false
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

  const toggleExpanded = (nodeId: string) => {
    const updateNode = (nodes: ClusterNode[]): ClusterNode[] => {
      return nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded }
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
    
    const indentStyle = depth > 0 ? { paddingLeft: `${depth * 40}px` } : {}
    
    return (
      <div key={node.id} className="mb-4" style={indentStyle}>
        <div className="flex items-start space-x-2">
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(node.id)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors"
              aria-label={node.isExpanded ? "折りたたむ" : "展開する"}
            >
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  node.isExpanded ? 'rotate-90' : ''
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
          {!hasChildren && (
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
              </div>
            )}
            {!hasChildren && !node.isExpanded && node.takeaway && (
              <p className="text-secondary text-sm leading-relaxed">{node.takeaway}</p>
            )}
          </div>
        </div>
        
        {hasChildren && node.isChildrenExpanded && (
          <div className="mt-3">
            {node.children.map(child => renderClusterNode(child, depth + 1))}
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
