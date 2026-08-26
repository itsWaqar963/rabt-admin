"use client";

import { dismissReport } from "@/lib/moderation";
import { formatRelative, shortId, truncate } from "@/lib/format";
import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import {
  EmptyState,
  TableShell,
  Td,
  Th,
} from "@/components/dashboard/table-shell";

export type ReportKind = "user" | "meetup";

export type UnifiedReport = {
  kind: ReportKind;
  id: string;
  reporter_id: string;
  target_id: string;
  reason: string | null;
  created_at: string | null;
};

export function ReportsTable({ rows }: { rows: UnifiedReport[] }) {
  if (rows.length === 0) {
    return <EmptyState message="No open reports." />;
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <Th>Kind</Th>
          <Th>Reporter</Th>
          <Th>Target</Th>
          <Th>Reason</Th>
          <Th>Created</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          let kindLabel: string;
          switch (row.kind) {
            case "user":
              kindLabel = "User";
              break;
            case "meetup":
              kindLabel = "Meetup";
              break;
            default: {
              const _exhaustive: never = row.kind;
              kindLabel = String(_exhaustive);
            }
          }
          return (
            <tr key={`${row.kind}-${row.id}`} className="hover:bg-zinc-900/50">
              <Td>
                <span
                  className={
                    row.kind === "user"
                      ? "text-sky-300"
                      : "text-amber-300"
                  }
                >
                  {kindLabel}
                </span>
              </Td>
              <Td className="font-mono text-[10px] text-zinc-500">
                {shortId(row.reporter_id)}
              </Td>
              <Td className="font-mono text-[10px] text-zinc-500">
                {shortId(row.target_id)}
              </Td>
              <Td className="max-w-[16rem] text-zinc-400">
                {truncate(row.reason, 100)}
              </Td>
              <Td className="whitespace-nowrap text-zinc-400">
                {formatRelative(row.created_at)}
              </Td>
              <Td>
                <ConfirmActionButton
                  label="Dismiss"
                  confirmMessage="Dismiss (delete) this report?"
                  variant="danger"
                  action={() => dismissReport(row.kind, row.id)}
                />
              </Td>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}
