import 'server-only';

import type {
  ApiResponse,
  PlaceItem,
  DetailCommon,
  DetailPetTour,
  DetailImage,
  DetailIntroAccommodation,
  AreaCode,
} from '@/types/api';

const BASE_URL = 'https://apis.data.go.kr/B551011/KorPetTourService2';
const API_KEY = process.env.API_KEY;

interface CommonParams {
  MobileOS?: string;
  MobileApp?: string;
  _type?: string;
  serviceKey?: string;
  numOfRows?: number;
  pageNo?: number;
}

const getCommonParams = (customParams: CommonParams = {}): CommonParams => ({
  MobileOS: 'ETC',
  MobileApp: 'PetTravel',
  _type: 'json',
  serviceKey: API_KEY,
  numOfRows: 10,
  pageNo: 1,
  ...customParams,
});

const buildUrl = (endpoint: string, params: Record<string, any>): string => {
  const queryParams: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // serviceKey는 이미 인코딩되어 있으므로 그대로 사용
      if (key === 'serviceKey') {
        queryParams.push(`${key}=${value}`);
      } else {
        queryParams.push(`${key}=${encodeURIComponent(String(value))}`);
      }
    }
  });

  return `${BASE_URL}${endpoint}?${queryParams.join('&')}`;
};

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNo: number;
  numOfRows: number;
}

const fetchApiPaged = async <T>(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<PagedResult<T>> => {
  const allParams = { ...getCommonParams(), ...params };
  const url = buildUrl(endpoint, allParams);

  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) {
    throw new Error(`KorPetTourService ${response.status}: ${endpoint}`);
  }

  const raw: any = await response.json();

  // v2 returns flat { resultCode, resultMsg } on parameter validation errors
  if (raw && typeof raw === 'object' && 'resultCode' in raw && !('response' in raw)) {
    throw new Error(`KorPetTourService ${raw.resultCode}: ${raw.resultMsg}`);
  }

  const data: ApiResponse<T> = raw;
  const code = data.response.header.resultCode;

  if (code === '0003') {
    return { items: [], totalCount: 0, pageNo: Number(allParams.pageNo) || 1, numOfRows: Number(allParams.numOfRows) || 10 };
  }
  if (code !== '0000') {
    throw new Error(`KorPetTourService ${code}: ${data.response.header.resultMsg}`);
  }

  const body = data.response.body;
  // v2 returns items as empty string when empty, instead of {item: []}
  const items = typeof body.items === 'object' && body.items?.item ? body.items.item : [];
  return {
    items,
    totalCount: body.totalCount ?? 0,
    pageNo: body.pageNo ?? (Number(allParams.pageNo) || 1),
    numOfRows: body.numOfRows ?? (Number(allParams.numOfRows) || 10),
  };
};

const fetchApi = async <T>(endpoint: string, params: Record<string, any> = {}): Promise<T[]> => {
  const result = await fetchApiPaged<T>(endpoint, params);
  return result.items;
};

// 지역 코드 조회
export const getAreaCodes = async (): Promise<AreaCode[]> => {
  return fetchApi<AreaCode>('/areaCode2', {});
};

// 지역 기반 검색
export const searchByArea = async (params: {
  areaCode?: string;
  contentTypeId?: string;
  numOfRows?: number;
  pageNo?: number;
}): Promise<PagedResult<PlaceItem>> => {
  return fetchApiPaged<PlaceItem>('/areaBasedList2', params);
};

// 위치 기반 검색
export const searchByLocation = async (params: {
  mapX: string;
  mapY: string;
  radius?: string;
  contentTypeId?: string;
  numOfRows?: number;
  pageNo?: number;
}): Promise<PagedResult<PlaceItem>> => {
  return fetchApiPaged<PlaceItem>('/locationBasedList2', params);
};

// 키워드 검색
export const searchByKeyword = async (params: {
  keyword: string;
  contentTypeId?: string;
  areaCode?: string;
  numOfRows?: number;
  pageNo?: number;
}): Promise<PagedResult<PlaceItem>> => {
  return fetchApiPaged<PlaceItem>('/searchKeyword2', params);
};

// 상세 정보 - 공통
export const getDetailCommon = async (contentId: string): Promise<DetailCommon | null> => {
  const results = await fetchApi<DetailCommon>('/detailCommon2', { contentId });
  return results[0] || null;
};

// 상세 정보 - 반려동물 정보
export const getDetailPetTour = async (contentId: string): Promise<DetailPetTour | null> => {
  const results = await fetchApi<DetailPetTour>('/detailPetTour2', {
    contentId,
  });
  return results[0] || null;
};

// 상세 정보 - 이미지
export const getDetailImages = async (contentId: string): Promise<DetailImage[]> => {
  return fetchApi<DetailImage>('/detailImage2', { contentId });
};

// 상세 정보 - 소개 정보 (숙박)
export const getDetailIntro = async (
  contentId: string,
  contentTypeId: string
): Promise<DetailIntroAccommodation | null> => {
  const results = await fetchApi<DetailIntroAccommodation>('/detailIntro2', {
    contentId,
    contentTypeId,
  });
  return results[0] || null;
};

// 반려동물 여행 정보 동기화 목록
export const getPetTourSyncList = async (params: {
  numOfRows?: number;
  pageNo?: number;
  syncModTime?: string;
}): Promise<PlaceItem[]> => {
  return fetchApi<PlaceItem>('/petTourSyncList2', params);
};
