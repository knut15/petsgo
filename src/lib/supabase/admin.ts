import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS — only use in server-only code that
// has already authorized the request (e.g. session-verified API routes).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set to use admin operations.",
    );
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
