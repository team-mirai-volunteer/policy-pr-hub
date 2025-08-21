# 人間が行うべき作業項目

## Supabase環境のセットアップ

### 1. 新しいSupabaseプロジェクトの作成
- [Supabase Dashboard](https://supabase.com/dashboard)にアクセス
- 新しいプロジェクトを作成
- プロジェクト名: `policy-pr-hub-voting` (推奨)
- リージョン: 適切なリージョンを選択

### 2. データベーススキーマの実行
- Supabase DashboardのSQL Editorにアクセス
- `webapp/src/lib/database.sql`の内容をコピー&ペースト
- SQLを実行してテーブルとポリシーを作成

### 3. 環境変数の設定
以下の環境変数を`.env.local`ファイルに追加:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 認証設定
- Supabase DashboardのAuthenticationセクションにアクセス
- Email認証を有効化
- 必要に応じてソーシャルログインプロバイダーを設定

### 5. Row Level Security (RLS) の確認
- データベーススキーマ実行後、RLSポリシーが正しく適用されていることを確認
- テストユーザーでの動作確認

## デプロイメント設定

### 1. Vercel環境変数
- Vercelプロジェクト設定で上記の環境変数を設定
- 本番環境とプレビュー環境の両方に設定

### 2. 本番環境でのテスト
- デプロイ後、投票・コメント機能の動作確認
- 認証フローの確認
- データベース接続の確認

## 開発環境での確認事項

### 1. 依存関係の確認
```bash
cd webapp
npm install
```

### 2. TypeScript型チェック
```bash
npm run build
```

### 3. ESLint実行
```bash
npm run lint
```

### 4. ローカル開発サーバー起動
```bash
npm run dev
```

### 5. 機能テスト
- クラスタページでの投票機能
- コメント投稿機能
- コメントへの投票機能
- 認証フロー（ログイン・ログアウト）

## 現在のCI/CD状況

### Vercelデプロイメント失敗について
- **現在の状況**: Vercelデプロイメントが失敗しています
- **原因**: Supabase環境変数（`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`）がVercel環境で設定されていないため
- **ローカルビルド**: 正常に動作します（モッククライアントを使用）
- **解決方法**: Supabase環境を作成後、Vercelの環境変数設定でSupabase認証情報を追加する必要があります

### 対応が必要な作業
1. Supabase環境の作成（上記の手順に従って）
2. Vercelプロジェクト設定で環境変数を追加:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Vercelでの再デプロイメント実行

## 注意事項

- 既存のSupabase環境は使用しないこと
- 新しい環境でのテストを十分に行うこと
- 本番環境では適切なセキュリティ設定を確認すること
- データベースのバックアップ設定を検討すること
