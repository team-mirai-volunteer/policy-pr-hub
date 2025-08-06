import type { Meta } from "../types/kouchou";

interface ReporterProps {
  meta: Meta;
}

export function Reporter({ meta }: ReporterProps) {
  if (meta.isDefault) {
    return (
      <div className="flex flex-col gap-4 text-gray-600">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="flex flex-col justify-between text-gray-600">
            <div className="text-sm">レポーター</div>
            <div className="text-base font-bold">{meta.reporter}</div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          レポーター情報が未設定です。レポート作成者が
          <a
            href="https://github.com/digitaldemocracy2030/kouchou-ai/blob/main/README.md#%E3%83%A1%E3%82%BF%E3%83%87%E3%83%BC%E3%82%BF%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AE%E3%82%BB%E3%83%83%E3%83%88%E3%82%A2%E3%83%83%E3%83%97"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            メタデータをセットアップ
          </a>
          することでレポーター情報が表示されます。
        </div>
      </div>
    );
  }

  const truncatedMessage = meta.message.length > 55 
    ? meta.message.slice(0, 55) + "..." 
    : meta.message;

  return (
    <div className="flex flex-col gap-4 text-gray-600">
      <div className="flex flex-col md:flex-row md:items-center">
        <div className="flex flex-col justify-between text-gray-600">
          <div className="text-sm">レポーター</div>
          <div className="text-base font-bold">{meta.reporter}</div>
        </div>
      </div>
      <div className="text-sm text-gray-600 text-left whitespace-pre-line">
        {truncatedMessage}
      </div>
      <div className="flex gap-3 flex-wrap w-fit">
        {meta.webLink && (
          <a
            href={meta.webLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
            ウェブページ
          </a>
        )}
        {meta.privacyLink && (
          <a
            href={meta.privacyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            プライバシーポリシー
          </a>
        )}
        {meta.termsLink && (
          <a
            href={meta.termsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            利用規約
          </a>
        )}
      </div>
    </div>
  );
}
