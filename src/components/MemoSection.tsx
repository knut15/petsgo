'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Pencil, Trash2, Globe, Lock, X, Check } from 'lucide-react';
import { useMemos, MEMO_LIMIT, type PublicMemo } from '@/lib/useMemos';

export default function MemoSection({ contentId }: { contentId: string }) {
  const pathname = usePathname();
  const {
    myMemo,
    publicMemos,
    isLoading,
    canWrite,
    save,
    remove,
    isSaving,
    isRemoving,
    saveError,
  } = useMemos(contentId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (editing && myMemo) {
      setDraft(myMemo.body);
      setIsPublic(myMemo.is_public);
    }
  }, [editing, myMemo]);

  const startEditing = () => {
    setDraft(myMemo?.body ?? '');
    setIsPublic(myMemo?.is_public ?? false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    try {
      await save(draft, isPublic);
      setEditing(false);
    } catch {
      // saveError will surface
    }
  };

  const handleRemove = async () => {
    if (!confirm('이 메모를 삭제할까요?')) return;
    await remove();
    setEditing(false);
  };

  return (
    <section className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-stone-900">메모</h2>
        {publicMemos.length > 0 && (
          <span className="text-xs text-stone-500">
            공개 메모 {publicMemos.length}개
          </span>
        )}
      </div>

      {/* My memo / Editor */}
      {!canWrite ? (
        <Link
          href={`/login?next=${encodeURIComponent(pathname || '/')}`}
          className="block w-full text-center px-5 py-3 rounded-xl bg-brand-soft text-brand-dark font-semibold hover:bg-brand-soft/80 transition-colors"
        >
          로그인하고 메모 남기기
        </Link>
      ) : editing ? (
        <MemoEditor
          draft={draft}
          isPublic={isPublic}
          onDraftChange={setDraft}
          onIsPublicChange={setIsPublic}
          onSave={handleSave}
          onCancel={cancelEditing}
          onRemove={myMemo ? handleRemove : undefined}
          isSaving={isSaving}
          isRemoving={isRemoving}
          saveError={saveError}
        />
      ) : myMemo ? (
        <div className="rounded-xl border border-brand-soft bg-brand-soft/40 p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-stone-700">내 메모</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  myMemo.is_public
                    ? 'bg-brand text-white'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {myMemo.is_public ? (
                  <>
                    <Globe className="w-3 h-3" strokeWidth={2} />
                    공개
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" strokeWidth={2} />
                    비공개
                  </>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={startEditing}
              aria-label="수정"
              className="text-stone-500 hover:text-stone-900"
            >
              <Pencil className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
          <p className="text-sm text-stone-800 whitespace-pre-line leading-relaxed">
            {myMemo.body}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="w-full px-5 py-4 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 text-sm hover:border-stone-400 hover:text-stone-700 transition-colors"
        >
          + 이 장소에 대한 메모 남기기 (최대 {MEMO_LIMIT}자)
        </button>
      )}

      {/* Public memos from others */}
      {publicMemos.length > 0 && (
        <div className="mt-6 pt-6 border-t border-stone-200">
          <h3 className="text-sm font-semibold text-stone-700 mb-3">
            다른 사용자의 공개 메모
          </h3>
          <ul className="space-y-3">
            {publicMemos.map((memo) => (
              <PublicMemoItem key={memo.id} memo={memo} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function MemoEditor({
  draft,
  isPublic,
  onDraftChange,
  onIsPublicChange,
  onSave,
  onCancel,
  onRemove,
  isSaving,
  isRemoving,
  saveError,
}: {
  draft: string;
  isPublic: boolean;
  onDraftChange: (v: string) => void;
  onIsPublicChange: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onRemove?: () => void;
  isSaving: boolean;
  isRemoving: boolean;
  saveError: unknown;
}) {
  const length = draft.length;
  const overLimit = length > MEMO_LIMIT;
  const errorMessage =
    saveError instanceof Error ? saveError.message : saveError ? '저장 실패' : null;

  return (
    <div className="space-y-3">
      <textarea
        value={draft}
        onChange={(e) => onDraftChange(e.target.value.slice(0, MEMO_LIMIT + 20))}
        maxLength={MEMO_LIMIT + 20}
        rows={4}
        placeholder={`이 장소에 대한 메모를 남겨주세요 (최대 ${MEMO_LIMIT}자)`}
        className="w-full px-4 py-3 rounded-xl border border-stone-300 focus:border-brand focus:outline-none text-sm resize-none"
      />
      <div className="flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => onIsPublicChange(!isPublic)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isPublic
              ? 'bg-brand text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {isPublic ? (
            <>
              <Globe className="w-3.5 h-3.5" strokeWidth={2} />
              공개
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" strokeWidth={2} />
              비공개
            </>
          )}
        </button>
        <span className={overLimit ? 'text-rose-500 font-semibold' : 'text-stone-500'}>
          {length} / {MEMO_LIMIT}
        </span>
      </div>
      {errorMessage && (
        <div className="text-xs text-rose-600">{errorMessage}</div>
      )}
      <div className="flex items-center gap-2 justify-end pt-1">
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={isRemoving}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
            삭제
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-100"
        >
          <X className="w-3.5 h-3.5" strokeWidth={2} />
          취소
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || overLimit || draft.trim().length === 0}
          className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" strokeWidth={2.4} />
          {isSaving ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  );
}

function PublicMemoItem({ memo }: { memo: PublicMemo }) {
  const initial = (memo.display_name ?? '?').slice(0, 1).toUpperCase();
  return (
    <li className="flex gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full bg-stone-200 overflow-hidden flex items-center justify-center text-sm font-semibold text-stone-600">
        {memo.avatar_url ? (
          <img src={memo.avatar_url} alt={memo.display_name ?? ''} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-sm font-semibold text-stone-800 truncate">
            {memo.display_name ?? '익명'}
          </span>
          <span className="text-xs text-stone-400">{formatDate(memo.updated_at)}</span>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">
          {memo.body}
        </p>
      </div>
    </li>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}
