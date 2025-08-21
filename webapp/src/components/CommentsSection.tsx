'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ClusterComment } from '@/types/hierarchical'
import CommentCard from './CommentCard'

interface CommentsSectionProps {
  clusterId: string
}

export default function CommentsSection({ clusterId }: CommentsSectionProps) {
  const { user, session } = useAuth()
  const [comments, setComments] = useState<ClusterComment[]>([])
  const [userComment, setUserComment] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/clusters/${clusterId}/comments`)
      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [clusterId, fetchComments])


  const handleSubmitComment = async () => {
    if (!user || !session || !userComment.trim() || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/clusters/${clusterId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: userComment }),
      })

      if (response.ok) {
        setUserComment('')
        await fetchComments()
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const agreeComments = comments.filter(comment => 
    comment.user_vote_type === 'agree'
  )
  const disagreeComments = comments.filter(comment => 
    comment.user_vote_type === 'disagree'
  )

  return (
    <div className="card rounded-lg shadow-sm border p-6 mb-6">
      <h3 className="text-lg font-semibold text-primary mb-4">コメント</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-md font-medium text-green-600 mb-3">
            賛成コメント ({agreeComments.length})
          </h4>
          <div className="space-y-3">
            {agreeComments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onUpdate={fetchComments}
              />
            ))}
            {agreeComments.length === 0 && (
              <p className="text-sm text-muted">賛成コメントはまだありません</p>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-red-600 mb-3">
            反対コメント ({disagreeComments.length})
          </h4>
          <div className="space-y-3">
            {disagreeComments.map(comment => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onUpdate={fetchComments}
              />
            ))}
            {disagreeComments.length === 0 && (
              <p className="text-sm text-muted">反対コメントはまだありません</p>
            )}
          </div>
        </div>
      </div>

      {user ? (
        <div className="border-t pt-4">
          <h4 className="text-md font-medium text-primary mb-3">あなたのコメント</h4>
          <textarea
            value={userComment}
            onChange={(e) => setUserComment(e.target.value)}
            placeholder="コメントを入力してください..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            rows={3}
          />
          <button
            onClick={handleSubmitComment}
            disabled={loading || !userComment.trim()}
            className="px-4 py-2 blue-card blue-text rounded-md hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? '投稿中...' : '投稿'}
          </button>
        </div>
      ) : (
        <div className="border-t pt-4">
          <p className="text-muted">コメントするにはログインが必要です。</p>
        </div>
      )}
    </div>
  )
}
