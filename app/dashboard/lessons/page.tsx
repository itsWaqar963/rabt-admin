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

function parseOptions(raw: unknown): [string, string, string, string] | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const options = raw.filter((o): o is string => typeof o === "string");
  if (options.length !== 4) return null;
  return options as [string, string, string, string];
}

export default async function LessonsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_submissions")
    .select(
      "id, youtube_url, question, options, correct_index, status, submitter_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const submitterIds = [
    ...new Set(
      (data ?? [])
        .map((r) => r.submitter_id as string)
        .filter((id) => typeof id === "string" && id.length > 0),
    ),
  ];

  const profileById = new Map<
    string,
    { full_name: string | null; avatar_url: string | null }
  >();
  if (submitterIds.length > 0) {
    const profilesRes = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", submitterIds);
    if (!profilesRes.error && profilesRes.data) {
      for (const p of profilesRes.data) {
        profileById.set(p.id as string, {
          full_name: (p.full_name as string | null) ?? null,
          avatar_url: (p.avatar_url as string | null) ?? null,
        });
      }
    }
  }

  const contributionCounts = new Map<string, number>();
  const countsRes = await supabase
    .from("lesson_submissions")
    .select("submitter_id");
  if (!countsRes.error && countsRes.data) {
    for (const row of countsRes.data) {
      const id = row.submitter_id as string;
      contributionCounts.set(id, (contributionCounts.get(id) ?? 0) + 1);
    }
  }

  const rows: LessonRow[] = (data ?? [])
    .map((r) => {
      const statusRaw = String(r.status ?? "pending");
      const status: LessonStatus = isLessonStatus(statusRaw)
        ? statusRaw
        : "pending";
      const options = parseOptions(r.options);
      const submitterId = r.submitter_id as string;
      const profile = profileById.get(submitterId);
      return {
        id: r.id as string,
        youtube_url: r.youtube_url as string,
        question: r.question as string,
        options,
        correct_index: typeof r.correct_index === "number" ? r.correct_index : 0,
        status,
        submitter_id: submitterId,
        submitterName: profile?.full_name ?? null,
        submitterAvatar: profile?.avatar_url ?? null,
        contributionCount: contributionCounts.get(submitterId) ?? 1,
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
