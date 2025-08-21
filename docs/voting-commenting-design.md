# クラスタ投票・コメント機能設計書

## 概要

クラスタ個別ページに投票・コメント機能を追加し、ユーザーがクラスタに対して意見を表明し、議論に参加できるようにする。

## 機能要件

### 1. 投票機能
- **制約**: 1ユーザーにつき1クラスタあたり1つの投票（賛成/反対）
- **投票オプション**: 賛成（agree）/ 反対（disagree）
- **編集可能**: 投票は後から変更可能
- **表示**: クラスタページに投票状況を表示（賛成数/反対数）

### 2. コメント機能
- **制約**: 1ユーザーにつき1クラスタあたり1つのコメント
- **表示レイアウト**: 2カラム表示
  - 左カラム: 賛成投票者のコメント
  - 右カラム: 反対投票者のコメント
- **編集可能**: コメントは後から変更可能
- **投票連動**: コメントの表示位置は投票内容に基づく

### 3. コメント投票機能
- **機能**: 各コメントに対してgood/bad投票が可能
- **制約**: 1ユーザーにつき1コメントあたり1つの評価
- **編集可能**: コメント評価は後から変更可能
- **表示**: 各コメントにgood/bad数を表示

### 4. ユーザー認証
- **要件**: ユーザー識別が必要（投票・コメントの重複防止）
- **実装方針**: Supabase Authを使用した簡易認証

## データベース設計

### テーブル構造

#### 1. users テーブル
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. cluster_votes テーブル
```sql
CREATE TABLE cluster_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cluster_id)
);

CREATE INDEX idx_cluster_votes_cluster_id ON cluster_votes(cluster_id);
CREATE INDEX idx_cluster_votes_user_id ON cluster_votes(user_id);
```

#### 3. cluster_comments テーブル
```sql
CREATE TABLE cluster_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cluster_id)
);

CREATE INDEX idx_cluster_comments_cluster_id ON cluster_comments(cluster_id);
CREATE INDEX idx_cluster_comments_user_id ON cluster_comments(user_id);
```

#### 4. comment_votes テーブル
```sql
CREATE TABLE comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES cluster_comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('good', 'bad')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user_id ON comment_votes(user_id);
```

## API設計

### エンドポイント一覧

#### 1. 投票関連
- `POST /api/clusters/[id]/vote` - 投票作成・更新
- `GET /api/clusters/[id]/votes` - 投票状況取得
- `DELETE /api/clusters/[id]/vote` - 投票削除

#### 2. コメント関連
- `POST /api/clusters/[id]/comments` - コメント作成・更新
- `GET /api/clusters/[id]/comments` - コメント一覧取得
- `DELETE /api/clusters/[id]/comments/[commentId]` - コメント削除

#### 3. コメント投票関連
- `POST /api/comments/[id]/vote` - コメント投票作成・更新
- `DELETE /api/comments/[id]/vote` - コメント投票削除

#### 4. ユーザー関連
- `GET /api/user/profile` - ユーザー情報取得
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

## UI/UX設計

### クラスタページレイアウト

