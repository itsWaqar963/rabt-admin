"use client";

import { useState } from "react";
import {
  APP_SCREENS,
  screenLabel,
  type AppScreen,
  type TaglineRow,
} from "@/lib/cms";

export function ContentForm({ initial }: { initial: TaglineRow[] }) {
  const [rows, setRows] = useState<TaglineRow[]>(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateRow(screen: AppScreen, patch: Partial<TaglineRow>) {
    setRows((prev) =>
      prev.map((row) => (row.screen === screen ? { ...row, ...patch } : row)),
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setMessage(null);
        setError(null);
        try {
          const res = await fetch("/api/content/taglines", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ taglines: rows }),
          });
          const json = (await res.json().catch(() => null)) as {
            ok?: boolean;
            error?: string;
          } | null;
          if (!json?.ok) {
            setError(json?.error ?? `Request failed (HTTP ${res.status})`);
            return;
          }
          setMessage("Taglines saved.");
        } catch {
          setError("Network error");
        } finally {
          setPending(false);
        }
      }}
    >
      {APP_SCREENS.map((screen) => {
        const row = rows.find((r) => r.screen === screen);
        if (!row) return null;
        return (
          <section
            key={screen}
            className="space-y-3 rounded-md border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <h2 className="text-sm font-semibold text-zinc-100">
              {screenLabel(screen)}
            </h2>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-400">Title lead</span>
              <input
                name={`${screen}-lead`}
                value={row.title_lead}
                onChange={(e) =>
                  updateRow(screen, { title_lead: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-400">Title accent</span>
              <input
                name={`${screen}-accent`}
                value={row.title_accent}
                onChange={(e) =>
                  updateRow(screen, { title_accent: e.target.value })
                }
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-emerald-300"
                required
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-400">Subtitle</span>
              <textarea
                name={`${screen}-subtitle`}
                value={row.subtitle}
                onChange={(e) =>
                  updateRow(screen, { subtitle: e.target.value })
                }
                rows={3}
                className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                required
              />
            </label>
          </section>
        );
      })}

      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save taglines"}
      </button>
    </form>
  );
}
