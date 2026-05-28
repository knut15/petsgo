"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Provider = "kakao" | "google";

const PROVIDERS: Array<{
  id: Provider;
  label: string;
  bgClass: string;
  textClass: string;
  icon: string;
}> = [
  {
    id: "kakao",
    label: "카카오로 계속하기",
    bgClass: "bg-[#fee500]",
    textClass: "text-[#3c1e1e]",
    icon: "💬",
  },
  {
    id: "google",
    label: "Google로 계속하기",
    bgClass: "bg-white border border-stone-300",
    textClass: "text-stone-800",
    icon: "G",
  },
];

const FORCE_LOGIN_COOKIE = "pt_force_login";

function readForceLoginCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${FORCE_LOGIN_COOKIE}=1`));
}

function clearForceLoginCookie() {
  if (typeof document === "undefined") return;
  // biome-ignore lint/suspicious/noDocumentCookie: intentional one-shot flag; server sets httpOnly=false so JS must clear it
  document.cookie = `${FORCE_LOGIN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const error = params.get("error");
  const [pending, setPending] = useState<Provider | null>(null);

  const handleLogin = async (provider: Provider) => {
    setPending(provider);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const forceLogin = readForceLoginCookie();
    if (forceLogin) {
      // One-shot: consume immediately so a back-button retry doesn't re-trigger.
      clearForceLoginCookie();
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: forceLogin ? { prompt: "login" } : undefined,
      },
    });

    if (signInError) {
      console.error("OAuth error:", signInError);
      setPending(null);
      router.push("/login?error=oauth_failed");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl">🐕</span>
            <span className="text-2xl font-bold text-stone-900">PetTrip</span>
          </Link>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">
            로그인 / 가입
          </h1>
          <p className="text-sm text-stone-500">
            소셜 계정으로 시작하세요. 별도 가입 절차는 없습니다.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            {error === "auth_failed"
              ? "인증에 실패했어요. 다시 시도해주세요."
              : "로그인 중 오류가 발생했습니다."}
          </div>
        )}

        <div className="space-y-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleLogin(p.id)}
              disabled={pending !== null}
              className={`w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl font-semibold transition-all ${p.bgClass} ${p.textClass} ${
                pending === p.id ? "opacity-70" : "hover:opacity-90"
              } disabled:cursor-not-allowed`}
            >
              <span className="w-6 h-6 flex items-center justify-center font-bold">
                {p.icon}
              </span>
              <span>{pending === p.id ? "연결 중…" : p.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-stone-500 hover:text-stone-700"
          >
            ← 로그인 없이 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
