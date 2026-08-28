"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelative, truncate } from "@/lib/format";
import {
  EmptyState,
  TableShell,
  Td,
  Th,
} from "@/components/dashboard/table-shell";

export type BannerRow = {
  id: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export function BannersPanel({ initial }: { initial: BannerRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (editingId) {
        await handleUpdate(editingId, {
          image_url: imageUrl,
          link_url: linkUrl,
        });
        return;
      }

      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ image_url: imageUrl, link_url: linkUrl }),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        banner?: BannerRow;
        error?: string;
      } | null;
      if (!json?.ok || !json.banner) {
        setError(json?.error ?? `Create failed (HTTP ${res.status})`);
        return;
      }
      setRows((prev) => [json.banner as BannerRow, ...prev]);
      setImageUrl("");
      setLinkUrl("");
      void refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  async function handleUpdate(id: string, patch: Partial<BannerRow>) {
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(patch),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        banner?: BannerRow;
        error?: string;
      } | null;
      if (!json?.ok || !json.banner) {
        setError(json?.error ?? `Update failed (HTTP ${res.status})`);
        return;
      }
      setRows((prev) =>
        prev.map((row) => (row.id === id ? (json.banner as BannerRow) : row)),
      );
      setEditingId(null);
      setImageUrl("");
      setLinkUrl("");
      void refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this banner?")) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/banners/${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!json?.ok) {
        setError(json?.error ?? `Delete failed (HTTP ${res.status})`);
        return;
      }
      setRows((prev) => prev.filter((row) => row.id !== id));
      if (editingId === id) setEditingId(null);
      void refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-4"
      >
        <h2 className="text-sm font-semibold text-zinc-100">
          {editingId ? "Edit banner" : "Create banner"}
        </h2>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">Image URL</span>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">Link URL</span>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            required
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {pending ? "Saving…" : editingId ? "Update banner" : "Create banner"}
          </button>
          {editingId ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setEditingId(null);
                setImageUrl("");
                setLinkUrl("");
              }}
              className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState message="No banners yet." />
      ) : (
        <TableShell>
          <thead>
            <tr>
              <Th>Preview</Th>
              <Th>Link</Th>
              <Th>Status</Th>
              <Th>Created</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-zinc-900/50">
                <Td>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.image_url}
                    alt=""
                    className="h-12 w-20 rounded border border-zinc-800 object-cover"
                  />
                </Td>
                <Td className="max-w-[14rem]">
                  <a
                    href={row.link_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:underline"
                  >
                    {truncate(row.link_url, 48)}
                  </a>
                </Td>
                <Td className={row.is_active ? "text-emerald-300" : "text-zinc-500"}>
                  {row.is_active ? "Active" : "Paused"}
                </Td>
                <Td className="whitespace-nowrap text-zinc-400">
                  {formatRelative(row.created_at)}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        setEditingId(row.id);
                        setImageUrl(row.image_url);
                        setLinkUrl(row.link_url);
                      }}
                      className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        void handleUpdate(row.id, { is_active: !row.is_active })
                      }
                      className="rounded border border-zinc-700 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
                    >
                      {row.is_active ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => void handleDelete(row.id)}
                      className="rounded border border-red-900/60 px-2 py-1 text-[11px] text-red-300 hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
