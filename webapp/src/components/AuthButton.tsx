'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthButton() {
  const { user, signIn, signUp, signOut, loading } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError('')

    try {
      if (isSignUp) {
        await signUp(email, password)
      } else {
        await signIn(email, password)
      }
      setShowModal(false)
      setEmail('')
      setPassword('')
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Sign out failed:', err)
    }
  }

  if (loading) {
    return <div className="text-sm text-muted">Loading...</div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:opacity-80 transition-opacity"
        >
          ログアウト
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1 text-sm blue-card blue-text rounded hover:opacity-80 transition-opacity"
      >
        ログイン
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {isSignUp ? 'アカウント作成' : 'ログイン'}
            </h2>
            
            <form onSubmit={handleAuth}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={authLoading}
                  className="flex-1 px-4 py-2 blue-card blue-text rounded-md hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {authLoading ? '処理中...' : (isSignUp ? '作成' : 'ログイン')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:opacity-80 transition-opacity"
                >
                  キャンセル
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-blue-600 hover:underline"
              >
                {isSignUp ? 'ログインはこちら' : 'アカウント作成はこちら'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
