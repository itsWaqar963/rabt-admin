"use client";

import { useState } from "react";
import type { SendBroadcastResult } from "@/lib/broadcast";

export function BroadcastForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<SendBroadcastResult | null>(null);

  return (
    <form
      className="space-y-4 rounded-md border border-zinc-800 bg-zinc-900/50 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const title = String(fd.get("title") ?? "").trim();
        const body = String(fd.get("body") ?? "").trim();
        const target = String(fd.get("target") ?? "all");

        setResult(null);
        setPending(true);
        try {
          const res = await fetch("/api/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ title, body, target }),
          });

          const json = (await res.json().catch(() => null)) as
            | SendBroadcastResult
            | null;

          if (!json || typeof json !== "object") {
            setResult({
              ok: false,
              error: `Request failed (HTTP ${res.status})`,
            });
            return;
          }

          if (!json.ok) {
            setResult({
              ok: false,
              error:
                "error" in json && typeof json.error === "string"
                  ? json.error
                  : `Request failed (HTTP ${res.status})`,
            });
            return;
          }

          setResult(json);
          form.reset();
        } catch {
          setResult({ ok: false, error: "Network error — try again" });
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="space-y-1.5">
        <label htmlFor="bc-title" className="block text-xs font-medium text-zinc-400">
          Title
        </label>
        <input
          id="bc-title"
          name="title"
          required
          maxLength={120}
          disabled={pending}
          placeholder="Announcement title"
          className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-700 focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="bc-body" className="block text-xs font-medium text-zinc-400">
          Message
        </label>
        <textarea
          id="bc-body"
          name="body"
          required
          maxLength={500}
          rows={4}
          disabled={pending}
          placeholder="Push notification body"
          className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-700 focus:outline-none"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium text-zinc-400">Target</legend>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
          <input
            type="radio"
            name="target"
            value="all"
            defaultChecked
            disabled={pending}
            className="accent-emerald-500"
          />
          All Users
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-200">
          <input
            type="radio"
            name="target"
            value="active"
            disabled={pending}
            className="accent-emerald-500"
          />
          Active Users
          <span className="text-xs text-zinc-500">(last 2 min)</span>
        </label>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-emerald-800/60 bg-emerald-950/40 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-950/70 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send broadcast"}
      </button>

      {result?.ok ? (
        <p
          role="status"
          className="rounded-md border border-emerald-900/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200"
        >
          Sent {result.sent} · failed {result.failed}
        </p>
      ) : null}
      {result && !result.ok ? (
        <p
          role="alert"
          className="rounded-md border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200"
        >
          {result.error}
        </p>
      ) : null}
    </form>
  );
}
