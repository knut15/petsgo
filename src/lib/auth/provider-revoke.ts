import "server-only";

const KAKAO_UNLINK_URL = "https://kapi.kakao.com/v1/user/unlink";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export async function revokeKakao(kakaoUserId: string): Promise<void> {
  const adminKey = process.env.KAKAO_ADMIN_KEY;
  if (!adminKey) {
    throw new Error("KAKAO_ADMIN_KEY is not set");
  }

  const body = new URLSearchParams({
    target_id_type: "user_id",
    target_id: kakaoUserId,
  });

  const res = await fetch(KAKAO_UNLINK_URL, {
    method: "POST",
    headers: {
      Authorization: `KakaoAK ${adminKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    throw new Error(`kakao unlink failed: ${res.status} ${text}`);
  }
}

// Note: Google's revoke endpoint returns 200 even for already-revoked tokens.
// 200 doesn't mean "definitely revoked just now" — only "no longer valid".
export async function revokeGoogle(token: string): Promise<void> {
  const body = new URLSearchParams({ token });

  const res = await fetch(GOOGLE_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "<no body>");
    throw new Error(`google revoke failed: ${res.status} ${text}`);
  }
}
