'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useProfile, validateNickname, NICKNAME_MAX } from '@/lib/useProfile';

export interface NicknameEditorHandle {
  startEdit: () => void;
}

const NicknameEditor = forwardRef<NicknameEditorHandle>(function NicknameEditor(_, ref) {
  const { displayName, updateNickname, isUpdating, updateError } = useProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    startEdit: () => setEditing(true),
  }));

  useEffect(() => {
    if (editing) {
      setDraft(displayName);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, displayName]);

  const validationError = editing ? validateNickname(draft) : null;
  // supabase's PostgrestError isn't always `instanceof Error`, so reach for
  // a `message` field directly. Without this, RLS/schema failures were silent
  // — the save just appeared to do nothing.
  const errorMessage =
    updateError && typeof updateError === 'object' && 'message' in updateError
      ? String((updateError as { message: unknown }).message)
      : null;

  const handleSave = async () => {
    if (validationError) return;
    try {
      await updateNickname(draft);
      setEditing(false);
    } catch {
      // updateError exposes the message
    }
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg font-bold text-stone-900 truncate">{displayName}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="닉네임 수정"
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, NICKNAME_MAX + 5))}
          onKeyDown={handleKey}
          maxLength={NICKNAME_MAX + 5}
          placeholder="닉네임 (2-20자)"
          className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-stone-300 focus:border-brand focus:outline-none text-base font-semibold"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isUpdating || !!validationError}
          aria-label="저장"
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-brand text-white hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          aria-label="취소"
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-stone-100 text-stone-600 hover:bg-stone-200"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
      {(validationError || errorMessage) && (
        <div className="text-xs text-rose-500">{validationError ?? errorMessage}</div>
      )}
    </div>
  );
});

export default NicknameEditor;
