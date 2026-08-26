import { createClient } from "@/lib/supabase/server";
import {
  ErrorBanner,
  PageHeader,
} from "@/components/dashboard/table-shell";
import {
  UsersTable,
  type AdminUserRow,
} from "@/components/dashboard/users-table";

const PROFILE_COLS_WITH_BAN =
  "id, full_name, email, avatar_url, subline, last_seen_at, updated_at, is_banned";
const PROFILE_COLS =
  "id, full_name, email, avatar_url, subline, last_seen_at, updated_at";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  subline: string | null;
  last_seen_at: string | null;
  updated_at: string | null;
  is_banned?: boolean | null;
};

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profiles: ProfileRow[] | null = null;
  let fetchError: string | null = null;

  const withBan = await supabase
    .from("profiles")
    .select(PROFILE_COLS_WITH_BAN)
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (withBan.error) {
    const msg = withBan.error.message;
    const missingBan =
      msg.includes("is_banned") || withBan.error.code === "42703";
    if (missingBan) {
      const fallback = await supabase
        .from("profiles")
        .select(PROFILE_COLS)
        .order("last_seen_at", { ascending: false, nullsFirst: false })
        .limit(200);
      if (fallback.error) {
        fetchError = fallback.error.message;
      } else {
        profiles = fallback.data as ProfileRow[];
      }
    } else {
      fetchError = msg;
    }
  } else {
    profiles = withBan.data as ProfileRow[];
  }

  const adminIds = new Set<string>();
  const adminsRes = await supabase.from("admin_users").select("user_id");
  if (!adminsRes.error && adminsRes.data) {
    for (const a of adminsRes.data) {
      adminIds.add(a.user_id as string);
    }
  }

  const rows: AdminUserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    avatar_url: p.avatar_url,
    subline: p.subline,
    last_seen_at: p.last_seen_at,
    updated_at: p.updated_at,
    is_banned: p.is_banned === true,
    is_admin: adminIds.has(p.id),
  }));

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${rows.length} profile${rows.length === 1 ? "" : "s"} (max 200)`}
      />
      {fetchError ? <ErrorBanner message={fetchError} /> : null}
      {!fetchError ? (
        <UsersTable rows={rows} currentUserId={user?.id ?? ""} />
      ) : null}
    </div>
  );
}
