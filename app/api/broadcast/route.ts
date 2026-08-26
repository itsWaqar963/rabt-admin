import { NextResponse } from "next/server";
import { verifyIsAdmin } from "@/lib/admin";
import {
  executeBroadcast,
  parseBroadcastTarget,
} from "@/lib/broadcast";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Not signed in" },
      { status: 401 },
    );
  }

  const admin = await verifyIsAdmin(supabase);
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Not an admin" },
      { status: 403 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { title, body, target: rawTarget } = payload as {
    title?: unknown;
    body?: unknown;
    target?: unknown;
  };

  if (typeof title !== "string" || typeof body !== "string") {
    return NextResponse.json(
      { ok: false, error: "Title and message required" },
      { status: 400 },
    );
  }

  const target = parseBroadcastTarget(rawTarget);
  if (!target) {
    return NextResponse.json(
      { ok: false, error: "Target must be All Users or Active Users" },
      { status: 400 },
    );
  }

  const result = await executeBroadcast(supabase, user.id, {
    title,
    body,
    target,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    failed: result.failed,
    broadcastId: result.broadcastId,
  });
}
