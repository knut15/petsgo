'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/browser';

/**
 * Invalidates all TanStack Query caches whenever the auth state
 * changes (sign-in / sign-out / user-update / token-refresh boundary).
 * Prevents stale per-user data from leaking between sessions when a
 * user logs out and back in with a different provider or account.
 */
export default function AuthSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event: string) => {
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'USER_UPDATED'
      ) {
        queryClient.invalidateQueries();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  return null;
}
