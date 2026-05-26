'use client';

import type { MouseEvent } from 'react';
import { Heart } from 'lucide-react';
import { useFavorites, useHasMounted, type Favorite } from '@/lib/useFavorites';

interface Props {
  snapshot: Omit<Favorite, 'addedAt'>;
  variant?: 'overlay' | 'inline' | 'block';
}

export default function FavoriteButton({ snapshot, variant = 'overlay' }: Props) {
  const mounted = useHasMounted();
  const { isFavorite, toggle } = useFavorites();
  const active = mounted && isFavorite(snapshot.contentid);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(snapshot);
  };

  const label = active ? '즐겨찾기 해제' : '즐겨찾기 추가';

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={active}
        className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md backdrop-blur transition-colors ${
          active
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : 'bg-white/90 text-stone-500 hover:bg-white hover:text-rose-500'
        }`}
      >
        <Heart
          className="w-[18px] h-[18px]"
          strokeWidth={2}
          fill={active ? 'currentColor' : 'none'}
        />
      </button>
    );
  }

  if (variant === 'block') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={active}
        className={`flex w-full items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold transition-colors ${
          active
            ? 'bg-rose-500 text-white hover:bg-rose-600'
            : 'bg-brand text-white hover:bg-brand-dark'
        }`}
      >
        <Heart
          className="w-5 h-5"
          strokeWidth={2.2}
          fill={active ? 'currentColor' : 'none'}
        />
        <span>{active ? '즐겨찾기에 저장됨' : '즐겨찾기에 추가'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${
        active
          ? 'bg-rose-500 text-white hover:bg-rose-600'
          : 'bg-white text-stone-700 border-2 border-stone-200 hover:border-rose-300 hover:text-rose-500'
      }`}
    >
      <Heart
        className="w-[18px] h-[18px]"
        strokeWidth={2}
        fill={active ? 'currentColor' : 'none'}
      />
      <span>{active ? '즐겨찾기 해제' : '즐겨찾기'}</span>
    </button>
  );
}
