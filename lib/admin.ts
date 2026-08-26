import type { SupabaseClient } from "@supabase/supabase-js";

/** True when auth.uid() is listed in public.admin_users (via is_admin RPC). */
export async function verifyIsAdmin(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    const { data: row } = await supabase
      .from("admin_users")
      .select("user_id")
      .maybeSingle();
    return !!row;
  }
  return data === true;
}
