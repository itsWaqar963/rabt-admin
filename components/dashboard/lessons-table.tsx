"use client";

import { reviewLesson } from "@/lib/moderation";
import { formatRelative, shortId, truncate } from "@/lib/format";
import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import {
  EmptyState,
  TableShell,
  Td,
  Th,
} from "@/components/dashboard/table-shell";

export type LessonStatus = "pending" | "approved" | "rejected";

export type LessonRow = {
  id: string;
  youtube_url: string;
  question: string;
  status: LessonStatus;
  submitter_id: string;
  created_at: string | null;
};

export function LessonsTable({ rows }: { rows: LessonRow[] }) {
  if (rows.length === 0) {
    return <EmptyState message="No lesson submissions." />;
  }

  return (
    <TableShell>
      <thead>
        <tr>
          <Th>YouTube</Th>
          <Th>Question</Th>
          <Th>Status</Th>
          <Th>Submitter</Th>
          <Th>Created</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          let statusClass: string;
          switch (row.status) {
            case "pending":
              statusClass = "text-amber-300";
              break;
            case "approved":
              statusClass = "text-emerald-300";
              break;
            case "rejected":
              statusClass = "text-red-300";
              break;
            default: {
              const _exhaustive: never = row.status;
              statusClass = String(_exhaustive);
            }
          }
          return (
            <tr key={row.id} className="hover:bg-zinc-900/50">
              <Td className="max-w-[12rem]">
                <a
                  href={row.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sky-400 hover:underline"
                >
                  {truncate(row.youtube_url, 40)}
                </a>
              </Td>
              <Td className="max-w-[16rem] text-zinc-300">
                {truncate(row.question, 80)}
              </Td>
              <Td className={`capitalize ${statusClass}`}>{row.status}</Td>
              <Td className="font-mono text-[10px] text-zinc-500">
                {shortId(row.submitter_id)}
              </Td>
              <Td className="whitespace-nowrap text-zinc-400">
                {formatRelative(row.created_at)}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  <ConfirmActionButton
                    label="Approve"
                    confirmMessage="Approve this lesson submission?"
                    variant="accent"
                    disabled={row.status === "approved"}
                    action={() => reviewLesson(row.id, "approved")}
                  />
                  <ConfirmActionButton
                    label="Reject"
                    confirmMessage="Reject this lesson submission?"
                    variant="danger"
                    disabled={row.status === "rejected"}
                    action={() => reviewLesson(row.id, "rejected")}
                  />
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}
