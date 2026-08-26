import { NextResponse } from "next/server";
import { verifyIsAdmin } from "@/lib/admin";
import { getAppOrigin, safeNextPath } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin: requestOrigin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const appOrigin = getAppOrigin(requestOrigin) || requestOrigin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const admin = await verifyIsAdmin(supabase);
      if (!admin) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${appOrigin}/login?error=not_admin`);
      }
      return NextResponse.redirect(`${appOrigin}${next}`);
    }
  }

  return NextResponse.redirect(`${appOrigin}/login?error=auth`);
}
