# ダークモード実装ガイド

このドキュメントでは、Policy PR Hubにおけるダークモード実装のアプローチと今後の開発における最適な実装方法について説明します。

## 概要

Policy PR Hubでは、CSS変数システムを使用してダークモード対応を実現しています。このアプローチにより、システムの設定（`prefers-color-scheme`）とChakra UIのカラーモード切り替えの両方に対応しています。

## CSS変数システム

### 基本構造

`webapp/src/app/globals.css`にて、以下の構造でCSS変数を定義しています：

```css
:root {
  /* ライトモードの色定義 */
  --background: #ffffff;
  --foreground: #171717;
  --text-primary: #111827;
  /* ... その他の変数 */
}

/* システム設定によるダークモード */
@media (prefers-color-scheme: dark) {
  :root {
    /* ダークモードの色定義 */
    --background: #0a0a0a;
    --foreground: #ededed;
    --text-primary: #f9fafb;
    /* ... その他の変数 */
  }
}

/* Chakra UIによるダークモード */
:root:has(body.chakra-ui-dark) {
  /* ダークモードの色定義（上記と同じ） */
  --background: #0a0a0a;
  --foreground: #ededed;
  --text-primary: #f9fafb;
  /* ... その他の変数 */
}
```

### 利用可能なCSS変数クラス

以下のクラスが利用可能です：

#### テキスト色
- `.text-primary` - メインテキスト色
- `.text-secondary` - セカンダリテキスト色  
- `.text-muted` - 薄いテキスト色

#### 背景色
- `.card` - カード背景色
- `.blue-card` - 青系カード背景色
- `.green-card` - 緑系カード背景色
- `.purple-card` - 紫系カード背景色
- `.orange-card` - オレンジ系カード背景色

#### アクセント色
- `.blue-text` - 青系テキスト色
- `.blue-text-light` - 薄い青系テキスト色
- `.green-text` - 緑系テキスト色
- `.green-text-light` - 薄い緑系テキスト色
- `.purple-text` - 紫系テキスト色
- `.purple-text-light` - 薄い紫系テキスト色
- `.orange-text` - オレンジ系テキスト色
- `.orange-text-light` - 薄いオレンジ系テキスト色

#### その他
- `.code-bg` - コードブロック背景色
- `.card-border` - カード境界線色

## 実装のベストプラクティス

### ❌ 避けるべき実装

```tsx
// ハードコードされたTailwindクラス
<div className="text-gray-500">テキスト</div>
<button className="bg-blue-600 hover:bg-blue-700">ボタン</button>
<div className="border-gray-200">境界線</div>

// ハードコードされた色値
<div style={{ backgroundColor: '#f8f9fa' }}>背景</div>
<span style={{ color: '#6b7280' }}>テキスト</span>
```

### ✅ 推奨する実装

```tsx
// CSS変数クラスを使用
<div className="text-muted">テキスト</div>
<button className="blue-card hover:opacity-80 transition-opacity">ボタン</button>
<div className="card-border">境界線</div>

// CSS変数を直接使用
<div style={{ backgroundColor: 'var(--card-bg)' }}>背景</div>
<span className="text-secondary">テキスト</span>
```

## 新しいCSS変数クラスの追加

新しい色のパターンが必要な場合は、以下の手順で追加してください：

1. `globals.css`の`:root`セクションにライトモード用の変数を追加
2. `@media (prefers-color-scheme: dark)`セクションにダークモード用の変数を追加
3. `:root:has(body.chakra-ui-dark)`セクションにも同じダークモード用の変数を追加
4. 対応するCSSクラスを作成

例：
```css
:root {
  --red-bg: #fef2f2;
  --red-text: #dc2626;
}

@media (prefers-color-scheme: dark) {
  :root {
    --red-bg: rgba(220, 38, 38, 0.2);
    --red-text: #fca5a5;
  }
}

:root:has(body.chakra-ui-dark) {
  --red-bg: rgba(220, 38, 38, 0.2);
  --red-text: #fca5a5;
}

.red-card {
  background: var(--red-bg);
}

.red-text {
  color: var(--red-text);
}
```

## チャートコンポーネントでの対応

Plotly.jsなどのチャートライブラリを使用する場合は、以下のパターンを使用してください：

```tsx
// ダークモード検出
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

// レイアウト設定
const layout = {
  plot_bgcolor: 'var(--card-bg)',
  paper_bgcolor: 'var(--background)',
  font: { 
    color: 'var(--text-primary)',
    family: 'Arial, sans-serif' 
  },
  // その他の設定...
};
```

## テスト手順

ダークモード対応を実装した後は、以下の手順でテストしてください：

1. **システム設定テスト**
   - OSのダークモード設定を変更して動作確認
   - ブラウザの開発者ツールでメディアクエリをエミュレート

2. **Chakra UIテスト**（該当する場合）
   - アプリ内のダークモード切り替えボタンで動作確認

3. **視覚的確認**
   - すべてのテキストが読みやすいコントラストを持っているか
   - 背景色とテキスト色の組み合わせが適切か
   - ボタンやリンクのホバー状態が正しく動作するか

4. **コンソールエラー確認**
   - ブラウザのコンソールにエラーが出ていないか
   - CSS変数が正しく読み込まれているか

## トラブルシューティング

### よくある問題

1. **CSS変数が適用されない**
   - `:root:has()`セレクタがサポートされているブラウザか確認
   - Chakra UIのテーマ設定が正しく行われているか確認

2. **一部のコンポーネントでダークモードが効かない**
   - ハードコードされた色が残っていないか確認
   - CSS変数クラスが正しく適用されているか確認

3. **チャートの色が変わらない**
   - チャートライブラリの設定でCSS変数を使用しているか確認
   - 動的な色変更に対応しているか確認

## 参考実装

詳細な実装例については、以下のPRを参照してください：
- PR #57: 子クラスタ一覧ページのダークモード対応

## 今後の開発における注意点

- 新しいコンポーネントを作成する際は、最初からCSS変数クラスを使用する
- 既存のコンポーネントを修正する際は、ハードコードされた色がないか確認する
- デザインシステムに新しい色が必要な場合は、CSS変数として追加する
- テストは必ずライトモードとダークモードの両方で行う

このガイドに従うことで、一貫性のあるダークモード対応を実現し、将来的なメンテナンスを容易にすることができます。
