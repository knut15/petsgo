'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThumbsUp } from 'lucide-react';
import { useLikes } from '@/lib/useLikes';

interface Props {
  contentId: string;
  variant?: 'inline' | 'compact';
}

export default function LikeButton({ contentId, variant = 'inline' }: Props) {
  const pathname = usePathname();
  const { count, liked, canLike, toggle, isPending } = useLikes(contentId);

  if (!canLike) {
    const next = encodeURIComponent(pathname || '/');
    return (
      <Link
        href={`/login?next=${next}`}
        className={
          variant === 'compact'
            ? 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-xs hover:bg-stone-200'
            : 'inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-50'
        }
      >
        <ThumbsUp className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} strokeWidth={2} />
        <span>{count.toLocaleString()}</span>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }}
        disabled={isPending}
        aria-pressed={liked}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors ${
          liked
            ? 'bg-brand text-white'
            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
        }`}
      >
        <ThumbsUp
          className="w-3.5 h-3.5"
          strokeWidth={2}
          fill={liked ? 'currentColor' : 'none'}
        />
        <span>{count.toLocaleString()}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle()}
      disabled={isPending}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
        liked
          ? 'bg-brand text-white hover:bg-brand-dark'
          : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-50'
      }`}
    >
      <ThumbsUp className="w-4 h-4" strokeWidth={2.2} fill={liked ? 'currentColor' : 'none'} />
      <span>좋아요</span>
      <span className="font-bold">{count.toLocaleString()}</span>
    </button>
  );
}
