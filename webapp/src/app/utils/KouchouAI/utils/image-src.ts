/**
 * 静的エクスポート時のベースパスを取得する
 * @returns ベースパス (例: "/path" または "")
 */
export const getBasePath = (): string => {
  const isStaticExport = process.env.NEXT_PUBLIC_OUTPUT_MODE === "export";
  const basePath = process.env.NEXT_PUBLIC_STATIC_EXPORT_BASE_PATH || "";

  return isStaticExport ? basePath : "";
};

/**
 * パスを生成する
 * @param path パス (例: "/images/example.png")
 * @returns basePath付きのパス (例: "/path/images/example.png")
 */
export const getRelativeUrl = (path: string): string => {
  const basePath = getBasePath();

  // パスが / で始まることを確認し、先頭の / を除去
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;

  // basePathとパスを結合
  return `${basePath}/${cleanPath}`;
};

/**
 * サーバーから画像のURLを取得する
 * 絶対URLの場合はそのまま返し、相対パスの場合は環境に応じたベースパスを付与する
 *
 * @param src 画像のパス (例: "/images/example.png" または "https://example.com/image.png")
 * @returns 適切に処理された画像のパス
 */
export const getImageFromServerSrc = (src: string): string => {
  // 空文字列の場合は早期リターン
  if (!src) return "";

  try {
    // 絶対URLの場合はそのまま返す（有効なURLかどうかを検証）
    new URL(src);
    return src;
  } catch (error) {
    // 相対パスの場合の処理

    // 静的エクスポートモードの場合
    if (process.env.NEXT_PUBLIC_OUTPUT_MODE === "export") {
      const basePath = getBasePath();

      // パスが / で始まる場合は除去
      const cleanSrc = src.startsWith("/") ? src.substring(1) : src;

      // basePathとパスを結合
      return `${basePath}/${cleanSrc}`;
    }

    // 開発環境やサーバーサイドレンダリング時
    const basePath = process.env.NEXT_PUBLIC_API_BASEPATH || "";

    // パスが既にbasePathで始まっていないことを確認
    if (basePath && src.startsWith(basePath)) {
      return src;
    }

    // パスが / で始まることを確認
    const normalizedSrc = src.startsWith("/") ? src : `/${src}`;
    return `${basePath}${normalizedSrc}`;
  }
};
