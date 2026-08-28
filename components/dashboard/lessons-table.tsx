"use client";

import { useState } from "react";
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
  options: [string, string, string, string] | null;
  correct_index: number;
  status: LessonStatus;
  submitter_id: string;
  submitterName: string | null;
  submitterAvatar: string | null;
  contributionCount: number;
  is_own_channel: boolean;
  channel_title: string | null;
  channel_avatar_url: string | null;
  created_at: string | null;
};

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

function SubmitterCell({ row }: { row: LessonRow }) {
  const displayName = row.submitterName?.trim() || shortId(row.submitter_id);
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex min-w-[9rem] items-center gap-2">
      {row.submitterAvatar ? (
        <img
          src={row.submitterAvatar}
          alt=""
          className="size-7 shrink-0 rounded-full border border-zinc-700 object-cover"
        />
      ) : (
        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-zinc-700 bg-zinc-800 text-[10px] font-semibold text-zinc-300">
          {initial}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-zinc-200">{displayName}</p>
        <p className="text-[10px] text-zinc-500">
          ({row.contributionCount}{" "}
          {row.contributionCount === 1 ? "contribution" : "contributions"})
        </p>
      </div>
    </div>
  );
}

function LessonDetailModal({
  row,
  onClose,
}: {
  row: LessonRow;
  onClose: () => void;
}) {
  const options = row.options ?? ["—", "—", "—", "—"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2
            id="lesson-detail-title"
            className="text-sm font-semibold text-zinc-50"
          >
            Lesson details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <dl className="space-y-3 text-xs">
          <div>
            <dt className="font-medium text-zinc-500">YouTube</dt>
            <dd className="mt-0.5">
              <a
                href={row.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="break-all text-sky-400 hover:underline"
              >
                {row.youtube_url}
              </a>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Question</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-zinc-200">
              {row.question}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Options</dt>
            <dd className="mt-1 space-y-1">
              {OPTION_LABELS.map((label, i) => {
                const isCorrect = i === row.correct_index;
                return (
                  <p
                    key={label}
                    className={
                      isCorrect
                        ? "rounded border border-emerald-900/60 bg-emerald-950/40 px-2 py-1 text-emerald-200"
                        : "rounded border border-zinc-800 px-2 py-1 text-zinc-300"
                    }
                  >
                    <span className="font-mono text-zinc-500">{label}.</span>{" "}
                    {options[i]}
                    {isCorrect ? (
                      <span className="ml-2 font-medium text-emerald-400">
                        (correct)
                      </span>
                    ) : null}
                  </p>
                );
              })}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Own channel</dt>
            <dd className="mt-0.5 text-zinc-200">
              {row.is_own_channel ? "Yes" : "No"}
            </dd>
          </div>
          {row.channel_title ? (
            <div>
              <dt className="font-medium text-zinc-500">Channel</dt>
              <dd className="mt-1 flex items-center gap-2">
                {row.channel_avatar_url ? (
                  <img
                    src={row.channel_avatar_url}
                    alt=""
                    className="size-6 rounded-full border border-zinc-700 object-cover"
                  />
                ) : null}
                <span className="text-zinc-200">{row.channel_title}</span>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="font-medium text-zinc-500">Status</dt>
            <dd className="mt-0.5 capitalize text-zinc-200">{row.status}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Submitter</dt>
            <dd className="mt-1">
              <SubmitterCell row={row} />
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Created</dt>
            <dd className="mt-0.5 text-zinc-300">
              {formatRelative(row.created_at)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap gap-1 border-t border-zinc-800 pt-3">
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
      </div>
    </div>
  );
}

function CreateLessonModal({ onClose }: { onClose: () => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [isOwnChannel, setIsOwnChannel] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-lesson-title"
      onClick={onClose}
    >
      <form
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-md border border-zinc-700 bg-zinc-950 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const fd = new FormData(form);
          const youtube_url = String(fd.get("youtube_url") ?? "").trim();
          const question = String(fd.get("question") ?? "").trim();
          const options = [
            String(fd.get("option_0") ?? "").trim(),
            String(fd.get("option_1") ?? "").trim(),
            String(fd.get("option_2") ?? "").trim(),
            String(fd.get("option_3") ?? "").trim(),
          ] as [string, string, string, string];

          setError(null);
          setPending(true);
          try {
            const res = await fetch("/api/lessons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({
                youtube_url,
                question,
                options,
                correct_index: correctIndex,
                is_own_channel: isOwnChannel,
              }),
            });
            const json = (await res.json().catch(() => null)) as {
              ok?: boolean;
              error?: string;
            } | null;
            if (!json?.ok) {
              setError(json?.error ?? `Request failed (HTTP ${res.status})`);
              return;
            }
            onClose();
            window.location.reload();
          } catch {
            setError("Network error — try again");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2
            id="create-lesson-title"
            className="text-sm font-semibold text-zinc-50"
          >
            Create lesson
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400 hover:bg-zinc-900"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="space-y-1">
            <label htmlFor="cl-youtube" className="font-medium text-zinc-400">
              YouTube URL
            </label>
            <input
              id="cl-youtube"
              name="youtube_url"
              required
              disabled={pending}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-zinc-300">
            <input
              type="checkbox"
              checked={isOwnChannel}
              disabled={pending}
              onChange={(e) => setIsOwnChannel(e.target.checked)}
              className="accent-emerald-500"
            />
            <span>This is my own YouTube channel</span>
          </label>
          <div className="space-y-1">
            <label htmlFor="cl-question" className="font-medium text-zinc-400">
              Question
            </label>
            <textarea
              id="cl-question"
              name="question"
              required
              rows={3}
              disabled={pending}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-700 focus:outline-none"
            />
          </div>
          {OPTION_LABELS.map((label, i) => (
            <div key={label} className="space-y-1">
              <label
                htmlFor={`cl-option-${i}`}
                className="font-medium text-zinc-400"
              >
                Option {label}
              </label>
              <input
                id={`cl-option-${i}`}
                name={`option_${i}`}
                required
                disabled={pending}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-700 focus:outline-none"
              />
            </div>
          ))}
          <fieldset className="space-y-1.5">
            <legend className="font-medium text-zinc-400">Correct answer</legend>
            <div className="flex flex-wrap gap-3">
              {OPTION_LABELS.map((label, i) => (
                <label
                  key={label}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-zinc-300"
                >
                  <input
                    type="radio"
                    name="correct_index_ui"
                    value={i}
                    checked={correctIndex === i}
                    disabled={pending}
                    onChange={() => setCorrectIndex(i)}
                    className="accent-emerald-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {error ? (
          <p className="mt-3 text-[11px] text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-950/70 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create approved lesson"}
        </button>
      </form>
    </div>
  );
}

export function LessonsTable({ rows }: { rows: LessonRow[] }) {
  const [detailRow, setDetailRow] = useState<LessonRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-md border border-emerald-900/60 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-950/50"
        >
          Create Lesson
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No lesson submissions." />
      ) : (
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
                  <Td>
                    <SubmitterCell row={row} />
                  </Td>
                  <Td className="whitespace-nowrap text-zinc-400">
                    {formatRelative(row.created_at)}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailRow(row)}
                        className="rounded border border-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-800"
                      >
                        View Details
                      </button>
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
      )}

      {detailRow ? (
        <LessonDetailModal row={detailRow} onClose={() => setDetailRow(null)} />
      ) : null}
      {createOpen ? (
        <CreateLessonModal onClose={() => setCreateOpen(false)} />
      ) : null}
    </>
  );
}
