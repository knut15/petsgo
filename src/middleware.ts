import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase env is missing (e.g., preview without configured vars),
  // skip session refresh rather than crashing the whole request.
  if (!url || !key) {
    return response;
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const { data } = await supabase.auth.getUser();
    // If the JWT cookie still exists but the user is gone (e.g. just deleted),
    // strip every Supabase auth cookie so the client stops seeing itself as
    // logged in. Without this, the JWT decodes locally and useSession reports
    // a "signed in" user even though the server account no longer exists.
    if (!data.user) {
      const stale = request.cookies
        .getAll()
        .filter((c) => c.name.startsWith("sb-"));
      for (const c of stale) {
        response.cookies.set(c.name, "", { maxAge: 0, path: "/" });
      }
    }
  } catch (e) {
    console.error("middleware supabase error", e);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
