import { createClient } from "@/lib/supabase/server";
import {
  ErrorBanner,
  PageHeader,
} from "@/components/dashboard/table-shell";
import {
  MeetupsTable,
  type MeetupRow,
} from "@/components/dashboard/meetups-table";

export default async function MeetupsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("meetups")
    .select(
      "id, title, description, venue, city, country, host_id, date, time, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as MeetupRow[];

  return (
    <div>
      <PageHeader
        title="Meetups"
        subtitle={`${rows.length} meetup${rows.length === 1 ? "" : "s"} (max 200)`}
      />
      {error ? <ErrorBanner message={error.message} /> : null}
      {!error ? <MeetupsTable rows={rows} /> : null}
    </div>
  );
}
