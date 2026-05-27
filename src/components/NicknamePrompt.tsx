'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useSession } from '@/lib/supabase/useSession';
import { useProfile } from '@/lib/useProfile';

const DISABLED_KEY = 'pettrip:nickname-prompt-disabled';

export default function NicknamePrompt() {
  const { user, loading: sessionLoading } = useSession();
  const { nicknameSet, isLoading: profileLoading } = useProfile();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (sessionLoading || profileLoading) {
      setOpen(false);
      return;
    }
    if (!user || nicknameSet) {
      setOpen(false);
      return;
    }
    if (pathname?.startsWith('/profile')) {
      setOpen(false);
      return;
    }
    if (typeof window !== 'undefined' && window.localStorage.getItem(DISABLED_KEY)) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [sessionLoading, profileLoading, user, nicknameSet, pathname]);

  // If user finally sets a nickname elsewhere, clear the suppression flag too.
  useEffect(() => {
    if (nicknameSet && typeof window !== 'undefined') {
      window.localStorage.removeItem(DISABLED_KEY);
    }
  }, [nicknameSet]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const persistIfChecked = () => {
    if (dontShowAgain) {
      try {
        window.localStorage.setItem(DISABLED_KEY, '1');
      } catch {
        // ignore (private mode, etc.)
      }
    }
  };

  const handleClose = () => {
    persistIfChecked();
    setOpen(false);
  };

  const handleGoToProfile = () => {
    persistIfChecked();
    setOpen(false);
    router.push('/profile');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nickname-prompt-title"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="shrink-0 w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand" strokeWidth={2.2} />
          </div>
          <h2
            id="nickname-prompt-title"
            className="text-lg font-bold text-stone-900"
          >
            닉네임을 설정해주세요
          </h2>
        </div>
        <p className="text-sm text-stone-600 mb-2 leading-relaxed">
          공개 메모에 본명이 노출될 수 있어요. 다른 사용자에게 보일 닉네임을 정해주세요.
        </p>
        <p className="text-xs text-stone-500 mb-5 leading-relaxed">
          마이페이지에서 언제든지 변경할 수 있어요.
        </p>

        <label className="flex items-center gap-2 text-sm text-stone-700 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-stone-300 text-brand focus:ring-brand"
          />
          다시 보지 않기
        </label>

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={handleGoToProfile}
            className="px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
          >
            마이페이지로 가기 →
          </button>
        </div>
      </div>
    </div>
  );
}
