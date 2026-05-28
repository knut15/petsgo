"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "./supabase/browser";
import { useSession } from "./supabase/useSession";
import { PROFILE_COLUMNS, PROFILE_KEY } from "./useProfile";
import type { PetSpecies, ProfileRow } from "./supabase/types";

export const PET_NAME_MIN = 1;
export const PET_NAME_MAX = 20;
export const PET_AVATAR_MAX_BYTES = 2 * 1024 * 1024;

const BUCKET = "pet-avatars";

export interface PetInput {
  name: string;
  species: PetSpecies;
  file?: File | null;
  removeAvatar?: boolean;
}

export function validatePetName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < PET_NAME_MIN) return "이름을 입력해주세요";
  if (trimmed.length > PET_NAME_MAX)
    return `${PET_NAME_MAX}자 이내로 입력해주세요`;
  return null;
}

export function validatePetFile(file: File): string | null {
  if (!file.type.startsWith("image/"))
    return "이미지 파일만 업로드할 수 있어요";
  if (file.size > PET_AVATAR_MAX_BYTES) return "2MB 이하 이미지만 가능해요";
  return null;
}

function extFromFile(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,4}$/.test(fromName)) return fromName;
  const fromMime = file.type.split("/")[1]?.toLowerCase();
  return fromMime && /^[a-z0-9]{2,4}$/.test(fromMime) ? fromMime : "jpg";
}

async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const path = `${userId}/avatar.${extFromFile(file)}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  // Cache-bust on overwrite so the new image shows immediately.
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function deleteAvatarFiles(userId: string): Promise<void> {
  const supabase = createClient();
  const { data: files } = await supabase.storage.from(BUCKET).list(userId);
  if (!files?.length) return;
  await supabase.storage
    .from(BUCKET)
    .remove(files.map((f: { name: string }) => `${userId}/${f.name}`));
}

async function savePet(userId: string, input: PetInput): Promise<ProfileRow> {
  const supabase = createClient();
  const nameError = validatePetName(input.name);
  if (nameError) throw new Error(nameError);

  let nextAvatarUrl: string | null | undefined; // undefined = no change
  if (input.removeAvatar) {
    await deleteAvatarFiles(userId);
    nextAvatarUrl = null;
  } else if (input.file) {
    const fileError = validatePetFile(input.file);
    if (fileError) throw new Error(fileError);
    nextAvatarUrl = await uploadAvatar(userId, input.file);
  }

  const update: Record<string, string | null> = {
    pet_name: input.name.trim(),
    pet_species: input.species,
  };
  if (nextAvatarUrl !== undefined) update.pet_avatar_url = nextAvatarUrl;

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  if (!data)
    throw new Error("반려동물 정보 저장에 실패했어요. 다시 로그인해주세요.");
  return data as ProfileRow;
}

export function usePetMutation() {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PetInput) => {
      if (!userId) throw new Error("login required");
      return await savePet(userId, input);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(PROFILE_KEY(userId), updated);
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY(userId) });
    },
  });
}
