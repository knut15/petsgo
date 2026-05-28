import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "pet-avatars";

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

  // 1) Remove pet-avatar files. Storage isn't cascaded by auth.users delete,
  //    so we must wipe the user's folder explicitly first.
  const { data: files } = await admin.storage.from(BUCKET).list(userId);
  if (files?.length) {
    await admin.storage
      .from(BUCKET)
      .remove(files.map((f) => `${userId}/${f.name}`));
  }

  // 2) Delete the auth user. profiles/favorites/likes/memos cascade off
  //    auth.users → profiles → child tables, so this single call wipes the DB.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json(
      { error: deleteError.message ?? "delete failed" },
      { status: 500 },
    );
  }

  // 3) Clear the session cookie on the response so the client lands logged out.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
