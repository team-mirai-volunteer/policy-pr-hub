export interface HierarchicalArgument {
  arg_id: string;
  argument: string;
  x: number;
  y: number;
  p: number;
  cluster_ids: string[];
  url: string | null;
}

export interface HierarchicalCluster {
  id: string;
  level: number;
  parent: string | null;
  label: string;
  takeaway: string;
  value?: number;
  count?: number;
  arguments?: HierarchicalArgument[];
  densityRankPercentile?: number;
}

export interface HierarchicalData {
  clusters: HierarchicalCluster[];
  arguments: HierarchicalArgument[];
  metadata?: {
    totalItems: number;
    extractedAt: string;
  };
}

export interface Argument {
  id: string
  content: string
  pr_number: number
}

export interface User {
  id: string
  email: string
  display_name: string
  created_at: string
  updated_at: string
}

export interface ClusterVote {
  id: string
  user_id: string
  cluster_id: string
  vote_type: 'agree' | 'disagree'
  created_at: string
  updated_at: string
}

export interface ClusterComment {
  id: string
  user_id: string
  cluster_id: string
  content: string
  created_at: string
  updated_at: string
  user?: User
  comment_votes?: CommentVote[]
  user_vote_type?: 'agree' | 'disagree'
}

export interface CommentVote {
  id: string
  user_id: string
  comment_id: string
  vote_type: 'good' | 'bad'
  created_at: string
  updated_at: string
}

export interface VotingStats {
  agree_count: number
  disagree_count: number
  user_vote?: 'agree' | 'disagree'
}
