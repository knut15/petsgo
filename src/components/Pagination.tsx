import Link from 'next/link';

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

export default function Pagination({
  currentPage,
  totalPages,
  sp,
}: {
  currentPage: number;
  totalPages: number;
  sp: SP;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (page: number) => {
    const next = new URLSearchParams();
    Object.entries({ ...sp, page: String(page) }).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') next.set(k, String(v));
    });
    return `/search?${next.toString()}`;
  };

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav className="mt-10 flex items-center justify-center gap-3">
      {prevDisabled ? (
        <span className="px-4 py-2 rounded-lg border border-stone-200 text-stone-300 cursor-not-allowed">
          ← 이전
        </span>
      ) : (
        <Link
          href={buildHref(currentPage - 1)}
          className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 bg-white hover:border-stone-400"
          scroll={true}
        >
          ← 이전
        </Link>
      )}
      <span className="text-sm text-stone-600">
        {currentPage} / {totalPages}
      </span>
      {nextDisabled ? (
        <span className="px-4 py-2 rounded-lg border border-stone-200 text-stone-300 cursor-not-allowed">
          다음 →
        </span>
      ) : (
        <Link
          href={buildHref(currentPage + 1)}
          className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 bg-white hover:border-stone-400"
          scroll={true}
        >
          다음 →
        </Link>
      )}
    </nav>
  );
}
