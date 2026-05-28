"use client";

import { useEffect, useRef, useState } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import {
  PET_AVATAR_MAX_BYTES,
  PET_NAME_MAX,
  usePetMutation,
  validatePetFile,
  validatePetName,
} from "@/lib/usePet";
import type { PetSpecies, ProfileRow } from "@/lib/supabase/types";

const SPECIES_OPTIONS: { value: PetSpecies; label: string; emoji: string }[] = [
  { value: "dog", label: "강아지", emoji: "🐕" },
  { value: "cat", label: "고양이", emoji: "🐈" },
  { value: "other", label: "기타", emoji: "🐾" },
];

interface PetEditorProps {
  profile: ProfileRow;
  open: boolean;
  onClose: () => void;
}

export default function PetEditor({ profile, open, onClose }: PetEditorProps) {
  const mutation = usePetMutation();
  const [name, setName] = useState(profile.pet_name ?? "");
  const [species, setSpecies] = useState<PetSpecies>(
    profile.pet_species ?? "dog",
  );
  const [file, setFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset draft state every time the editor re-opens so a cancelled edit
  // doesn't leak into the next open.
  useEffect(() => {
    if (!open) return;
    setName(profile.pet_name ?? "");
    setSpecies(profile.pet_species ?? "dog");
    setFile(null);
    setRemoveAvatar(false);
    setFileError(null);
    setPreviewUrl(null);
  }, [open, profile.pet_name, profile.pet_species]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  const nameError = validatePetName(name);
  const mutationMessage =
    mutation.error &&
    typeof mutation.error === "object" &&
    "message" in mutation.error
      ? String((mutation.error as { message: unknown }).message)
      : null;

  const displayedAvatar =
    previewUrl ?? (removeAvatar ? null : profile.pet_avatar_url);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    if (!next) {
      setFile(null);
      setFileError(null);
      return;
    }
    const error = validatePetFile(next);
    if (error) {
      setFileError(error);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(next);
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    setFile(null);
    setRemoveAvatar(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (nameError || fileError) return;
    try {
      await mutation.mutateAsync({ name, species, file, removeAvatar });
      onClose();
    } catch {
      // mutationMessage exposes the error inline.
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-stone-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-stone-900">반려동물 정보</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-stone-500 hover:text-stone-700"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex flex-col items-center gap-3">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-stone-100 flex items-center justify-center">
              {displayedAvatar ? (
                <img
                  src={displayedAvatar}
                  alt="반려동물"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl">
                  {SPECIES_OPTIONS.find((o) => o.value === species)?.emoji ??
                    "🐾"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 text-sm text-stone-700 hover:bg-stone-50"
              >
                <Upload className="w-3.5 h-3.5" strokeWidth={2} />
                사진 {profile.pet_avatar_url || file ? "변경" : "업로드"}
              </button>
              {(profile.pet_avatar_url || file) && !removeAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-sm text-stone-500 hover:bg-stone-50"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                  사진 제거
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-stone-500">
              JPG, PNG · 최대 {(PET_AVATAR_MAX_BYTES / 1024 / 1024).toFixed(0)}
              MB
            </p>
            {fileError && <p className="text-xs text-rose-500">{fileError}</p>}
          </div>

          <div>
            <label
              htmlFor="pet-name"
              className="block text-sm font-medium text-stone-700 mb-1.5"
            >
              이름
            </label>
            <input
              id="pet-name"
              type="text"
              value={name}
              onChange={(e) =>
                setName(e.target.value.slice(0, PET_NAME_MAX + 5))
              }
              maxLength={PET_NAME_MAX + 5}
              placeholder="우리 아이 이름"
              className="w-full px-3 py-2 rounded-lg border border-stone-300 focus:border-brand focus:outline-none"
            />
          </div>

          <div>
            <div className="block text-sm font-medium text-stone-700 mb-1.5">
              종
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SPECIES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpecies(opt.value)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-lg border transition-colors ${
                    species === opt.value
                      ? "border-brand bg-brand-soft/40 text-stone-900"
                      : "border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {mutationMessage && (
            <div className="text-sm text-rose-500">{mutationMessage}</div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending || !!nameError || !!fileError}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand text-white font-semibold hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
