import { NextResponse } from "next/server";
import { revokeGoogle, revokeKakao } from "@/lib/auth/provider-revoke";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "pet-avatars";
const FORCE_LOGIN_COOKIE = "pt_force_login";
const FORCE_LOGIN_TTL_SECONDS = 600;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId = user.id;
  const admin = createAdminClient();

  // 1) Best-effort: revoke provider connections so the next login sees a fresh
  //    consent screen. Failures here MUST NOT block deletion.
  try {
    const [{ data: full }, { data: sessionData }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      supabase.auth.getSession(),
    ]);
    const identities = full.user?.identities ?? [];
    const googleToken =
      sessionData.session?.provider_refresh_token ??
      sessionData.session?.provider_token ??
      null;

    for (const identity of identities) {
      try {
        if (identity.provider === "kakao") {
          // Supabase stores the provider's stable user id on identity.id.
          await revokeKakao(identity.id);
        } else if (identity.provider === "google") {
          if (!googleToken) {
            console.warn(
              "[account-delete] google revoke skipped: token unavailable",
              { userId },
            );
            continue;
          }
          await revokeGoogle(googleToken);
        }
      } catch (e) {
        console.error("[account-delete] provider revoke failed", {
          userId,
          provider: identity.provider,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  } catch (e) {
    console.error("[account-delete] identity lookup failed", {
      userId,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  // 2) Remove pet-avatar files. Storage isn't cascaded by auth.users delete,
  //    so we must wipe the user's folder explicitly first.
  const { data: files } = await admin.storage.from(BUCKET).list(userId);
  if (files?.length) {
    await admin.storage
      .from(BUCKET)
      .remove(files.map((f) => `${userId}/${f.name}`));
  }

  // 3) Delete the auth user. profiles/favorites/likes/memos cascade off
  //    auth.users → profiles → child tables, so this single call wipes the DB.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message ?? "delete failed" },
      { status: 500 },
    );
  }

  // 4) Clear the session cookie on the response so the client lands logged out.
  //    Client also calls signOut() — this is belt-and-suspenders.
  await supabase.auth.signOut();

  // 5) Drop a short-lived flag so /login knows to add prompt=login to the next
  //    OAuth call. Boolean signal only — no sensitive data; readable by JS
  //    because the login page client needs to consume it.
  const response = NextResponse.json({ ok: true });
  response.cookies.set(FORCE_LOGIN_COOKIE, "1", {
    path: "/",
    maxAge: FORCE_LOGIN_TTL_SECONDS,
    sameSite: "lax",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
