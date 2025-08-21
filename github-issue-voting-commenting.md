# クラスタ個別ページに投票・コメント機能を追加

## 概要

クラスタ個別ページ（PR #61で追加）に投票・コメント機能を実装し、ユーザーがクラスタに対して意見を表明し、議論に参加できるようにする。

## 機能要件

### 🗳️ 投票機能
- **制約**: 1ユーザーにつき1クラスタあたり1つの投票（賛成/反対）
- **投票オプション**: 賛成（agree）/ 反対（disagree）
- **編集可能**: 投票は後から変更可能
- **表示**: クラスタページに投票状況を表示（賛成数/反対数）

### 💬 コメント機能
- **制約**: 1ユーザーにつき1クラスタあたり1つのコメント
- **表示レイアウト**: 2カラム表示
  - 左カラム: 賛成投票者のコメント
  - 右カラム: 反対投票者のコメント
- **編集可能**: コメントは後から変更可能
- **投票連動**: コメントの表示位置は投票内容に基づく

### 👍 コメント投票機能
- **機能**: 各コメントに対してgood/bad投票が可能
- **制約**: 1ユーザーにつき1コメントあたり1つの評価
- **編集可能**: コメント評価は後から変更可能
- **表示**: 各コメントにgood/bad数を表示

### 🔐 ユーザー認証
- **要件**: ユーザー識別が必要（投票・コメントの重複防止）
- **実装方針**: Supabase Authを使用した簡易認証

## 技術仕様

### 対象ファイル
- **メインページ**: `webapp/src/app/cluster/[id]/page.tsx`
- **既存コンポーネント**: `webapp/src/app/cluster/[id]/ArgumentsDisplayClient.tsx`
- **Supabase設定**: `webapp/src/lib/supabase.ts`
- **データベーススキーマ**: `webapp/src/lib/database.sql`

### 技術スタック
- **フレームワーク**: Next.js 15 with App Router
- **データベース**: Supabase
- **認証**: Supabase Auth
- **スタイリング**: Tailwind CSS v4
- **状態管理**: React Context + SWR

## データベース設計

### 新規テーブル作成

以下のSQLを`webapp/src/lib/database.sql`に追加：

```sql
-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クラスタ投票テーブル
CREATE TABLE IF NOT EXISTS cluster_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('agree', 'disagree')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cluster_id)
);

-- クラスタコメントテーブル
CREATE TABLE IF NOT EXISTS cluster_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  cluster_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cluster_id)
);

-- コメント投票テーブル
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES cluster_comments(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('good', 'bad')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_cluster_votes_cluster_id ON cluster_votes(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_votes_user_id ON cluster_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_cluster_comments_cluster_id ON cluster_comments(cluster_id);
CREATE INDEX IF NOT EXISTS idx_cluster_comments_user_id ON cluster_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
```

### Row Level Security (RLS) 設定

```sql
-- RLS有効化
ALTER TABLE cluster_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

-- 投票ポリシー
CREATE POLICY "投票は全員が閲覧可能" ON cluster_votes FOR SELECT USING (true);
CREATE POLICY "投票は本人のみ操作可能" ON cluster_votes FOR ALL USING (auth.uid() = user_id);

-- コメントポリシー
CREATE POLICY "コメントは全員が閲覧可能" ON cluster_comments FOR SELECT USING (true);
CREATE POLICY "コメントは本人のみ操作可能" ON cluster_comments FOR ALL USING (auth.uid() = user_id);

-- コメント投票ポリシー
CREATE POLICY "コメント投票は全員が閲覧可能" ON comment_votes FOR SELECT USING (true);
CREATE POLICY "コメント投票は本人のみ操作可能" ON comment_votes FOR ALL USING (auth.uid() = user_id);
```

## API設計

### 必要なAPIエンドポイント

#### 1. 投票関連 (`webapp/src/app/api/clusters/[id]/vote/route.ts`)
```typescript
// POST /api/clusters/[id]/vote - 投票作成・更新
// GET /api/clusters/[id]/votes - 投票状況取得
// DELETE /api/clusters/[id]/vote - 投票削除
```

#### 2. コメント関連 (`webapp/src/app/api/clusters/[id]/comments/route.ts`)
```typescript
// POST /api/clusters/[id]/comments - コメント作成・更新
// GET /api/clusters/[id]/comments - コメント一覧取得
// DELETE /api/clusters/[id]/comments/[commentId] - コメント削除
```

#### 3. コメント投票関連 (`webapp/src/app/api/comments/[id]/vote/route.ts`)
```typescript
// POST /api/comments/[id]/vote - コメント投票作成・更新
// DELETE /api/comments/[id]/vote - コメント投票削除
```

#### 4. 認証関連 (`webapp/src/app/api/auth/`)
```typescript
// GET /api/user/profile - ユーザー情報取得
// POST /api/auth/login - ログイン
// POST /api/auth/logout - ログアウト
```

## UI/UX設計

### クラスタページレイアウト

既存の`webapp/src/app/cluster/[id]/page.tsx`を拡張：

```jsx
<div className="container mx-auto px-4 py-8 max-w-6xl">
  {/* 既存のクラスタ情報 */}
  <div className="mb-6">...</div>

  {/* 新規: 投票セクション */}
  <VotingSection clusterId={cluster.id} />

  {/* 新規: コメントセクション */}
  <CommentsSection clusterId={cluster.id} />

  {/* 既存の個別データ */}
  <div className="card rounded-lg shadow-sm border p-6">...</div>
</div>
```

### 新規コンポーネント設計

#### 1. `VotingSection.tsx`
```jsx
// 投票ボタン（賛成/反対）
// 投票状況表示（賛成数/反対数）
// 投票変更機能
```

