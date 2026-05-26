import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import {
  searchByArea,
  searchByLocation,
  searchByKeyword,
  type PagedResult,
} from '@/lib/api';
import type { PlaceItem } from '@/types/api';
import { PAGE_SIZE } from '@/lib/constants';
import { normalizeSearchParams, searchQueryKey } from '@/lib/queries';
import SearchView from './SearchView';

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

type SearchResultWithDistance = PagedResult<PlaceItem & { distance?: number }>;

async function runServerSearch(
  normalized: NonNullable<ReturnType<typeof normalizeSearchParams>>
): Promise<SearchResultWithDistance | null> {
  const category = normalized.category || undefined;
  try {
    if (normalized.type === 'area' && normalized.area) {
      return await searchByArea({
        areaCode: normalized.area,
        contentTypeId: category,
        numOfRows: PAGE_SIZE,
        pageNo: normalized.page,
      });
    }
    if (normalized.type === 'location' && normalized.mapX && normalized.mapY) {
      const raw = await searchByLocation({
        mapX: normalized.mapX,
        mapY: normalized.mapY,
        radius: normalized.radius || '5000',
        contentTypeId: category,
        numOfRows: PAGE_SIZE,
        pageNo: normalized.page,
      });
      return {
        ...raw,
        items: raw.items.map((item) => ({
          ...item,
          distance: item.dist ? Number(item.dist) : undefined,
        })),
      };
    }
    if (normalized.type === 'keyword' && normalized.q) {
      return await searchByKeyword({
        keyword: normalized.q,
        contentTypeId: category,
        numOfRows: PAGE_SIZE,
        pageNo: normalized.page,
      });
    }
  } catch {
    return null;
  }
  return null;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const normalized = normalizeSearchParams(sp);

  const queryClient = new QueryClient();
  if (normalized) {
    const result = await runServerSearch(normalized);
    if (result) queryClient.setQueryData(searchQueryKey(normalized), result);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SearchView sp={sp} />
    </HydrationBoundary>
  );
}
