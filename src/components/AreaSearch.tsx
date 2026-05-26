'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AREAS, CATEGORIES } from '@/lib/constants';

interface Props {
  defaultArea?: string;
  defaultCategory?: string;
  onSubmit?: () => void;
}

export default function AreaSearch({ defaultArea = '', defaultCategory = '', onSubmit }: Props) {
  const router = useRouter();
  const [selectedArea, setSelectedArea] = useState(defaultArea);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArea) {
      alert('지역을 선택해주세요');
      return;
    }
    const params = new URLSearchParams({ type: 'area', area: selectedArea });
    if (selectedCategory) params.set('category', selectedCategory);
    router.push(`/search?${params.toString()}`);
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">지역 선택</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {AREAS.map((area) => (
            <button
              key={area.code}
              type="button"
              onClick={() => setSelectedArea(area.code)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                selectedArea === area.code
                  ? 'border-brand bg-brand-soft text-brand-dark font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {area.name}
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

      <div className="flex justify-center pt-4">
        <button
          type="submit"
          className="px-8 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors"
        >
          검색하기
        </button>
      </div>
    </form>
  );
}
