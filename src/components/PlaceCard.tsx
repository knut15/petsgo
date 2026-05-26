import Link from 'next/link';
import type { PlaceItem } from '@/types/api';
import { getCategoryName, getCategoryIcon } from '@/lib/constants';
import FavoriteButton from './FavoriteButton';

interface Props {
  place: PlaceItem & { distance?: number };
}

export default function PlaceCard({ place }: Props) {
  const contentTypeId = place.contenttypeid;
  const categoryName = getCategoryName(contentTypeId);
  const categoryIcon = getCategoryIcon(contentTypeId);
  const address = [place.addr1, place.addr2].filter(Boolean).join(' ') || '주소 정보 없음';
  const image = place.firstimage || place.firstimage2;

  return (
    <Link
      href={`/place/${place.contentid}`}
      className="block bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-stone-300 transition-colors"
    >
      <div className="h-48 bg-stone-100 relative">
        {image ? (
          <img src={image} alt={place.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {categoryIcon}
          </div>
        )}
        <FavoriteButton
          snapshot={{
            contentid: place.contentid,
            title: place.title,
            addr1: place.addr1,
            firstimage: image,
            contenttypeid: place.contenttypeid,
          }}
        />
        {typeof place.distance === 'number' && (
          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {place.distance >= 1000
              ? `${(place.distance / 1000).toFixed(1)}km`
              : `${place.distance}m`}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-sm">{categoryIcon}</span>
          <span className="text-sm font-medium text-brand">{categoryName}</span>
        </div>

        <h3 className="text-lg font-semibold text-stone-900 mb-2 line-clamp-2">{place.title}</h3>

        <p className="text-sm text-stone-500 mb-2 line-clamp-1">📍 {address}</p>

        {place.tel && <p className="text-sm text-stone-500 mb-2">📞 {place.tel}</p>}
      </div>
    </Link>
  );
}
