import { createClient } from "@/lib/supabase/server";
import { BroadcastForm } from "@/components/dashboard/broadcast-form";
import {
  EmptyState,
  ErrorBanner,
  PageHeader,
  TableShell,
  Td,
  Th,
} from "@/components/dashboard/table-shell";
import { formatRelative, truncate } from "@/lib/format";

type BroadcastRow = {
  id: string;
  title: string;
  body: string;
  target: string;
  created_at: string | null;
  push_sent: number;
  push_failed: number;
};

export default async function BroadcastPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("broadcasts")
    .select("id, title, body, target, created_at, push_sent, push_failed")
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = (data ?? []) as BroadcastRow[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcast"
        subtitle="Push announce to PWA subscribers"
      />

      <BroadcastForm />

      <div>
        <h2 className="mb-2 text-sm font-medium text-zinc-300">
          Recent broadcasts
        </h2>
        {error ? (
          <ErrorBanner
            message={
              error.message.includes("broadcasts") || error.code === "42P01"
                ? "Apply migration 015_broadcasts.sql in Supabase, then refresh."
                : error.message
            }
          />
        ) : null}
        {!error && rows.length === 0 ? (
          <EmptyState message="No broadcasts yet" />
        ) : null}
        {!error && rows.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Title</Th>
                <Th>Target</Th>
                <Th>Sent</Th>
                <Th>Failed</Th>
                <Th>Body</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-900/40">
                  <Td className="whitespace-nowrap text-zinc-500">
                    {formatRelative(r.created_at)}
                  </Td>
                  <Td className="font-medium text-zinc-100">
                    {truncate(r.title, 40)}
                  </Td>
                  <Td>
                    <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                      {r.target}
                    </span>
                  </Td>
                  <Td className="tabular-nums text-emerald-400/90">
                    {r.push_sent}
                  </Td>
                  <Td className="tabular-nums text-zinc-400">
                    {r.push_failed}
                  </Td>
                  <Td className="max-w-[220px] text-zinc-500">
                    {truncate(r.body, 60)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : null}
      </div>
    </div>
  );
}
