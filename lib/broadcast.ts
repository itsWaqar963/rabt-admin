"use server";

import { revalidatePath } from "next/cache";
import { verifyIsAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

export type BroadcastTarget = "all" | "active";

export type SendBroadcastResult =
  | { ok: true; sent: number; failed: number; broadcastId: string }
  | { ok: false; error: string };

function parseTarget(raw: FormDataEntryValue | null): BroadcastTarget | null {
  if (raw === "all" || raw === "active") return raw;
  return null;
}

export async function sendBroadcast(
  formData: FormData,
): Promise<SendBroadcastResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in" };

  const admin = await verifyIsAdmin(supabase);
  if (!admin) return { ok: false, error: "Not an admin" };

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const target = parseTarget(formData.get("target"));

  if (!title || !body) {
    return { ok: false, error: "Title and message required" };
  }
  if (!target) {
    return { ok: false, error: "Target must be All Users or Active Users" };
  }

  const pwaUrl = process.env.PWA_APP_URL?.trim().replace(/\/$/, "");
  const secret = process.env.ADMIN_BROADCAST_SECRET?.trim();
  if (!pwaUrl) {
    return { ok: false, error: "PWA_APP_URL not configured" };
  }
  if (!secret) {
    return { ok: false, error: "ADMIN_BROADCAST_SECRET not configured" };
  }

  const { data: row, error: insertErr } = await supabase
    .from("broadcasts")
    .insert({
      title,
      body,
      target,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr || !row?.id) {
    return {
      ok: false,
      error: insertErr?.message.includes("broadcasts")
        ? "Broadcasts table missing — apply migration 015_broadcasts.sql"
        : insertErr?.message ?? "Insert failed",
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
    return { ok: false, error: msg };
  }

  revalidatePath("/dashboard/broadcast");
  return { ok: true, sent, failed, broadcastId };
}