#### 2. `CommentsSection.tsx`
```jsx
// 2カラムレイアウト（賛成コメント | 反対コメント）
// コメント投稿フォーム
// コメント一覧表示
```

#### 3. `CommentCard.tsx`
```jsx
// コメント内容表示
// Good/Bad投票ボタン
// 投票数表示
// 編集・削除ボタン（本人のみ）
```

#### 4. `AuthProvider.tsx`
```jsx
// ユーザー認証状態管理
// ログイン/ログアウト機能
// Context Provider
```

## 実装手順

### フェーズ1: 環境設定
1. **Supabase依存関係インストール**
   ```bash
   cd webapp
   npm install @supabase/supabase-js @supabase/ssr
   ```

2. **環境変数設定**
   ```bash
   # webapp/.env.local を作成
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **データベーススキーマ実行**
   - Supabaseダッシュボードで上記SQLを実行

### フェーズ2: 認証システム
1. **AuthProvider実装** (`webapp/src/contexts/AuthContext.tsx`)
2. **ログイン/ログアウトUI** (`webapp/src/components/Auth/`)
3. **認証状態の統合** (`webapp/src/app/layout.tsx`)

### フェーズ3: 投票機能
1. **投票API実装** (`webapp/src/app/api/clusters/[id]/vote/`)
2. **VotingSection実装** (`webapp/src/components/Voting/`)
3. **既存ページに統合** (`webapp/src/app/cluster/[id]/page.tsx`)

### フェーズ4: コメント機能
1. **コメントAPI実装** (`webapp/src/app/api/clusters/[id]/comments/`)
2. **CommentsSection実装** (`webapp/src/components/Comments/`)
3. **2カラムレイアウト実装**

### フェーズ5: コメント投票機能
1. **コメント投票API実装** (`webapp/src/app/api/comments/[id]/vote/`)
2. **CommentCard実装** (`webapp/src/components/Comments/`)
3. **Good/Bad投票UI実装**

### フェーズ6: 最適化
1. **SWRでデータフェッチ最適化**
2. **楽観的更新実装**
3. **エラーハンドリング強化**
4. **リアルタイム更新（Supabase Realtime）**

## 重要な実装ポイント

### 1. 既存コードとの統合
- **既存の型定義**: `webapp/src/types/hierarchical.ts`を拡張
- **既存のデータローダー**: `webapp/src/lib/hierarchicalData.ts`と連携
- **既存のスタイル**: Tailwind CSSクラスを統一

### 2. データ整合性
- **クラスタID**: 既存の`cluster.id`形式と一致させる
- **ユーザーID**: Supabase AuthのUUIDを使用
- **UNIQUE制約**: 重複投票・コメント防止

### 3. セキュリティ
- **RLS**: 必須設定、本人のみ編集可能
- **入力検証**: XSS対策でHTMLエスケープ
- **認証チェック**: API呼び出し時の認証状態確認

### 4. パフォーマンス
- **インデックス**: cluster_id, user_idにインデックス設定済み
- **SWR**: データキャッシュとリフェッチ最適化
- **楽観的更新**: UX向上のため即座にUI更新

## テスト要件

### 1. 機能テスト
- [ ] 投票機能（作成・更新・削除）
- [ ] コメント機能（作成・更新・削除）
- [ ] コメント投票機能（good/bad）
- [ ] 2カラムレイアウト表示
- [ ] 認証フロー

### 2. セキュリティテスト
- [ ] RLS動作確認
- [ ] 他ユーザーデータの編集不可確認
- [ ] XSS対策確認

### 3. パフォーマンステスト
- [ ] 大量コメント時の表示速度
- [ ] API応答時間
- [ ] リアルタイム更新動作

## 参考情報

### 既存のPR
- **PR #61**: クラスタ個別ページの基盤実装
- **ベースブランチ**: `main`
- **ブランチ命名**: `devin/{timestamp}-voting-commenting-feature`

### 関連ファイル
- **クラスタページ**: `webapp/src/app/cluster/[id]/page.tsx`
- **引数表示**: `webapp/src/app/cluster/[id]/ArgumentsDisplayClient.tsx`
- **型定義**: `webapp/src/types/hierarchical.ts`
- **Supabase設定**: `webapp/src/lib/supabase.ts`

### 開発環境
- **ローカル開発**: `npm run dev` (http://localhost:3000)
- **ビルド**: `npm run build`
- **リント**: ESLint + Prettier使用（team-mirai-volunteer組織の慣習）

## 完了条件

- [ ] 全てのデータベーステーブル作成完了
- [ ] 投票機能実装完了（作成・更新・削除）
- [ ] コメント機能実装完了（2カラムレイアウト）
- [ ] コメント投票機能実装完了（good/bad）
- [ ] 認証システム統合完了
- [ ] 既存クラスタページとの統合完了
- [ ] ESLint/Prettierチェック通過
- [ ] ローカルテスト完了
- [ ] CI/CDパイプライン通過

## 注意事項

1. **既存機能への影響**: 既存のクラスタ表示機能を壊さないよう注意
2. **レスポンシブ対応**: モバイル表示での2カラムレイアウト調整
3. **アクセシビリティ**: スクリーンリーダー対応
4. **国際化**: 将来的な多言語対応を考慮した実装
5. **データ移行**: 既存データとの整合性確保

---

**実装者へのメッセージ**: この仕様書に基づいて段階的に実装を進めてください。不明な点があれば、設計書（`docs/voting-commenting-design.md`）も参照してください。実装中に仕様の変更が必要な場合は、チームで相談の上、このIssueを更新してください。
