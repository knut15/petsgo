'use client';

import Link from 'next/link';
import { useFavorites, useHasMounted } from '@/lib/useFavorites';
import PlaceCard from '@/components/PlaceCard';
import EmptyState from '@/components/EmptyState';
import UserMenu from '@/components/UserMenu';

export default function FavoritesPage() {
  const mounted = useHasMounted();
  const { list } = useFavorites();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-50 border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
            <span className="text-2xl">🐕</span>
            <span className="font-bold text-stone-900">PetTrip</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
              홈으로
            </Link>
            <UserMenu size="sm" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="text-sm text-rose-500 font-medium mb-1">즐겨찾기</div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">내 즐겨찾기</h1>
            {mounted && (
              <span className="text-stone-500">총 {list.length.toLocaleString()}건</span>
            )}
          </div>
        </div>

        {!mounted ? (
          <ResultsSkeleton />
        ) : list.length === 0 ? (
          <EmptyState
            title="아직 즐겨찾기가 없어요"
            description="장소 카드의 하트 버튼으로 즐겨찾기에 추가할 수 있어요."
            actionLabel="장소 찾으러 가기"
            actionHref="/"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((fav) => (
              <PlaceCard
                key={fav.contentid}
                place={{
                  contentid: fav.contentid,
                  title: fav.title,
                  addr1: fav.addr1 ?? '',
                  firstimage: fav.firstimage,
                  contenttypeid: fav.contenttypeid ?? '',
                  mapx: '',
                  mapy: '',
                }}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="h-48 bg-stone-100 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 w-20 bg-stone-200 rounded animate-pulse" />
            <div className="h-5 w-3/4 bg-stone-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-stone-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
