CREATE TABLE IF NOT EXISTS prs (
  id SERIAL PRIMARY KEY,
  pr_number INTEGER UNIQUE NOT NULL,
  basic_info JSONB NOT NULL,
  comments JSONB DEFAULT '[]'::jsonb,
  files JSONB DEFAULT '[]'::jsonb,
  commits JSONB DEFAULT '[]'::jsonb,
  reviews JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prs_pr_number ON prs(pr_number);

CREATE INDEX IF NOT EXISTS idx_prs_basic_info_gin ON prs USING GIN (basic_info);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cluster_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cluster_id)
);

CREATE TABLE IF NOT EXISTS cluster_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cluster_id)
);

CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES cluster_comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('good', 'bad')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_cluster_votes_cluster_id ON cluster_votes(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_votes_user_id ON cluster_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_cluster_comments_cluster_id ON cluster_comments(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_comments_user_id ON cluster_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);

ALTER TABLE cluster_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "投票は全員が閲覧可能" ON cluster_votes FOR SELECT USING (true);
CREATE POLICY "投票は本人のみ操作可能" ON cluster_votes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "コメントは全員が閲覧可能" ON cluster_comments FOR SELECT USING (true);
CREATE POLICY "コメントは本人のみ操作可能" ON cluster_comments FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "コメント投票は全員が閲覧可能" ON comment_votes FOR SELECT USING (true);
CREATE POLICY "コメント投票は本人のみ操作可能" ON comment_votes FOR ALL USING (auth.uid() = user_id);
