'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from './supabase/useSession';
import { createClient } from './supabase/browser';

const STORAGE_KEY = 'pettrip:favorites';
const CHANGE_EVENT = 'pettrip:favorites:change';
const MIGRATED_KEY = 'pettrip:favorites:migrated';

export interface Favorite {
  contentid: string;
  title: string;
  addr1?: string;
  firstimage?: string;
  contenttypeid?: string;
  addedAt: number;
}

// ───────── localStorage path (guests) ─────────

const EMPTY: Favorite[] = [];
let cachedRaw: string | null = null;
let cachedList: Favorite[] = EMPTY;

const readSnapshot = (): Favorite[] => {
  if (typeof window === 'undefined') return EMPTY;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedList;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedList = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    cachedList = EMPTY;
  }
  return cachedList;
};

const writeLocal = (list: Favorite[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  cachedRaw = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const subscribeLocal = (cb: () => void) => {
  const handler = () => {
    cachedRaw = null;
    cb();
  };
  window.addEventListener(CHANGE_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
};

const noopSubscribe = () => () => {};

// ───────── DB path (logged-in) ─────────

import type { FavoriteRow } from './supabase/types';

async function fetchDbFavorites(userId: string): Promise<Favorite[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as FavoriteRow[];
  return rows.map((row) => ({
    contentid: row.content_id,
    title: row.title,
    addr1: row.addr1 ?? undefined,
    firstimage: row.firstimage ?? undefined,
    contenttypeid: row.contenttypeid ?? undefined,
    addedAt: new Date(row.added_at).getTime(),
  }));
}

async function dbUpsertFavorite(userId: string, snapshot: Omit<Favorite, 'addedAt'>) {
  const supabase = createClient();
  const { error } = await supabase.from('favorites').upsert(
    {
      user_id: userId,
      content_id: snapshot.contentid,
      title: snapshot.title,
      addr1: snapshot.addr1 ?? null,
      firstimage: snapshot.firstimage ?? null,
      contenttypeid: snapshot.contenttypeid ?? null,
    },
    { onConflict: 'user_id,content_id' }
  );
  if (error) throw error;
}

async function dbRemoveFavorite(userId: string, contentId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId);
  if (error) throw error;
}

// ───────── Migration (localStorage → DB, once after first login) ─────────

async function migrateLocalToDb(userId: string): Promise<number> {
  if (typeof window === 'undefined') return 0;
  if (window.localStorage.getItem(MIGRATED_KEY)) return 0;
  const list = readSnapshot();
  if (list.length === 0) {
    window.localStorage.setItem(MIGRATED_KEY, '1');
    return 0;
  }
  const supabase = createClient();
  const rows = list.map((f) => ({
    user_id: userId,
    content_id: f.contentid,
    title: f.title,
    addr1: f.addr1 ?? null,
    firstimage: f.firstimage ?? null,
    contenttypeid: f.contenttypeid ?? null,
    added_at: new Date(f.addedAt).toISOString(),
  }));
  const { error } = await supabase
    .from('favorites')
    .upsert(rows, { onConflict: 'user_id,content_id' });
  if (error) {
    console.error('Migration failed:', error);
    return 0;
  }
  window.localStorage.setItem(MIGRATED_KEY, '1');
  window.localStorage.removeItem(STORAGE_KEY);
  cachedRaw = null;
  return rows.length;
}

// ───────── Public hook ─────────

export function useFavorites() {
  const { user } = useSession();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const localList = useSyncExternalStore(
    typeof window === 'undefined' ? noopSubscribe : subscribeLocal,
    readSnapshot,
    () => EMPTY
  );

  const dbQuery = useQuery({
    queryKey: ['favorites', userId],
    queryFn: () => fetchDbFavorites(userId as string),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!userId) return;
    migrateLocalToDb(userId).then((count) => {
      if (count > 0) {
        queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
      }
    });
  }, [userId, queryClient]);

  const toggleMutation = useMutation({
    mutationFn: async (snapshot: Omit<Favorite, 'addedAt'>) => {
      if (!userId) throw new Error('not logged in');
      const exists = (dbQuery.data ?? []).some((f) => f.contentid === snapshot.contentid);
      if (exists) await dbRemoveFavorite(userId, snapshot.contentid);
      else await dbUpsertFavorite(userId, snapshot);
    },
    onMutate: async (snapshot) => {
      if (!userId) return { prev: undefined };
      await queryClient.cancelQueries({ queryKey: ['favorites', userId] });
      const prev = queryClient.getQueryData<Favorite[]>(['favorites', userId]) ?? [];
      const exists = prev.some((f) => f.contentid === snapshot.contentid);
      const next = exists
        ? prev.filter((f) => f.contentid !== snapshot.contentid)
        : [{ ...snapshot, addedAt: Date.now() }, ...prev];
      queryClient.setQueryData(['favorites', userId], next);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (userId && ctx?.prev) {
        queryClient.setQueryData(['favorites', userId], ctx.prev);
      }
    },
    onSettled: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });

  const list = userId ? dbQuery.data ?? EMPTY : localList;

  const isFavorite = useCallback(
    (contentid: string) => list.some((f) => f.contentid === contentid),
    [list]
  );

  const toggle = useCallback(
    (snapshot: Omit<Favorite, 'addedAt'>) => {
      if (userId) {
        toggleMutation.mutate(snapshot);
        return;
      }
      const current = readSnapshot();
      const exists = current.some((f) => f.contentid === snapshot.contentid);
      const next = exists
        ? current.filter((f) => f.contentid !== snapshot.contentid)
        : [{ ...snapshot, addedAt: Date.now() }, ...current];
      writeLocal(next);
    },
    [userId, toggleMutation]
  );

  const remove = useCallback(
    (contentid: string) => {
      if (userId) {
        const snapshot = list.find((f) => f.contentid === contentid);
        if (snapshot) toggleMutation.mutate({ ...snapshot });
        return;
      }
      writeLocal(readSnapshot().filter((f) => f.contentid !== contentid));
    },
    [userId, list, toggleMutation]
  );

  return { list, isFavorite, toggle, remove };
}

export function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
