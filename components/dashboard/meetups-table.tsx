"use client";

import { deleteMeetup } from "@/lib/moderation";
import { formatRelative, shortId, truncate } from "@/lib/format";
import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import {
  EmptyState,
  TableShell,
  Td,
  Th,
} from "@/components/dashboard/table-shell";

export type MeetupRow = {
  id: string;
  title: string;
  description: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  host_id: string;
  date: string | null;
  time: string | null;
  created_at: string | null;
};

export function MeetupsTable({ rows }: { rows: MeetupRow[] }) {
  if (rows.length === 0) {
    return <EmptyState message="No meetups found." />;
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <Th>Title</Th>
          <Th>Description</Th>
          <Th>Location</Th>
          <Th>Host</Th>
          <Th>When</Th>
          <Th>Created</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const loc = [row.venue, row.city, row.country]
            .filter(Boolean)
            .join(" · ");
          const when = [row.date, row.time].filter(Boolean).join(" ");
          return (
            <tr key={row.id} className="hover:bg-zinc-900/50">
              <Td className="max-w-[10rem] font-medium text-zinc-100">
                {truncate(row.title, 48)}
              </Td>
              <Td className="max-w-[14rem] text-zinc-400">
                {truncate(row.description, 72)}
              </Td>
              <Td className="max-w-[12rem] text-zinc-400">
                {loc || "—"}
              </Td>
              <Td className="font-mono text-[10px] text-zinc-500">
                {shortId(row.host_id)}
              </Td>
              <Td className="whitespace-nowrap text-zinc-400">
                {when || "—"}
              </Td>
              <Td className="whitespace-nowrap text-zinc-400">
                {formatRelative(row.created_at)}
              </Td>
              <Td>
                <ConfirmActionButton
                  label="Delete"
                  confirmMessage={`Delete meetup “${row.title}”? This cannot be undone.`}
                  variant="danger"
                  action={() => deleteMeetup(row.id)}
                />
              </Td>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}
