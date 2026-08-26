import { NextResponse } from "next/server";
import { verifyIsAdmin } from "@/lib/admin";
import { getAppOrigin, safeNextPath } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

const AUTH_NEXT_COOKIE = "rabt_admin_auth_next";

function redirectClearingAuthNext(url: string, request: Request) {
  const response = NextResponse.redirect(url);
  if (request.headers.get("cookie")?.includes(AUTH_NEXT_COOKIE)) {
    response.cookies.set(AUTH_NEXT_COOKIE, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
  }
  return response;
}

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const appOrigin = getAppOrigin(requestOrigin) || requestOrigin;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookieMatch = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${AUTH_NEXT_COOKIE}=([^;]*)`),
  );
  const fromCookie = cookieMatch
    ? decodeURIComponent(cookieMatch[1] ?? "")
    : null;

  // Prefer recovery → update-password; else cookie; else query next; else /dashboard.
  let next: string;
  if (type === "recovery") {
    next = "/auth/update-password";
  } else {
    next = safeNextPath(fromCookie ?? searchParams.get("next"));
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const admin = await verifyIsAdmin(supabase);
      if (!admin) {
        await supabase.auth.signOut();
        return redirectClearingAuthNext(
          `${appOrigin}/login?error=not_admin`,
          request,
        );
      }
      return redirectClearingAuthNext(`${appOrigin}${next}`, request);
    }
  }

  return redirectClearingAuthNext(`${appOrigin}/login?error=auth`, request);
}
