'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from './supabase/browser';
import { useSession } from './supabase/useSession';
import type { MemoRow, ProfileRow } from './supabase/types';

export interface PublicMemo {
  id: string;
  user_id: string;
  body: string;
  updated_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface MyMemo {
  id: string;
  body: string;
  is_public: boolean;
  updated_at: string;
}

const MY_KEY = (contentId: string, userId: string | null) =>
  ['memos', 'mine', contentId, userId] as const;
const PUBLIC_KEY = (contentId: string) => ['memos', 'public', contentId] as const;

const MEMO_MAX_LEN = 200;

async function fetchMyMemo(contentId: string, userId: string): Promise<MyMemo | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('memos')
    .select('id, body, is_public, updated_at')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Pick<MemoRow, 'id' | 'body' | 'is_public' | 'updated_at'>;
  return {
    id: row.id,
    body: row.body,
    is_public: row.is_public,
    updated_at: row.updated_at,
  };
}

async function fetchPublicMemos(
  contentId: string,
  excludeUserId: string | null
): Promise<PublicMemo[]> {
  const supabase = createClient();
  let query = supabase
    .from('memos')
    .select('id, user_id, body, updated_at, profiles!inner(display_name, avatar_url)')
    .eq('content_id', contentId)
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .limit(50);
  if (excludeUserId) query = query.neq('user_id', excludeUserId);
  const { data, error } = await query;
  if (error) throw error;

  type Joined = Pick<MemoRow, 'id' | 'user_id' | 'body' | 'updated_at'> & {
    profiles: Pick<ProfileRow, 'display_name' | 'avatar_url'> | null;
  };
  const rows = (data ?? []) as unknown as Joined[];
  return rows.map((r) => ({
    id: r.id,
    user_id: r.user_id,
    body: r.body,
    updated_at: r.updated_at,
    display_name: r.profiles?.display_name ?? null,
    avatar_url: r.profiles?.avatar_url ?? null,
  }));
}

export const MEMO_LIMIT = MEMO_MAX_LEN;

export function useMemos(contentId: string) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const mine = useQuery({
    queryKey: MY_KEY(contentId, userId),
    queryFn: () => fetchMyMemo(contentId, userId as string),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });

  const others = useQuery({
    queryKey: PUBLIC_KEY(contentId),
    queryFn: () => fetchPublicMemos(contentId, userId),
    staleTime: 60 * 1000,
  });

  const save = useMutation({
    mutationFn: async ({ body, isPublic }: { body: string; isPublic: boolean }) => {
      if (!userId) throw new Error('login required');
      const trimmed = body.trim();
      if (trimmed.length === 0) throw new Error('빈 메모는 저장할 수 없어요');
      if (trimmed.length > MEMO_MAX_LEN) throw new Error(`${MEMO_MAX_LEN}자 이내로 작성해주세요`);
      const supabase = createClient();
      const { error } = await supabase.from('memos').upsert(
        {
          user_id: userId,
          content_id: contentId,
          body: trimmed,
          is_public: isPublic,
        },
        { onConflict: 'user_id,content_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_KEY(contentId, userId) });
      queryClient.invalidateQueries({ queryKey: PUBLIC_KEY(contentId) });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('login required');
      const supabase = createClient();
      const { error } = await supabase
        .from('memos')
        .delete()
        .eq('user_id', userId)
        .eq('content_id', contentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_KEY(contentId, userId) });
      queryClient.invalidateQueries({ queryKey: PUBLIC_KEY(contentId) });
    },
  });

  return {
    myMemo: mine.data ?? null,
    publicMemos: others.data ?? [],
    isLoading: mine.isLoading || others.isLoading,
    canWrite: !!userId,
    save: (body: string, isPublic: boolean) => save.mutateAsync({ body, isPublic }),
    remove: () => remove.mutateAsync(),
    isSaving: save.isPending,
    isRemoving: remove.isPending,
    saveError: save.error,
  };
}
