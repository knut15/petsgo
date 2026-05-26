'use client';

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'pettrip:favorites';
const CHANGE_EVENT = 'pettrip:favorites:change';

export interface Favorite {
  contentid: string;
  title: string;
  addr1?: string;
  firstimage?: string;
  contenttypeid?: string;
  addedAt: number;
}

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

const writeAll = (list: Favorite[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  cachedRaw = null;
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const subscribe = (cb: () => void) => {
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

export function useFavorites() {
  const list = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY);

  const isFavorite = useCallback(
    (contentid: string) => list.some((f) => f.contentid === contentid),
    [list]
  );

  const toggle = useCallback((snapshot: Omit<Favorite, 'addedAt'>) => {
    const current = readSnapshot();
    const exists = current.some((f) => f.contentid === snapshot.contentid);
    const next = exists
      ? current.filter((f) => f.contentid !== snapshot.contentid)
      : [{ ...snapshot, addedAt: Date.now() }, ...current];
    writeAll(next);
  }, []);

  const remove = useCallback((contentid: string) => {
    writeAll(readSnapshot().filter((f) => f.contentid !== contentid));
  }, []);

  return { list, isFavorite, toggle, remove };
}

export function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
