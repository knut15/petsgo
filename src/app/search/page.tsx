import Link from 'next/link';
import { Suspense } from 'react';
import { Heart } from 'lucide-react';
import { searchByArea, searchByLocation, searchByKeyword, type PagedResult } from '@/lib/api';
import type { PlaceItem } from '@/types/api';
import { PAGE_SIZE, getAreaName, getCategoryName, RADIUS_OPTIONS } from '@/lib/constants';
import PlaceCard from '@/components/PlaceCard';
import SearchFilters from '@/components/SearchFilters';
import Pagination from '@/components/Pagination';
import EmptyState from '@/components/EmptyState';

type SearchType = 'area' | 'location' | 'keyword';

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

async function runSearch(sp: SP): Promise<PagedResult<PlaceItem & { distance?: number }> | null> {
  const type = sp.type as SearchType | undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const category = sp.category || undefined;

  if (type === 'area' && sp.area) {
    return searchByArea({
      areaCode: sp.area,
      contentTypeId: category,
      numOfRows: PAGE_SIZE,
      pageNo: page,
    });
  }

  if (type === 'location' && sp.mapX && sp.mapY) {
    const result = await searchByLocation({
      mapX: sp.mapX,
      mapY: sp.mapY,
      radius: sp.radius || '5000',
      contentTypeId: category,
      numOfRows: PAGE_SIZE,
      pageNo: page,
    });
    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        distance: item.dist ? Number(item.dist) : undefined,
      })),
    };
  }

  if (type === 'keyword' && sp.q) {
    return searchByKeyword({
      keyword: sp.q,
      contentTypeId: category,
      numOfRows: PAGE_SIZE,
      pageNo: page,
    });
  }

  return null;
}

function buildHeading(sp: SP): { title: string; subtitle?: string } {
  const category = sp.category ? getCategoryName(sp.category) : '전체';
  if (sp.type === 'area' && sp.area) {
    return { title: `${getAreaName(sp.area)} · ${category}`, subtitle: '지역 기반 검색' };
  }
  if (sp.type === 'location') {
    const r = RADIUS_OPTIONS.find((o) => o.value === (sp.radius || '5000'))?.label ?? `${sp.radius}m`;
    return { title: `내 주변 ${r} · ${category}`, subtitle: '위치 기반 검색' };
  }
  if (sp.type === 'keyword' && sp.q) {
    return { title: `"${sp.q}" · ${category}`, subtitle: '키워드 검색' };
  }
  return { title: '검색' };
}

async function Results({ sp }: { sp: SP }) {
  const heading = buildHeading(sp);
  const result = await runSearch(sp);

  if (!result) {
    return (
      <EmptyState
        title="검색 조건이 부족합니다"
        description="홈으로 돌아가 검색 조건을 다시 입력해주세요."
        actionLabel="홈으로"
        actionHref="/"
      />
    );
  }

  if (result.items.length === 0) {
    return (
      <>
        <SearchHeader heading={heading} totalCount={result.totalCount} />
        <SearchFilters sp={sp} />
        <EmptyState
          title="검색 결과가 없습니다"
          description="카테고리를 '전체'로 바꾸거나 다른 조건으로 검색해보세요."
          actionLabel="홈으로"
          actionHref="/"
        />
      </>
    );
  }

  const totalPages = Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE));

  return (
    <>
      <SearchHeader heading={heading} totalCount={result.totalCount} />
      <SearchFilters sp={sp} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {result.items.map((place) => (
          <PlaceCard key={place.contentid} place={place} />
        ))}
      </div>
      <Pagination currentPage={result.pageNo} totalPages={totalPages} sp={sp} />
    </>
  );
}

function SearchHeader({
  heading,
  totalCount,
}: {
  heading: { title: string; subtitle?: string };
  totalCount: number;
}) {
  return (
    <div className="mb-6">
      {heading.subtitle && (
        <div className="text-sm text-brand font-medium mb-1">{heading.subtitle}</div>
      )}
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">{heading.title}</h1>
        <span className="text-stone-500">총 {totalCount.toLocaleString()}건</span>
      </div>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-50 border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
            <span className="text-2xl">🐕</span>
            <span className="font-bold text-stone-900">PetTrip</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/favorites"
              aria-label="즐겨찾기"
              className="w-9 h-9 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50"
            >
              <Heart className="w-[18px] h-[18px]" strokeWidth={2.2} fill="currentColor" />
            </Link>
            <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
              새 검색
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Suspense key={JSON.stringify(sp)} fallback={<ResultsSkeleton />}>
          <Results sp={sp} />
        </Suspense>
      </main>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <div className="mb-6">
        <div className="h-4 w-24 bg-stone-200 rounded mb-2 animate-pulse" />
        <div className="h-8 w-64 bg-stone-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
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
    </>
  );
}