```
┌─────────────────────────────────────────────────────────────┐
│ クラスタ情報（既存）                                          │
├─────────────────────────────────────────────────────────────┤
│ 投票セクション                                               │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│ │   賛成      │ │   反対      │ │ 投票状況: 賛成 12票  │    │
│ │ [●] 選択済  │ │ [ ] 未選択  │ │         反対 8票   │    │
│ └─────────────┘ └─────────────┘ └─────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│ コメントセクション                                           │
│ ┌─────────────────────┐ ┌─────────────────────┐            │
│ │ 賛成コメント         │ │ 反対コメント         │            │
│ │ ┌─────────────────┐ │ │ ┌─────────────────┐ │            │
│ │ │ ユーザーA        │ │ │ │ ユーザーB        │ │            │
│ │ │ コメント内容...  │ │ │ │ コメント内容...  │ │            │
│ │ │ Good:5 Bad:1    │ │ │ │ Good:2 Bad:3    │ │            │
│ │ └─────────────────┘ │ │ └─────────────────┘ │            │
│ └─────────────────────┘ └─────────────────────┘            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ あなたのコメント                                         │ │
│ │ [テキストエリア]                                         │ │
│ │ [投稿/更新ボタン]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### コンポーネント構成

#### 1. VotingSection
- 投票ボタン（賛成/反対）
- 投票状況表示
- 投票変更機能

#### 2. CommentsSection
- 2カラムレイアウト
- コメント一覧表示
- コメント投稿フォーム

#### 3. CommentCard
- コメント内容表示
- Good/Bad投票ボタン
- 投票数表示

#### 4. AuthProvider
- ユーザー認証状態管理
- ログイン/ログアウト機能

## 技術実装詳細

### 1. 認証システム
- **Supabase Auth**を使用
- メールアドレスベースの簡易認証
- セッション管理はSupabaseが自動処理

### 2. 状態管理
- **React Context**でユーザー認証状態を管理
- **SWR**でデータフェッチとキャッシュ管理
- 楽観的更新でUX向上

### 3. リアルタイム更新
- **Supabase Realtime**で投票・コメントのリアルタイム同期
- 他ユーザーの投票・コメントを即座に反映

### 4. バリデーション
- フロントエンド: **Zod**でスキーマ検証
- バックエンド: **Supabase RLS**でセキュリティ制御

## セキュリティ考慮事項

### 1. Row Level Security (RLS)
```sql
-- ユーザーは自分の投票・コメントのみ編集可能
ALTER TABLE cluster_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- 投票の読み取りは全員可能、作成・更新・削除は本人のみ
CREATE POLICY "投票は全員が閲覧可能" ON cluster_votes FOR SELECT USING (true);
CREATE POLICY "投票は本人のみ操作可能" ON cluster_votes FOR ALL USING (auth.uid() = user_id);

-- コメントも同様
CREATE POLICY "コメントは全員が閲覧可能" ON cluster_comments FOR SELECT USING (true);
CREATE POLICY "コメントは本人のみ操作可能" ON cluster_comments FOR ALL USING (auth.uid() = user_id);

-- コメント投票も同様
CREATE POLICY "コメント投票は全員が閲覧可能" ON comment_votes FOR SELECT USING (true);
CREATE POLICY "コメント投票は本人のみ操作可能" ON comment_votes FOR ALL USING (auth.uid() = user_id);
```

### 2. 入力検証
- XSS対策: HTMLエスケープ処理
- SQLインジェクション対策: Supabaseクライアントの自動エスケープ
- CSRF対策: Supabaseの自動CSRF保護

## 実装フェーズ

### フェーズ1: 基盤構築
1. Supabase環境設定
2. データベーススキーマ作成
3. 認証システム実装
4. 基本API実装

### フェーズ2: 投票機能
1. 投票UI実装
2. 投票API統合
3. 投票状況表示

### フェーズ3: コメント機能
1. コメントUI実装（2カラムレイアウト）
2. コメントAPI統合
3. コメント投稿・編集機能

### フェーズ4: コメント投票機能
1. コメント投票UI実装
2. コメント投票API統合
3. 投票数表示

### フェーズ5: 最適化・改善
1. リアルタイム更新実装
2. パフォーマンス最適化
3. エラーハンドリング強化
4. テスト追加

## 運用考慮事項

### 1. データ移行
- 既存のクラスタデータとの整合性確保
- 段階的ロールアウト

### 2. モニタリング
- 投票・コメント数の監視
- パフォーマンス監視
- エラー監視

### 3. スケーラビリティ
- 大量のコメント・投票への対応
- データベースインデックス最適化
- キャッシュ戦略

## 今後の拡張可能性

1. **通知機能**: コメントへの返信通知
2. **モデレーション機能**: 不適切なコメントの報告・削除
3. **分析機能**: 投票・コメント傾向の分析
4. **エクスポート機能**: 議論データのエクスポート
5. **API公開**: 外部システムとの連携

## 結論

この設計により、ユーザーがクラスタに対して意見を表明し、建設的な議論を行える環境を提供できる。段階的な実装により、リスクを最小化しながら機能を追加していく。
