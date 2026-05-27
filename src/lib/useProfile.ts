'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from './supabase/browser';
import { useSession } from './supabase/useSession';
import type { ProfileRow } from './supabase/types';

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

const KEY = (userId: string | null) => ['profile', userId] as const;

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, nickname_set, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

async function updateDisplayName(userId: string, displayName: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, nickname_set: true })
    .eq('id', userId);
  if (error) throw error;
}

export function validateNickname(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < NICKNAME_MIN) return `${NICKNAME_MIN}자 이상 입력해주세요`;
  if (trimmed.length > NICKNAME_MAX) return `${NICKNAME_MAX}자 이내로 입력해주세요`;
  return null;
}

export function useProfile() {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: KEY(userId),
    queryFn: () => fetchProfile(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const updateNickname = useMutation({
    mutationFn: async (displayName: string) => {
      if (!userId) throw new Error('login required');
      const error = validateNickname(displayName);
      if (error) throw new Error(error);
      await updateDisplayName(userId, displayName.trim());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY(userId) });
      // Public memos display joined profile name; refresh those.
      queryClient.invalidateQueries({ queryKey: ['memos'] });
    },
  });

  // Fallback display name from OAuth metadata, used until profile loads.
  const fallback =
    (user?.user_metadata?.name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    '나';

  return {
    profile: profileQuery.data ?? null,
    displayName: profileQuery.data?.display_name || fallback,
    avatarUrl:
      profileQuery.data?.avatar_url ||
      (user?.user_metadata?.avatar_url as string | undefined) ||
      null,
    nicknameSet: profileQuery.data?.nickname_set ?? false,
    isLoading: profileQuery.isLoading,
    updateNickname: (value: string) => updateNickname.mutateAsync(value),
    isUpdating: updateNickname.isPending,
    updateError: updateNickname.error,
  };
}
