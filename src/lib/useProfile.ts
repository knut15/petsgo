"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "./supabase/browser";
import { useSession } from "./supabase/useSession";
import type { ProfileRow } from "./supabase/types";

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

export const PROFILE_KEY = (userId: string | null) =>
  ["profile", userId] as const;
const KEY = PROFILE_KEY;

export const PROFILE_COLUMNS =
  "id, display_name, avatar_url, nickname_set, created_at, pet_name, pet_species, pet_avatar_url";

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

async function updateDisplayName(
  userId: string,
  displayName: string,
): Promise<ProfileRow> {
  const supabase = createClient();
  // .select() forces PostgREST to return the row(s) affected. Without it an
  // RLS denial can silently match zero rows and look like a success.
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, nickname_set: true })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  if (!data)
    throw new Error(
      "프로필 업데이트가 반영되지 않았어요. 다시 로그인해주세요.",
    );
  return data as ProfileRow;
}

export function validateNickname(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < NICKNAME_MIN)
    return `${NICKNAME_MIN}자 이상 입력해주세요`;
  if (trimmed.length > NICKNAME_MAX)
    return `${NICKNAME_MAX}자 이내로 입력해주세요`;
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
      if (!userId) throw new Error("login required");
      const error = validateNickname(displayName);
      if (error) throw new Error(error);
      return await updateDisplayName(userId, displayName.trim());
    },
    onSuccess: (updated) => {
      // Write the verified row straight into the cache so the UI flips to
      // the new nickname immediately, instead of waiting for a refetch.
      queryClient.setQueryData(KEY(userId), updated);
      queryClient.invalidateQueries({ queryKey: KEY(userId) });
      // Public memos display joined profile name; refresh those.
      queryClient.invalidateQueries({ queryKey: ["memos"] });
    },
  });

  // Fallback display name from OAuth metadata, used until profile loads.
  const fallback =
    (user?.user_metadata?.name as string | undefined) ||
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "나";

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
