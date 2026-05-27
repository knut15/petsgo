'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const VISIBLE_THUMBS = 4;

export default function ImageGallery({
  images,
  alt,
  fallbackIcon,
}: {
  images: string[];
  alt: string;
  fallbackIcon: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Sync index ← scroll position
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || images.length <= 1) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / el.clientWidth);
        setIndex((prev) => (prev === i ? prev : i));
        ticking = false;
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [images.length]);

  // Sync scroll position ← index (when thumbnail clicked)
  const scrollToIndex = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  }, []);

  if (images.length === 0) {
    return (
      <div className="overflow-hidden bg-stone-100 h-64 sm:h-[400px] lg:h-[460px] flex items-center justify-center text-9xl border border-stone-200">
        {fallbackIcon}
      </div>
    );
  }

  const visibleThumbs = images.slice(0, VISIBLE_THUMBS);
  const remaining = Math.max(0, images.length - VISIBLE_THUMBS);

  return (
    <>
      <div className="relative overflow-hidden border border-stone-200 bg-stone-100">
        <div
          ref={scrollerRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
          style={{ scrollSnapStop: 'always' }}
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              className="snap-center shrink-0 w-full h-64 sm:h-[400px] lg:h-[460px] relative"
            >
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="이미지 확대"
                className="block w-full h-full"
              >
                <img
                  src={src}
                  alt={i === 0 ? alt : `${alt} ${i + 1}`}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              </button>
            </div>
          ))}
        </div>

        {images.length > 1 && (
          <>
            <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur">
              {index + 1} / {images.length}
            </div>

            <div className="absolute bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-3rem)]">
              <div className="flex gap-1.5 sm:gap-2 bg-white/95 backdrop-blur p-1.5 sm:p-2 rounded-2xl shadow-sm overflow-x-auto scrollbar-none">
                {visibleThumbs.map((src, i) => (
                  <button
                    key={src + i}
                    type="button"
                    onClick={() => scrollToIndex(i)}
                    aria-label={`${i + 1}번 이미지 보기`}
                    aria-current={i === index}
                    className={`relative shrink-0 w-16 h-11 sm:w-20 sm:h-14 rounded-lg overflow-hidden transition-all ${
                      i === index
                        ? 'ring-2 ring-stone-800 ring-offset-2 ring-offset-white'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                {remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    aria-label={`나머지 ${remaining}장 더 보기`}
                    className="shrink-0 w-16 h-11 sm:w-20 sm:h-14 rounded-lg bg-stone-800 text-white flex items-center justify-center text-sm font-semibold hover:bg-stone-700 transition-colors"
                  >
                    +{remaining}
                  </button>
                )}
              </div>
            </div>

            <div className="h-1 bg-stone-200">
              <div
                className="h-full bg-stone-800 transition-all"
                style={{ width: `${((index + 1) / images.length) * 100}%` }}
              />
            </div>
          </>
        )}
      </div>

      {lightboxOpen && (
        <Lightbox
          images={images}
          alt={alt}
          startIndex={index}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={(i) => {
            setIndex(i);
            scrollToIndex(i);
          }}
        />
      )}
    </>
  );
}

function Lightbox({
  images,
  alt,
  startIndex,
  onClose,
  onIndexChange,
}: {
  images: string[];
  alt: string;
  startIndex: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const [current, setCurrent] = useState(startIndex);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    onIndexChange(current);
    const el = scrollerRef.current;
    if (el) el.scrollTo({ left: current * el.clientWidth, behavior: 'smooth' });
  }, [current, onIndexChange]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || images.length <= 1) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / el.clientWidth);
        setCurrent((prev) => (prev === i ? prev : i));
        ticking = false;
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="이미지 보기"
    >
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 text-white">
        <span className="text-sm font-medium">
          {current + 1} / {images.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 text-2xl leading-none"
        >
          ✕
        </button>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollerRef}
          className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
        >
          {images.map((src, i) => (
            <div
              key={src + i}
              className="snap-center shrink-0 w-full h-full flex items-center justify-center px-4 sm:px-12"
            >
              <img
                src={src}
                alt={i === 0 ? alt : `${alt} ${i + 1}`}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="이전 이미지"
              className="hidden sm:flex absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white text-xl backdrop-blur items-center justify-center"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="다음 이미지"
              className="hidden sm:flex absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 text-white text-xl backdrop-blur items-center justify-center"
            >
              →
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="px-4 sm:px-6 pb-4 pt-2 overflow-x-auto scrollbar-none">
          <div className="flex gap-2 justify-center min-w-min">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-current={i === current}
                aria-label={`${i + 1}번 이미지`}
                className={`shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden transition-all ${
                  i === current ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : 'opacity-50 hover:opacity-100'
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
