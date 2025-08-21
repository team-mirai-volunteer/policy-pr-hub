'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { VotingStats } from '@/types/hierarchical'

interface VotingSectionProps {
  clusterId: string
}

export default function VotingSection({ clusterId }: VotingSectionProps) {
  const { user, session } = useAuth()
  const [stats, setStats] = useState<VotingStats>({ agree_count: 0, disagree_count: 0 })
  const [userVote, setUserVote] = useState<'agree' | 'disagree' | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchVotingStats = async () => {
    try {
      const response = await fetch(`/api/clusters/${clusterId}/vote`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch voting stats:', error)
    }
  }

  const fetchUserVote = async () => {
    if (!user || !session) return
    
    try {
      const response = await fetch(`/api/clusters/${clusterId}/vote/user`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUserVote(data.vote_type || null)
      }
    } catch (error) {
      console.error('Failed to fetch user vote:', error)
    }
  }

  useEffect(() => {
    fetchVotingStats()
    if (user && session) {
      fetchUserVote()
    }
  }, [clusterId, user, session, fetchVotingStats, fetchUserVote])


  const handleVote = async (voteType: 'agree' | 'disagree') => {
    if (!user || !session || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/clusters/${clusterId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      })

      if (response.ok) {
        setUserVote(voteType)
        await fetchVotingStats()
      }
    } catch (error) {
      console.error('Failed to vote:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="card rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-primary mb-4">投票</h3>
        <p className="text-muted">投票するにはログインが必要です。</p>
      </div>
    )
  }

  return (
    <div className="card rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold text-primary mb-4">投票</h3>
      <div className="flex gap-4 items-center mb-4">
        <button
          onClick={() => handleVote('agree')}
          disabled={loading}
          className={`px-4 py-2 rounded-md transition-opacity ${
            userVote === 'agree'
              ? 'blue-card blue-text'
              : 'border border-gray-300 hover:opacity-80'
          }`}
        >
          {userVote === 'agree' ? '● 賛成' : '○ 賛成'}
        </button>
        <button
          onClick={() => handleVote('disagree')}
          disabled={loading}
          className={`px-4 py-2 rounded-md transition-opacity ${
            userVote === 'disagree'
              ? 'blue-card blue-text'
              : 'border border-gray-300 hover:opacity-80'
          }`}
        >
          {userVote === 'disagree' ? '● 反対' : '○ 反対'}
        </button>
        <div className="text-sm text-muted">
          賛成 {stats.agree_count}票 / 反対 {stats.disagree_count}票
        </div>
      </div>
    </div>
  )
}
