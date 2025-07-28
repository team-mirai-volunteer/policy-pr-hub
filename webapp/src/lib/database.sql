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
