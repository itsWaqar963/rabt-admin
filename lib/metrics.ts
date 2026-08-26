import type { SupabaseClient } from "@supabase/supabase-js";
import { ONLINE_THRESHOLD_MS } from "@/lib/presence";

export type DashboardMetrics = {
  totalUsers: number;
  onlineNow: number;
  offline: number;
  totalMeetups: number;
  openReports: number;
};

export type MetricsFetchResult =
  | { ok: true; metrics: DashboardMetrics }
  | { ok: false; error: string; metrics: null };

function countOrThrow(
  label: string,
  count: number | null,
  error: { message: string } | null,
): number {
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  return count ?? 0;
}

/** Fetch dashboard counts via authenticated admin client (RLS + is_admin). */
export async function fetchDashboardMetrics(
  supabase: SupabaseClient,
): Promise<MetricsFetchResult> {
  try {
    const since = new Date(Date.now() - ONLINE_THRESHOLD_MS).toISOString();

    const [usersRes, onlineRes, meetupsRes, userReportsRes, meetupReportsRes] =
      await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("last_seen_at", since),
        supabase.from("meetups").select("*", { count: "exact", head: true }),
        supabase
          .from("user_reports")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("meetup_reports")
          .select("*", { count: "exact", head: true }),
      ]);

    const totalUsers = countOrThrow(
      "profiles",
      usersRes.count,
      usersRes.error,
    );
    const onlineNow = countOrThrow(
      "profiles online",
      onlineRes.count,
      onlineRes.error,
    );
    const totalMeetups = countOrThrow(
      "meetups",
      meetupsRes.count,
      meetupsRes.error,
    );
    const userReports = countOrThrow(
      "user_reports",
      userReportsRes.count,
      userReportsRes.error,
    );
    const meetupReports = countOrThrow(
      "meetup_reports",
      meetupReportsRes.count,
      meetupReportsRes.error,
    );

    const openReports = userReports + meetupReports;
    const offline = Math.max(0, totalUsers - onlineNow);

    return {
      ok: true,
      metrics: {
        totalUsers,
        onlineNow,
        offline,
        totalMeetups,
        openReports,
      },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch metrics";
    return { ok: false, error: message, metrics: null };
  }
}
