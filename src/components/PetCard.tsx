"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useProfile } from "@/lib/useProfile";
import type { PetSpecies } from "@/lib/supabase/types";
import PetEditor from "./PetEditor";

const SPECIES_META: Record<PetSpecies, { label: string; emoji: string }> = {
  dog: { label: "강아지", emoji: "🐕" },
  cat: { label: "고양이", emoji: "🐈" },
  other: { label: "기타", emoji: "🐾" },
};

export default function PetCard() {
  const { profile } = useProfile();
  const [editing, setEditing] = useState(false);

  if (!profile) return null;

  const hasPet = !!profile.pet_name && !!profile.pet_species;
  const meta = profile.pet_species ? SPECIES_META[profile.pet_species] : null;

  return (
    <>
      <section className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">내 반려동물</h2>
          {hasPet && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label="반려동물 정보 수정"
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100"
            >
              <Pencil className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {hasPet ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center">
              {profile.pet_avatar_url ? (
                <img
                  src={profile.pet_avatar_url}
                  alt={profile.pet_name ?? ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">{meta?.emoji ?? "🐾"}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold text-stone-900 truncate">
                {profile.pet_name}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">{meta?.label}</div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="w-full flex items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 hover:border-brand hover:text-brand transition-colors"
          >
            <Plus className="w-4 h-4" strokeWidth={2.2} />
            <span className="text-sm font-medium">내 반려동물 등록하기</span>
          </button>
        )}
      </section>

      <PetEditor
        profile={profile}
        open={editing}
        onClose={() => setEditing(false)}
      />
    </>
  );
}
