'use client';

import { useRouter } from 'next/navigation';
import { CATEGORIES, RADIUS_OPTIONS } from '@/lib/constants';

interface SP {
  type?: string;
  area?: string;
  category?: string;
  mapX?: string;
  mapY?: string;
  radius?: string;
  q?: string;
  page?: string;
}

export default function SearchFilters({ sp }: { sp: SP }) {
  const router = useRouter();

  const update = (changes: Partial<SP>) => {
    const next = new URLSearchParams();
    const merged = { ...sp, ...changes, page: '1' };
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') next.set(k, String(v));
    });
    router.push(`/search?${next.toString()}`);
  };

  const currentCategory = sp.category ?? '';
  const currentRadius = sp.radius ?? '5000';

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-stone-500 mr-1">카테고리</span>
        {CATEGORIES.map((c) => (
          <button
            key={c.id || 'all'}
            type="button"
            onClick={() => update({ category: c.id || undefined })}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              currentCategory === c.id
                ? 'bg-brand text-white font-medium'
                : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {sp.type === 'location' && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-stone-500 mr-1">반경</span>
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => update({ radius: r.value })}
              className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                currentRadius === r.value
                  ? 'bg-brand text-white font-medium'
                  : 'bg-white text-stone-700 border border-stone-200 hover:border-stone-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
