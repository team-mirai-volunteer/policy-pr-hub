import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clusterId } = await params
    
    const { data: comments, error } = await supabase
      .from('cluster_comments')
      .select(`
        *,
        user:users(display_name, email),
        comment_votes(vote_type)
      `)
      .eq('cluster_id', clusterId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: votes, error: votesError } = await supabase
      .from('cluster_votes')
      .select('user_id, vote_type')
      .eq('cluster_id', clusterId)

    if (votesError) {
      return NextResponse.json({ error: votesError.message }, { status: 500 })
    }

    const commentsWithVoteType = comments.map(comment => {
      const userVote = votes.find(v => v.user_id === comment.user_id)
      return {
        ...comment,
        user_vote_type: userVote?.vote_type
      }
    })

    return NextResponse.json(commentsWithVoteType)
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clusterId } = await params
    const { content } = await request.json()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('cluster_comments')
      .upsert({
        user_id: user.id,
        cluster_id: clusterId,
        content,
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
