import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { verifyIsAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type AdminAuthResult =
  | { ok: true; supabase: SupabaseClient; user: User }
  | { ok: false; response: NextResponse };

export async function requireAdminApi(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Not signed in" },
        { status: 401 },
      ),
    };
  }

  const admin = await verifyIsAdmin(supabase);
  if (!admin) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Not an admin" },
        { status: 403 },
      ),
    };
  }

  return { ok: true, supabase, user };
}
