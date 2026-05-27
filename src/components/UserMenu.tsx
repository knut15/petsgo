'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User as UserIcon, Heart } from 'lucide-react';
import { useSession } from '@/lib/supabase/useSession';
import { useProfile } from '@/lib/useProfile';
import { createClient } from '@/lib/supabase/browser';

interface Props {
  size?: 'sm' | 'md';
}

export default function UserMenu({ size = 'md' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useSession();
  const { displayName: profileDisplayName, avatarUrl: profileAvatar } = useProfile();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    setOpen(false);
  };

  const buttonSize = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-[18px] h-[18px]' : 'w-5 h-5';

  if (loading) {
    return <div className={`${buttonSize} rounded-full bg-stone-200 animate-pulse`} />;
  }

  if (!user) {
    const next = encodeURIComponent(pathname || '/');
    return (
      <Link
        href={`/login?next=${next}`}
        className="px-4 py-2 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
      >
        로그인
      </Link>
    );
  }

  const displayName = profileDisplayName;
  const avatarUrl = profileAvatar;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="사용자 메뉴"
        className={`${buttonSize} rounded-full overflow-hidden bg-stone-200 flex items-center justify-center hover:ring-2 hover:ring-stone-300 transition-all`}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <UserIcon className={`${iconSize} text-stone-600`} strokeWidth={2} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-stone-100">
            <div className="text-sm font-semibold text-stone-900 truncate">{displayName}</div>
            {user.email && (
              <div className="text-xs text-stone-500 truncate">{user.email}</div>
            )}
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
          >
            <UserIcon className="w-4 h-4" strokeWidth={2} />
            마이페이지
          </Link>
          <Link
            href="/favorites"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50"
          >
            <Heart className="w-4 h-4" strokeWidth={2} />
            즐겨찾기
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 border-t border-stone-100"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
