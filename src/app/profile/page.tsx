'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Heart, Bookmark, MessageSquare, LogOut, ExternalLink } from 'lucide-react';
import { useSession } from '@/lib/supabase/useSession';
import { useFavorites } from '@/lib/useFavorites';
import { createClient } from '@/lib/supabase/browser';
import type { MemoRow } from '@/lib/supabase/types';

interface MyMemoEntry {
  id: string;
  content_id: string;
  body: string;
  is_public: boolean;
  updated_at: string;
}

async function fetchMyMemos(userId: string): Promise<MyMemoEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('memos')
    .select('id, content_id, body, is_public, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Pick<MemoRow, 'id' | 'content_id' | 'body' | 'is_public' | 'updated_at'>[];
}

async function fetchMyLikesCount(userId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('likes')
    .select('content_id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useSession();
  const { list: favorites } = useFavorites();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login?next=/profile');
    }
  }, [loading, user, router]);

  const myMemos = useQuery({
    queryKey: ['memos', 'all-mine', user?.id],
    queryFn: () => fetchMyMemos(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const likesCount = useQuery({
    queryKey: ['likes', 'count-mine', user?.id],
    queryFn: () => fetchMyLikesCount(user!.id),
    enabled: !!user,
    staleTime: 60 * 1000,
  });

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-stone-200 border-t-brand animate-spin" />
      </div>
    );
  }

  const displayName =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email?.split('@')[0] ||
    '나';
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 hover:text-stone-900">
            <span className="text-2xl">🐕</span>
            <span className="font-bold text-stone-900">PetTrip</span>
          </Link>
          <Link href="/" className="text-sm text-stone-600 hover:text-stone-900">
            홈으로
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* User card */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-200 shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-stone-500">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg font-bold text-stone-900 truncate">{displayName}</div>
            {user.email && (
              <div className="text-sm text-stone-500 truncate">{user.email}</div>
            )}
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Bookmark className="w-5 h-5" strokeWidth={2} />}
            label="즐겨찾기"
            value={favorites.length}
            href="/favorites"
          />
          <StatCard
            icon={<Heart className="w-5 h-5" strokeWidth={2} fill="currentColor" />}
            label="좋아요"
            value={likesCount.data ?? 0}
            iconClass="text-rose-500"
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5" strokeWidth={2} />}
            label="메모"
            value={myMemos.data?.length ?? 0}
          />
        </section>

        {/* My memos */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-lg font-bold text-stone-900 mb-4">내 메모</h2>
          {myMemos.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-20 bg-stone-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (myMemos.data?.length ?? 0) === 0 ? (
            <div className="text-center py-8 text-sm text-stone-500">
              아직 작성한 메모가 없어요.
            </div>
          ) : (
            <ul className="space-y-3">
              {myMemos.data!.map((memo) => (
                <li
                  key={memo.id}
                  className="rounded-xl border border-stone-200 p-4"
                >
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full ${
                        memo.is_public
                          ? 'bg-brand text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {memo.is_public ? '공개' : '비공개'}
                    </span>
                    <span>{formatDate(memo.updated_at)}</span>
                  </div>
                  <p className="text-sm text-stone-800 whitespace-pre-line leading-relaxed mb-3">
                    {memo.body}
                  </p>
                  <Link
                    href={`/place/${memo.content_id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
                  >
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                    장소 보기
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold hover:bg-white"
        >
          <LogOut className="w-4 h-4" strokeWidth={2} />
          로그아웃
        </button>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  href,
  iconClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href?: string;
  iconClass?: string;
}) {
  const body = (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 hover:border-stone-300 transition-colors">
      <div className={`flex items-center gap-2 text-stone-500 mb-2 ${iconClass ?? ''}`}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-stone-900">{value.toLocaleString()}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}
