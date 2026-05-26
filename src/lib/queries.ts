import { useQuery } from '@tanstack/react-query';
import type { PagedResult } from './api';
import type {
  PlaceItem,
  DetailCommon,
  DetailPetTour,
  DetailImage,
  DetailIntroAccommodation,
} from '@/types/api';

export type SearchType = 'area' | 'location' | 'keyword';

export interface SearchParams {
  type: SearchType;
  area?: string;
  category?: string;
  mapX?: string;
  mapY?: string;
  radius?: string;
  q?: string;
  page: number;
}

export type SearchResult = PagedResult<PlaceItem & { distance?: number }>;

export interface PlaceDetailData {
  common: DetailCommon;
  pet: DetailPetTour | null;
  imageList: DetailImage[];
  intro: DetailIntroAccommodation | null;
}

export function normalizeSearchParams(sp: {
  type?: string;
  area?: string;
  category?: string;
  mapX?: string;
  mapY?: string;
  radius?: string;
  q?: string;
  page?: string;
}): SearchParams | null {
  const page = Math.max(1, Number(sp.page) || 1);
  const category = sp.category || '';

  if (sp.type === 'area' && sp.area) {
    return { type: 'area', area: sp.area, category, page };
  }
  if (sp.type === 'location' && sp.mapX && sp.mapY) {
    return {
      type: 'location',
      mapX: sp.mapX,
      mapY: sp.mapY,
      radius: sp.radius || '5000',
      category,
      page,
    };
  }
  if (sp.type === 'keyword' && sp.q) {
    return { type: 'keyword', q: sp.q, category, page };
  }
  return null;
}

export const searchQueryKey = (p: SearchParams) => ['search', p] as const;
export const placeQueryKey = (id: string) => ['place', id] as const;

function buildSearchUrl(p: SearchParams): string {
  const sp = new URLSearchParams({ type: p.type, page: String(p.page) });
  if (p.category) sp.set('category', p.category);
  if (p.type === 'area' && p.area) sp.set('area', p.area);
  if (p.type === 'location' && p.mapX && p.mapY) {
    sp.set('mapX', p.mapX);
    sp.set('mapY', p.mapY);
    if (p.radius) sp.set('radius', p.radius);
  }
  if (p.type === 'keyword' && p.q) sp.set('q', p.q);
  return `/api/search?${sp.toString()}`;
}

export function useSearchQuery(p: SearchParams | null) {
  return useQuery({
    queryKey: p ? searchQueryKey(p) : ['search', null],
    queryFn: async (): Promise<SearchResult> => {
      if (!p) throw new Error('no params');
      const res = await fetch(buildSearchUrl(p));
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `search failed (${res.status})`);
      }
      return res.json();
    },
    enabled: p !== null,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlaceDetailQuery(id: string) {
  return useQuery({
    queryKey: placeQueryKey(id),
    queryFn: async (): Promise<PlaceDetailData> => {
      const res = await fetch(`/api/place/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `place fetch failed (${res.status})`);
      }
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}
