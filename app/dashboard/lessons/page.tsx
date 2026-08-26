import { createClient } from "@/lib/supabase/server";
import {
  ErrorBanner,
  PageHeader,
} from "@/components/dashboard/table-shell";
import {
  LessonsTable,
  type LessonRow,
  type LessonStatus,
} from "@/components/dashboard/lessons-table";

function isLessonStatus(v: string): v is LessonStatus {
  return v === "pending" || v === "approved" || v === "rejected";
}

function statusRank(s: LessonStatus): number {
  switch (s) {
    case "pending":
      return 0;
    case "approved":
      return 1;
    case "rejected":
      return 2;
    default: {
      const _exhaustive: never = s;
      void _exhaustive;
      return 99;
    }
  }
}

export default async function LessonsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_submissions")
    .select("id, youtube_url, question, status, submitter_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows: LessonRow[] = (data ?? [])
    .map((r) => {
      const statusRaw = String(r.status ?? "pending");
      const status: LessonStatus = isLessonStatus(statusRaw)
        ? statusRaw
        : "pending";
      return {
        id: r.id as string,
        youtube_url: r.youtube_url as string,
        question: r.question as string,
        status,
        submitter_id: r.submitter_id as string,
        created_at: (r.created_at as string | null) ?? null,
      };
    })
    .sort((a, b) => {
      const rank = statusRank(a.status) - statusRank(b.status);
      if (rank !== 0) return rank;
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

  return (
    <div>
      <PageHeader
        title="Lessons"
        subtitle={`${rows.length} submission${rows.length === 1 ? "" : "s"} (pending first)`}
      />
      {error ? <ErrorBanner message={error.message} /> : null}
      {!error ? <LessonsTable rows={rows} /> : null}
    </div>
  );
}
