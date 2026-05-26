'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface Props {
  mapX: string;
  mapY: string;
  title: string;
  address?: string;
}

const APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
const SDK_SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_KEY}&autoload=false`;

export default function LocationMap({ mapX, mapY, title, address }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const lng = parseFloat(mapX);
  const lat = parseFloat(mapY);
  const hasCoords = Number.isFinite(lng) && Number.isFinite(lat);

  const initMap = useCallback(() => {
    if (initialized.current || !containerRef.current || !hasCoords) return;
    if (!window.kakao?.maps) return;

    window.kakao.maps.load(() => {
      const center = new window.kakao.maps.LatLng(lat, lng);
      const map = new window.kakao.maps.Map(containerRef.current!, {
        center,
        level: 4,
        draggable: true,
      });
      new window.kakao.maps.Marker({ position: center, map });
      const zoomControl = new window.kakao.maps.ZoomControl();
      map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      initialized.current = true;
    });
  }, [lat, lng, hasCoords]);

  useEffect(() => {
    if (window.kakao?.maps) initMap();
  }, [initMap]);

  if (!hasCoords) {
    return (
      <div className="rounded-2xl bg-stone-100 h-64 flex items-center justify-center text-stone-400 text-sm">
        지도 정보 없음
      </div>
    );
  }

  const externalHref = `https://map.kakao.com/link/map/${encodeURIComponent(title)},${lat},${lng}`;
  const directionsHref = `https://map.kakao.com/link/to/${encodeURIComponent(title)},${lat},${lng}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-stone-200 bg-stone-100">
      <Script
        src={SDK_SRC}
        strategy="afterInteractive"
        onLoad={initMap}
        onError={() => setError('지도를 불러올 수 없습니다')}
      />
      <div className="relative">
        <div ref={containerRef} className="w-full h-72" />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-50 text-sm text-stone-500">
            {error}
          </div>
        )}
      </div>
      <div className="bg-white px-5 py-4 border-t border-stone-200 flex items-start justify-between gap-3">
        <div className="min-w-0 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-stone-400 mt-0.5 shrink-0" strokeWidth={2} />
          <div className="min-w-0">
            <div className="text-xs font-medium text-stone-500 mb-0.5">주소</div>
            <div className="text-sm text-stone-900 truncate">{address || '주소 정보 없음'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={directionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            길찾기
          </a>
          <a
            href={externalHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-brand hover:bg-brand-dark transition-colors"
          >
            지도 열기 →
          </a>
        </div>
      </div>
    </div>
  );
}
