export const AREAS = [
  { code: '1', name: '서울' },
  { code: '2', name: '인천' },
  { code: '3', name: '대전' },
  { code: '4', name: '대구' },
  { code: '5', name: '광주' },
  { code: '6', name: '부산' },
  { code: '7', name: '울산' },
  { code: '8', name: '세종시' },
  { code: '31', name: '경기도' },
  { code: '32', name: '강원도' },
  { code: '33', name: '충청북도' },
  { code: '34', name: '충청남도' },
  { code: '35', name: '경상북도' },
  { code: '36', name: '경상남도' },
  { code: '37', name: '전라북도' },
  { code: '38', name: '전라남도' },
  { code: '39', name: '제주도' },
] as const;

export const CATEGORIES = [
  { id: '', name: '전체', icon: '🐾' },
  { id: '12', name: '관광지', icon: '🏞️' },
  { id: '14', name: '문화시설', icon: '🎭' },
  { id: '15', name: '축제/공연/행사', icon: '🎉' },
  { id: '28', name: '레포츠', icon: '⚽' },
  { id: '32', name: '숙박', icon: '🏨' },
  { id: '38', name: '쇼핑', icon: '🛍️' },
  { id: '39', name: '음식점', icon: '🍽️' },
] as const;

export const RADIUS_OPTIONS = [
  { value: '1000', label: '1km' },
  { value: '3000', label: '3km' },
  { value: '5000', label: '5km' },
  { value: '10000', label: '10km' },
  { value: '20000', label: '20km' },
] as const;

export const POPULAR_KEYWORDS = [
  '애견카페',
  '펜션',
  '공원',
  '해변',
  '캠핑',
  '산책로',
  '호텔',
  '레스토랑',
] as const;

export const PAGE_SIZE = 30;

export const getCategoryName = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.name ?? '기타';

export const getCategoryIcon = (id: string) =>
  CATEGORIES.find((c) => c.id === id)?.icon ?? '📍';

export const getAreaName = (code: string) =>
  AREAS.find((a) => a.code === code)?.name ?? code;
