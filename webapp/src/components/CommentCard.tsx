'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ClusterComment } from '@/types/hierarchical'

interface CommentCardProps {
  comment: ClusterComment
  onUpdate: () => void
}

export default function CommentCard({ comment, onUpdate }: CommentCardProps) {
  const { user, session } = useAuth()
  const [goodCount, setGoodCount] = useState(0)
  const [badCount, setBadCount] = useState(0)
  const [userVote, setUserVote] = useState<'good' | 'bad' | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCommentVotes = async () => {
    try {
      const response = await fetch(`/api/comments/${comment.id}/vote`)
      const data = await response.json()
      setGoodCount(data.good_count || 0)
      setBadCount(data.bad_count || 0)
    } catch (error) {
      console.error('Failed to fetch comment votes:', error)
    }
  }

  useEffect(() => {
    fetchCommentVotes()
  }, [comment.id])


  const handleVote = async (voteType: 'good' | 'bad') => {
    if (!user || !session || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ vote_type: voteType }),
      })

      if (response.ok) {
        setUserVote(voteType)
        await fetchCommentVotes()
      }
    } catch (error) {
      console.error('Failed to vote on comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="text-sm text-muted">
          {comment.user?.display_name || comment.user?.email || 'Anonymous'}
        </div>
        <div className="text-xs text-muted">
          {new Date(comment.created_at).toLocaleDateString('ja-JP')}
        </div>
      </div>
      
      <p className="text-sm mb-3">{comment.content}</p>
      
      {user && (
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handleVote('good')}
            disabled={loading}
            className={`px-2 py-1 text-xs rounded transition-opacity ${
              userVote === 'good'
                ? 'bg-green-100 text-green-700'
                : 'border border-gray-300 hover:opacity-80'
            }`}
          >
            👍 {goodCount}
          </button>
          <button
            onClick={() => handleVote('bad')}
            disabled={loading}
            className={`px-2 py-1 text-xs rounded transition-opacity ${
              userVote === 'bad'
                ? 'bg-red-100 text-red-700'
                : 'border border-gray-300 hover:opacity-80'
            }`}
          >
            👎 {badCount}
          </button>
        </div>
      )}
    </div>
  )
}
