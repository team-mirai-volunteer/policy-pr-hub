export interface PRBasicInfo {
  url: string
  id: number
  node_id: string
  html_url: string
  diff_url: string
  patch_url: string
  issue_url: string
  number: number
  state: string
  locked: boolean
  title: string
  user: {
    login: string
    id: number
    node_id: string
    avatar_url: string
    html_url: string
    type: string
  }
  body: string
  created_at: string
  updated_at: string
  closed_at: string | null
  merged_at: string | null
  merge_commit_sha: string | null
  labels: Array<{
    id: number
    name: string
    color: string
    description: string
  }>
  draft: boolean
}

export interface PRComment {
  id: number
  body: string
  user: {
    login: string
    id: number
    html_url: string
  }
  created_at: string
  updated_at: string
}

export interface PRFile {
  filename: string
  status: string
  additions: number
  deletions: number
  changes: number
  patch?: string
}

export interface PRCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author: {
    login: string
    id: number
    html_url: string
  }
}

export interface PRReview {
  id: number
  state: string
  body?: string
  user: {
    login: string
    id: number
    html_url: string
  }
  submitted_at: string
}

export interface PR {
  id: number
  basic_info: PRBasicInfo
  comments?: PRComment[]
  files?: PRFile[]
  commits?: PRCommit[]
  reviews?: PRReview[]
}
