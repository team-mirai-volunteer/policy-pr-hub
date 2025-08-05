import type { Result } from "../types/kouchou";

interface OverviewProps {
  result: Result;
}

export function Overview({ result }: OverviewProps) {
  return (
    <div className="mx-auto max-w-3xl mb-8">
      <h2 className="text-left text-xl mb-5">
        レポート
      </h2>
      <h1 className="text-4xl mb-2 font-bold text-blue-600">
        {result.config.question}
      </h1>
      <div className="font-bold text-xl mb-2 flex items-center">
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {result.arguments.length.toLocaleString()}件
      </div>
      <p className="text-gray-700">{result.overview}</p>
    </div>
  );
}
