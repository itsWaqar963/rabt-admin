import { createClient } from "@/lib/supabase/server";
import {
  ErrorBanner,
  PageHeader,
} from "@/components/dashboard/table-shell";
import {
  ReportsTable,
  type UnifiedReport,
} from "@/components/dashboard/reports-table";

export default async function ReportsPage() {
  const supabase = await createClient();

  const [userRes, meetupRes] = await Promise.all([
    supabase
      .from("user_reports")
      .select("id, reporter_id, reported_user_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("meetup_reports")
      .select("id, reporter_id, meetup_id, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const errors: string[] = [];
  if (userRes.error) errors.push(`user_reports: ${userRes.error.message}`);
  if (meetupRes.error) {
    errors.push(`meetup_reports: ${meetupRes.error.message}`);
  }

  const rows: UnifiedReport[] = [];

  for (const r of userRes.data ?? []) {
    rows.push({
      kind: "user",
      id: r.id as string,
      reporter_id: r.reporter_id as string,
      target_id: r.reported_user_id as string,
      reason: (r.reason as string | null) ?? null,
      created_at: (r.created_at as string | null) ?? null,
    });
  }
  for (const r of meetupRes.data ?? []) {
    rows.push({
      kind: "meetup",
      id: r.id as string,
      reporter_id: r.reporter_id as string,
      target_id: r.meetup_id as string,
      reason: (r.reason as string | null) ?? null,
      created_at: (r.created_at as string | null) ?? null,
    });
  }

  rows.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={`${rows.length} open report${rows.length === 1 ? "" : "s"}`}
      />
      {errors.length > 0 ? (
        <ErrorBanner message={errors.join(" · ")} />
      ) : null}
      {errors.length === 0 ? <ReportsTable rows={rows} /> : null}
    </div>
  );
}
