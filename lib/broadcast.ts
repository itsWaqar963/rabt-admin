import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";

export type BroadcastTarget = "all" | "active";

export type SendBroadcastResult =
  | { ok: true; sent: number; failed: number; broadcastId: string }
  | { ok: false; error: string; status?: number };

export function parseBroadcastTarget(raw: unknown): BroadcastTarget | null {
  if (raw === "all" || raw === "active") return raw;
  return null;
}

function assertNeverTarget(value: never): never {
  throw new Error(`Unhandled broadcast target: ${String(value)}`);
}

/** Exhaustive guard — extend when new BroadcastTarget variants are added. */
export function assertBroadcastTarget(target: BroadcastTarget): void {
  switch (target) {
    case "all":
    case "active":
      return;
    default:
      assertNeverTarget(target);
  }
}

export async function executeBroadcast(
  supabase: SupabaseClient,
  userId: string,
  input: { title: string; body: string; target: BroadcastTarget },
): Promise<SendBroadcastResult> {
  const title = input.title.trim();
  const body = input.body.trim();
  const { target } = input;

  assertBroadcastTarget(target);

  if (!title || !body) {
    return { ok: false, error: "Title and message required", status: 400 };
  }

  const pwaUrl = process.env.PWA_APP_URL?.trim().replace(/\/$/, "");
  const secret = process.env.ADMIN_BROADCAST_SECRET?.trim();
  if (!pwaUrl) {
    return { ok: false, error: "PWA_APP_URL not configured", status: 500 };
  }
  if (!secret) {
    return {
      ok: false,
      error: "ADMIN_BROADCAST_SECRET not configured",
      status: 500,
    };
  }

  const { data: row, error: insertErr } = await supabase
    .from("broadcasts")
    .insert({
      title,
      body,
      target,
      created_by: userId,
    })
    .select("id")
    .single();

  if (insertErr || !row?.id) {
    return {
      ok: false,
      error: insertErr?.message.includes("broadcasts")
        ? "Broadcasts table missing — apply migration 015_broadcasts.sql"
        : insertErr?.message ?? "Insert failed",
      status: 500,
    };
  }

  const broadcastId = row.id as string;

  let sent = 0;
  let failed = 0;

  try {
    const res = await fetch(`${pwaUrl}/api/admin-broadcast`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
        "x-rabt-admin-broadcast-secret": secret,
      },
      body: JSON.stringify({
        title,
        body,
        target,
        broadcastId,
        url: "/discover",
      }),
    });

    const json = (await res.json().catch(() => ({}))) as {
      sent?: number;
      failed?: number;
      error?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: json.error ?? `Push API HTTP ${res.status}`,
        status: 502,
      };
    }

    sent = typeof json.sent === "number" ? json.sent : 0;
    failed = typeof json.failed === "number" ? json.failed : 0;

    await supabase
      .from("broadcasts")
      .update({ push_sent: sent, push_failed: failed })
      .eq("id", broadcastId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Push request failed";
    return { ok: false, error: msg, status: 502 };
  }

  revalidatePath("/dashboard/broadcast");
  return { ok: true, sent, failed, broadcastId };
}
