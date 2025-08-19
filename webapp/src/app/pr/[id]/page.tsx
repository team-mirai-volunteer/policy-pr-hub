import { supabase } from '@/lib/supabase'
import { Metadata } from 'next'
import { PR } from '@/types/pr'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

async function getPR(prNumber: number): Promise<PR | null> {
  const { data, error } = await supabase
    .from('prs')
    .select('*')
    .eq('pr_number', prNumber)
    .single()

  if (error || !data) {
    return null
  }

  return {
    id: data.id,
    basic_info: data.basic_info,
    comments: data.comments || [],
    files: data.files || [],
    commits: data.commits || [],
    reviews: data.reviews || []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const prNumber = parseInt(resolvedParams.id)
  
  if (isNaN(prNumber)) {
    return {
      title: 'PR not found - Policy PR Hub',
      description: '指定されたPRが見つかりませんでした。'
    }
  }

  const pr = await getPR(prNumber)
  
  if (!pr) {
    return {
      title: 'PR not found - Policy PR Hub',
      description: '指定されたPRが見つかりませんでした。'
    }
  }

  return {
    title: `PR #${pr.basic_info.number}: ${pr.basic_info.title} - Policy PR Hub`,
    description: pr.basic_info.body?.substring(0, 160) || `PR #${pr.basic_info.number}の詳細`,
  }
}

export async function generateStaticParams() {
  const commonPRs = [1, 108, 1000, 2000, 3000, 4000, 5000]
  return commonPRs.map((id) => ({
    id: id.toString(),
  }))
}

export default async function PRPage({ params }: PageProps) {
  const resolvedParams = await params
  const prNumber = parseInt(resolvedParams.id)
  
  if (isNaN(prNumber)) {
    notFound()
  }

  const pr = await getPR(prNumber)
  
  if (!pr) {
    notFound()
  }

  const { basic_info } = pr

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-normal text-muted mb-2">
          PR #{basic_info.number}: {basic_info.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-secondary mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            basic_info.state === 'open' 
              ? 'green-card green-text' 
              : basic_info.state === 'closed'
              ? 'bg-red-100 text-red-800'
              : 'purple-card purple-text'
          }`}>
            {basic_info.state}
          </span>
          <span>作成者: {basic_info.user.login}</span>
          <span>作成日: {new Date(basic_info.created_at).toLocaleDateString('ja-JP')}</span>
          {basic_info.updated_at !== basic_info.created_at && (
            <span>更新日: {new Date(basic_info.updated_at).toLocaleDateString('ja-JP')}</span>
          )}
        </div>
        
        {basic_info.labels && basic_info.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {basic_info.labels.map((label) => (
              <span
                key={label.id}
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `#${label.color}20`,
                  color: `#${label.color}`,
                  border: `1px solid #${label.color}40`
                }}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-primary mb-4">提案内容</h2>
        <div className="prose max-w-none">
          {basic_info.body ? (
            <div className="whitespace-pre-wrap text-secondary leading-relaxed">
              {basic_info.body}
            </div>
          ) : (
            <div className="text-muted italic">
              内容がありません
            </div>
          )}
        </div>
      </div>

      {pr.comments && pr.comments.length > 0 && (
        <div className="mt-6 card rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">コメント ({pr.comments.length}件)</h2>
          <div className="space-y-4">
            {pr.comments.slice(0, 5).map((comment, index) => (
              <div key={comment.id || index} className="border-l-4 border-blue-300 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-primary">{comment.user.login}</span>
                  <span className="text-sm text-muted">
                    {new Date(comment.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <div className="text-secondary whitespace-pre-wrap">
                  {comment.body.length > 300 
                    ? comment.body.substring(0, 300) + '...' 
                    : comment.body}
                </div>
              </div>
            ))}
            {pr.comments.length > 5 && (
              <div className="text-sm text-muted text-center pt-2">
                他 {pr.comments.length - 5} 件のコメントがあります
              </div>
            )}
          </div>
        </div>
      )}

      {pr.files && pr.files.length > 0 && (
        <div className="mt-6 card rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-primary mb-4">変更ファイル ({pr.files.length}件)</h2>
          <div className="space-y-2">
            {pr.files.slice(0, 10).map((file, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b card-border last:border-b-0">
                <span className="font-mono text-sm text-secondary">{file.filename}</span>
                <div className="flex items-center gap-2 text-xs">
                  {file.additions > 0 && (
                    <span className="green-text">+{file.additions}</span>
                  )}
                  {file.deletions > 0 && (
                    <span className="text-red-600">-{file.deletions}</span>
                  )}
                </div>
              </div>
            ))}
            {pr.files.length > 10 && (
              <div className="text-sm text-muted text-center pt-2">
                他 {pr.files.length - 10} 件のファイルがあります
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <a
          href={basic_info.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 blue-card text-white rounded-md hover:opacity-80 transition-opacity"
        >
          GitHubで見る
        </a>
        <a
          href={basic_info.diff_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 card text-primary rounded-md hover:opacity-80 transition-opacity"
        >
          差分を見る
        </a>
      </div>
    </div>
  )
}
