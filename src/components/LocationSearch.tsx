'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, RADIUS_OPTIONS } from '@/lib/constants';

interface Props {
  defaultCategory?: string;
  defaultRadius?: string;
  onSubmit?: () => void;
}

export default function LocationSearch({
  defaultCategory = '',
  defaultRadius = '5000',
  onSubmit,
}: Props) {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategory);
  const [radius, setRadius] = useState(defaultRadius);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsGettingLocation(false);
      },
      () => {
        alert('위치 정보를 가져올 수 없습니다. 위치 권한을 확인해주세요.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert('현재 위치를 먼저 가져와주세요');
      return;
    }
    const params = new URLSearchParams({
      type: 'location',
      mapX: location.lng.toString(),
      mapY: location.lat.toString(),
      radius,
    });
    if (selectedCategory) params.set('category', selectedCategory);
    router.push(`/search?${params.toString()}`);
    onSubmit?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">현재 위치</label>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isGettingLocation ? '위치 가져오는 중...' : '현재 위치 가져오기'}
          </button>
          {location && (
            <div className="text-sm text-gray-600">
              위도: {location.lat.toFixed(6)}, 경도: {location.lng.toFixed(6)}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">검색 반경</label>
        <div className="flex gap-2 flex-wrap">
          {RADIUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRadius(option.value)}
              className={`px-4 py-2 rounded-lg border-2 transition-all ${
                radius === option.value
                  ? 'border-brand bg-brand-soft text-brand-dark font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {option.label}
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
          disabled={!location}
          className="px-8 py-3 bg-brand text-white font-semibold rounded-lg hover:bg-brand-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          검색하기
        </button>
      </div>
    </form>
  );
}
