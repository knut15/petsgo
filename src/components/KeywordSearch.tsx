'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, POPULAR_KEYWORDS } from '@/lib/constants';

interface Props {
  defaultKeyword?: string;
  defaultCategory?: string;
  onSubmit?: () => void;
}

export default function KeywordSearch({
  defaultKeyword = '',
  defaultCategory = '',
  onSubmit,
}: Props) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(defaultKeyword);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);

  const pushSearch = (q: string, category: string) => {
    const params = new URLSearchParams({ type: 'keyword', q });
    if (category) params.set('category', category);
    router.push(`/search?${params.toString()}`);
    onSubmit?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = keyword.trim();
    if (!term) {
      alert('검색어를 입력해주세요');
      return;
    }
    pushSearch(term, selectedCategory);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">검색어 입력</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="예: 애견카페, 펜션, 공원 등"
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
          >
            검색
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">인기 검색어</label>
        <div className="flex flex-wrap gap-2">
          {POPULAR_KEYWORDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKeyword(k);
                pushSearch(k, selectedCategory);
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">카테고리 선택</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id || 'all'}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedCategory === category.id
                  ? 'border-brand bg-brand-soft text-brand-dark font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
