import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadHierarchicalData } from '@/lib/hierarchicalData'
import { HierarchicalData, HierarchicalCluster } from '@/types/hierarchical'
import ArgumentsDisplayClient from './ArgumentsDisplayClient'
import VotingSection from '@/components/VotingSection'
import CommentsSection from '@/components/CommentsSection'

export async function generateStaticParams() {
  try {
    const data = await loadHierarchicalData()
    return data.clusters.map((cluster) => ({
      id: encodeURIComponent(cluster.id),
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

interface PageProps {
  params: Promise<{
    id: string
  }>
}


export default async function ClusterPage({ params }: PageProps) {
  const resolvedParams = await params
  const clusterId = decodeURIComponent(resolvedParams.id)
  
  const data = await loadHierarchicalData()
  const cluster = data.clusters.find(c => c.id === clusterId)
  
  if (!cluster) {
    notFound()
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

      <VotingSection clusterId={cluster.id} />

      <CommentsSection clusterId={cluster.id} />

      <div className="card rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">個別データ</h2>
        <ArgumentsDisplayClient
          clusterId={cluster.id}
          arguments={data.arguments || []}
        />
      </div>
    </div>
  )
}
