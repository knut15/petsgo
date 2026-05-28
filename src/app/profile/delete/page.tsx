"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { useSession } from "@/lib/supabase/useSession";
import { createClient } from "@/lib/supabase/browser";

const CONFIRM_PHRASE = "계정 탈퇴";

export default function DeleteAccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useSession();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/profile/delete");
    }
  }, [loading, user, router]);

  const canConfirm = draft.trim() === CONFIRM_PHRASE && !pending;

  const handleDelete = async () => {
    if (!canConfirm) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? `삭제에 실패했어요 (${res.status})`);
      }
      // Wipe client-side session and cache before navigating.
      const supabase = createClient();
      await supabase.auth.signOut();
      queryClient.clear();
      // Hard navigation: nukes React state and bypasses bfcache so the
      // back button can't restore the logged-in profile view.
      window.location.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요");
      setPending(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-stone-200 border-t-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-2xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center gap-2">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            프로필로
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden">
          <div className="bg-rose-50 px-6 py-5 flex items-start gap-3 border-b border-rose-100">
            <div className="shrink-0 w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-900">회원 탈퇴</h1>
              <p className="text-sm text-stone-600 mt-1">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 mb-2">
                삭제되는 정보
              </h2>
              <ul className="text-sm text-stone-700 space-y-1 list-disc pl-5">
                <li>로그인 계정 (이메일)</li>
                <li>닉네임 및 프로필 정보</li>
                <li>반려동물 정보 및 사진</li>
                <li>즐겨찾기, 좋아요, 메모</li>
              </ul>
            </div>

            <div>
              <label
                htmlFor="confirm-input"
                className="block text-sm font-medium text-stone-700 mb-1.5"
              >
                확인을 위해{" "}
                <span className="font-semibold text-rose-600">
                  &ldquo;{CONFIRM_PHRASE}&rdquo;
                </span>{" "}
                를 정확히 입력해주세요
              </label>
              <input
                id="confirm-input"
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={CONFIRM_PHRASE}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-rose-500 focus:outline-none"
                autoComplete="off"
              />
            </div>

            {error && (
              <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Link
                href="/profile"
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
              >
                취소
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!canConfirm}
                className="flex-1 px-4 py-2.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending ? "삭제 중…" : "영구 삭제"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
