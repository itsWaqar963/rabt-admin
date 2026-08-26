"use client";

import type { ReactNode } from "react";
import {
  demoteAdmin,
  promoteAdmin,
  setProfileBanned,
} from "@/lib/moderation";
import { formatRelative, truncate } from "@/lib/format";
import { ONLINE_THRESHOLD_MS } from "@/lib/presence";
import { ConfirmActionButton } from "@/components/dashboard/confirm-action-button";
import {
  EmptyState,
  TableShell,
  Td,
  Th,
} from "@/components/dashboard/table-shell";

export type AdminUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  subline: string | null;
  last_seen_at: string | null;
  updated_at: string | null;
  is_banned: boolean;
  is_admin: boolean;
};

export function UsersTable({
  rows,
  currentUserId,
}: {
  rows: AdminUserRow[];
  currentUserId: string;
}) {
  if (rows.length === 0) {
    return <EmptyState message="No profiles found." />;
  }

  const now = Date.now();

  return (
    <TableShell>
      <thead>
        <tr>
          <Th>Avatar</Th>
          <Th>Display name</Th>
          <Th>Bio</Th>
          <Th>Presence</Th>
          <Th>Last seen</Th>
          <Th>Updated</Th>
          <Th>Flags</Th>
          <Th>Actions</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const online =
            !!row.last_seen_at &&
            now - new Date(row.last_seen_at).getTime() < ONLINE_THRESHOLD_MS;
          return (
            <tr key={row.id} className="hover:bg-zinc-900/50">
              <Td>
                {row.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.avatar_url}
                    alt=""
                    className="size-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex size-7 items-center justify-center rounded-full bg-zinc-800 text-[10px] text-zinc-500">
                    ?
                  </span>
                )}
              </Td>
              <Td className="max-w-[9rem]">
                <div className="truncate font-medium text-zinc-100">
                  {row.full_name || "—"}
                </div>
                <div className="truncate text-[10px] text-zinc-500">
                  {row.email || shortEmail(row.id)}
                </div>
              </Td>
              <Td className="max-w-[12rem] text-zinc-400">
                {truncate(row.subline, 60)}
              </Td>
              <Td>
                <span
                  className={
                    online
                      ? "text-emerald-400"
                      : "text-zinc-500"
                  }
                >
                  {online ? "Online" : "Offline"}
                </span>
              </Td>
              <Td className="whitespace-nowrap text-zinc-400">
                {formatRelative(row.last_seen_at)}
              </Td>
              <Td className="whitespace-nowrap text-zinc-400">
                {formatRelative(row.updated_at)}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {row.is_admin ? (
                    <Badge tone="emerald">Admin</Badge>
                  ) : null}
                  {row.is_banned ? (
                    <Badge tone="red">Banned</Badge>
                  ) : null}
                  {!row.is_admin && !row.is_banned ? (
                    <span className="text-zinc-600">—</span>
                  ) : null}
                </div>
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {row.is_banned ? (
                    <ConfirmActionButton
                      label="Unban"
                      confirmMessage={`Unban ${row.full_name || row.id}?`}
                      variant="accent"
                      action={() => setProfileBanned(row.id, false)}
                    />
                  ) : (
                    <ConfirmActionButton
                      label="Ban"
                      confirmMessage={`Ban ${row.full_name || row.id}?`}
                      variant="danger"
                      action={() => setProfileBanned(row.id, true)}
                    />
                  )}
                  {row.is_admin ? (
                    <ConfirmActionButton
                      label="Demote"
                      confirmMessage={`Remove admin for ${row.full_name || row.id}?`}
                      variant="danger"
                      disabled={row.id === currentUserId}
                      action={() => demoteAdmin(row.id)}
                    />
                  ) : (
                    <ConfirmActionButton
                      label="Promote"
                      confirmMessage={`Promote ${row.full_name || row.id} to admin?`}
                      variant="accent"
                      action={() => promoteAdmin(row.id)}
                    />
                  )}
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "emerald" | "red";
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-950 text-emerald-300 ring-emerald-800"
      : "bg-red-950 text-red-300 ring-red-900";
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${cls}`}
    >
      {children}
    </span>
  );
}

function shortEmail(id: string) {
  return id.slice(0, 8);
}
