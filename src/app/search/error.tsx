'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Search error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center bg-white rounded-2xl shadow-lg p-8">
        <div className="text-6xl mb-4">🐾</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">검색 중 오류가 발생했어요</h2>
        <p className="text-gray-600 mb-6 text-sm">
          잠시 후 다시 시도해주세요. 문제가 계속되면 검색 조건을 바꿔보세요.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2.5 bg-brand text-white rounded-lg font-semibold hover:bg-brand-dark"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
