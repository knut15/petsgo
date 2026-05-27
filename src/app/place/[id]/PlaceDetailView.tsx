'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { usePlaceDetailQuery } from '@/lib/queries';
import UserMenu from '@/components/UserMenu';
import LikeButton from '@/components/LikeButton';
import MemoSection from '@/components/MemoSection';
import { getCategoryName, getCategoryIcon } from '@/lib/constants';
import ImageGallery from '@/components/ImageGallery';
import FavoriteButton from '@/components/FavoriteButton';
import AboutExpandable from '@/components/AboutExpandable';
import LocationMap from '@/components/LocationMap';
import AttributeGrid, { type Attribute } from '@/components/AttributeGrid';

const stripTags = (s?: string | null) => s?.replace(/<[^>]*>/g, '').trim() ?? '';

export default function PlaceDetailView({ id }: { id: string }) {
  const { data, isLoading, isError } = usePlaceDetailQuery(id);

  if (isLoading) return <PlaceDetailSkeleton />;
  if (isError) return <PlaceDetailError />;
  if (!data) {
    notFound();
  }

  const { common, pet, imageList, intro } = data;
  const images = imageList.map((img) => img.originimgurl).filter(Boolean);
  if (common.firstimage && !images.includes(common.firstimage)) {
    images.unshift(common.firstimage);
  }

  const categoryName = getCategoryName(common.contenttypeid);
  const categoryIcon = getCategoryIcon(common.contenttypeid);
  const address = [common.addr1, common.addr2].filter(Boolean).join(' ');
  const homepage = stripTags(common.homepage);
  const overview = stripTags(common.overview);
  const isLodging = common.contenttypeid === '32';

  const facilities: string[] = [];
  if (intro?.parkinglodging) facilities.push('주차장');
  if (intro?.barbecue === '가능' || intro?.barbecue === '1') facilities.push('바비큐');
  if (intro?.fitness === '있음' || intro?.fitness === '1') facilities.push('피트니스');
  if (intro?.sauna === '있음' || intro?.sauna === '1') facilities.push('사우나');
  if (intro?.publicbath === '있음' || intro?.publicbath === '1') facilities.push('대욕장');
  if (intro?.bicycle === '있음' || intro?.bicycle === '1') facilities.push('자전거');
  if (intro?.campfire === '가능' || intro?.campfire === '1') facilities.push('캠프파이어');
  if (intro?.seminar === '있음' || intro?.seminar === '1') facilities.push('세미나실');
  if (intro?.sports === '있음' || intro?.sports === '1') facilities.push('스포츠시설');

  const attributes: Attribute[] = [
    { icon: categoryIcon, label: '카테고리', value: categoryName },
  ];
  if (pet?.acmpyTypeCd) {
    attributes.push({ icon: '🐕', label: '동반 가능 구역', value: pet.acmpyTypeCd });
  }
  if (pet?.acmpyPsblCpam) {
    attributes.push({ icon: '⚖️', label: '동반 가능 조건', value: pet.acmpyPsblCpam });
  }
  if (isLodging && intro?.roomcount) {
    attributes.push({ icon: '🚪', label: '객실 수', value: `${intro.roomcount}실` });
  }
  if (isLodging && intro?.checkintime) {
    attributes.push({ icon: '🕒', label: '체크인', value: intro.checkintime });
  }
  if (isLodging && intro?.checkouttime) {
    attributes.push({ icon: '🕒', label: '체크아웃', value: intro.checkouttime });
  }
  if (intro?.parkinglodging) {
    const parking =
      intro.parkinglodging.length > 24
        ? `${intro.parkinglodging.slice(0, 24)}…`
        : intro.parkinglodging;
    attributes.push({ icon: '🅿️', label: '주차', value: parking });
  }

  const petRows: Array<{ label: string; value: string }> = [];
  if (pet?.acmpyPsblCpam) petRows.push({ label: '동반 조건', value: pet.acmpyPsblCpam });
  if (pet?.acmpyNeedMtr)
    petRows.push({ label: '필요 사항', value: stripTags(pet.acmpyNeedMtr) });
  if (pet?.relaAcdntRiskMtr)
    petRows.push({ label: '사고 위험', value: stripTags(pet.relaAcdntRiskMtr) });
  if (pet?.etcAcmpyInfo)
    petRows.push({ label: '기타 정보', value: stripTags(pet.etcAcmpyInfo) });
  if (pet?.relaPosesFclty)
    petRows.push({ label: '동반 시설', value: stripTags(pet.relaPosesFclty) });

  const headline = pet?.acmpyTypeCd ?? (pet ? '반려동물 동반 가능' : '정보 미등록');

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm text-stone-500 min-w-0">
            <Link href="/" className="hover:text-stone-900">홈</Link>
            <span>/</span>
            <Link href="/search" className="hover:text-stone-900">검색</Link>
            <span>/</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-stone-900 font-medium">
              <span>{categoryIcon}</span>
              {categoryName}
            </span>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <UserMenu size="sm" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 lg:mb-8">
          <ImageGallery images={images} alt={common.title} fallbackIcon={categoryIcon} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <div className="text-sm text-stone-500 mb-1">{categoryName}</div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
                    {common.title}
                  </h1>
                  <p className="text-sm text-stone-500">📍 {address || '주소 정보 없음'}</p>
                </div>
                {images.length > 0 && (
                  <div className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-100 text-xs font-medium text-stone-700">
                    사진 {images.length}장
                  </div>
                )}
              </div>
              <AttributeGrid items={attributes} />
            </section>

            {overview && (
              <section className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-stone-900 mb-4">장소 소개</h2>
                <AboutExpandable text={overview} />
              </section>
            )}

            {facilities.length > 0 && (
              <section className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8">
                <h2 className="text-lg font-bold text-stone-900 mb-4">편의시설</h2>
                <div className="flex flex-wrap gap-2">
                  {facilities.map((f) => (
                    <span
                      key={f}
                      className="px-4 py-2 bg-stone-100 text-stone-700 rounded-full text-sm"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8">
              <h2 className="text-lg font-bold text-stone-900 mb-4">위치</h2>
              <LocationMap
                mapX={common.mapx}
                mapY={common.mapy}
                title={common.title}
                address={address}
              />
            </section>

            <MemoSection contentId={id} />
          </div>

          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              <section className="bg-white rounded-2xl border border-stone-200 p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">반려동물 동반 정보</h2>

                <div className="rounded-xl border border-stone-200 p-5 mb-4">
                  <div className="text-xs text-stone-500 mb-1">동반 가능 여부</div>
                  <div className="text-2xl font-bold text-brand leading-tight">
                    {headline}
                  </div>
                </div>

                {petRows.length > 0 && (
                  <dl className="rounded-xl border border-stone-200 px-5 py-2 mb-5 divide-y divide-dashed divide-stone-200">
                    {petRows.map((row) => (
                      <div
                        key={row.label}
                        className="flex items-start justify-between gap-3 py-3"
                      >
                        <dt className="text-sm text-stone-500 shrink-0">{row.label}</dt>
                        <dd className="text-sm text-stone-900 text-right font-medium">
                          {row.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="space-y-2">
                  <FavoriteButton
                    variant="block"
                    snapshot={{
                      contentid: id,
                      title: common.title,
                      addr1: common.addr1,
                      firstimage: common.firstimage,
                      contenttypeid: common.contenttypeid,
                    }}
                  />
                  <div className="flex justify-center">
                    <LikeButton contentId={id} />
                  </div>
                  {common.tel && (
                    <a
                      href={`tel:${common.tel}`}
                      className="block w-full text-center px-5 py-3 rounded-xl border border-stone-300 text-stone-800 font-semibold hover:bg-stone-50 transition-colors"
                    >
                      📞 {common.tel}
                    </a>
                  )}
                </div>
              </section>

              {homepage && (
                <section className="bg-white rounded-2xl border border-stone-200 p-6">
                  <h2 className="text-lg font-bold text-stone-900 mb-4">홈페이지</h2>
                  <a
                    href={homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-5 py-3 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors"
                  >
                    공식 사이트 방문 →
                  </a>
                </section>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PlaceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="h-5 w-48 bg-stone-200 rounded animate-pulse" />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 lg:mb-8 h-64 sm:h-[400px] lg:h-[460px] bg-stone-200 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[200, 140, 220].map((h, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8"
              >
                <div className="h-6 w-32 bg-stone-200 rounded mb-4 animate-pulse" />
                <div
                  className="bg-stone-100 rounded animate-pulse"
                  style={{ height: `${h}px` }}
                />
              </div>
            ))}
          </div>
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-4">
              <div className="h-6 w-40 bg-stone-200 rounded animate-pulse" />
              <div className="h-24 bg-stone-100 rounded-xl animate-pulse" />
              <div className="h-32 bg-stone-100 rounded-xl animate-pulse" />
              <div className="h-12 bg-stone-200 rounded-xl animate-pulse" />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PlaceDetailError() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center bg-white rounded-2xl border border-stone-200 p-8">
        <div className="text-5xl mb-4">🐾</div>
        <h2 className="text-xl font-semibold text-stone-900 mb-2">장소 정보를 불러올 수 없어요</h2>
        <p className="text-stone-600 mb-6 text-sm">잠시 후 다시 시도해주세요.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
