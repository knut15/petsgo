'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from './supabase/browser';
import { useSession } from './supabase/useSession';
import type { LikeCountRow, LikeRow } from './supabase/types';

const COUNT_KEY = (contentId: string) => ['likes', 'count', contentId] as const;
const SELF_KEY = (contentId: string, userId: string | null) =>
  ['likes', 'self', contentId, userId] as const;

async function fetchCount(contentId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('like_counts')
    .select('count')
    .eq('content_id', contentId)
    .maybeSingle();
  if (error) throw error;
  return ((data as LikeCountRow | null)?.count ?? 0) as number;
}

async function fetchSelf(contentId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('likes')
    .select('content_id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export function useLikes(contentId: string) {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const countQuery = useQuery({
    queryKey: COUNT_KEY(contentId),
    queryFn: () => fetchCount(contentId),
    staleTime: 30 * 1000,
  });

  const selfQuery = useQuery({
    queryKey: SELF_KEY(contentId, userId),
    queryFn: () => fetchSelf(contentId, userId as string),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  const liked = !!selfQuery.data;

  const toggle = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('login required');
      const supabase = createClient();
      if (liked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('content_id', contentId);
        if (error) throw error;
      } else {
        const row: Pick<LikeRow, 'user_id' | 'content_id'> = {
          user_id: userId,
          content_id: contentId,
        };
        const { error } = await supabase.from('likes').insert(row);
        if (error) throw error;
      }
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['likes'] });
      const prevSelf = queryClient.getQueryData<boolean>(SELF_KEY(contentId, userId));
      const prevCount = queryClient.getQueryData<number>(COUNT_KEY(contentId)) ?? 0;
      queryClient.setQueryData(SELF_KEY(contentId, userId), !liked);
      queryClient.setQueryData(
        COUNT_KEY(contentId),
        liked ? Math.max(0, prevCount - 1) : prevCount + 1
      );
      return { prevSelf, prevCount };
    },
    onError: (_e, _v, ctx) => {
      if (!ctx) return;
      queryClient.setQueryData(SELF_KEY(contentId, userId), ctx.prevSelf);
      queryClient.setQueryData(COUNT_KEY(contentId), ctx.prevCount);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: COUNT_KEY(contentId) });
      queryClient.invalidateQueries({ queryKey: SELF_KEY(contentId, userId) });
    },
  });

  return {
    count: countQuery.data ?? 0,
    liked,
    canLike: !!userId,
    toggle: () => toggle.mutate(),
    isPending: toggle.isPending,
  };
}
