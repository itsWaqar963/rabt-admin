import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/api-auth";
import { isAppScreen } from "@/lib/cms";

type TaglinePayload = {
  screen?: unknown;
  title_lead?: unknown;
  title_accent?: unknown;
  subtitle?: unknown;
};

export async function PATCH(request: Request) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

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

  const { taglines: rawTaglines } = payload as { taglines?: unknown };
  if (!Array.isArray(rawTaglines) || rawTaglines.length === 0) {
    return NextResponse.json(
      { ok: false, error: "taglines array required" },
      { status: 400 },
    );
  }

  const rows = rawTaglines.map((item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as TaglinePayload;
    const screen = typeof row.screen === "string" ? row.screen : "";
    if (!isAppScreen(screen)) return null;
    if (
      typeof row.title_lead !== "string" ||
      typeof row.title_accent !== "string" ||
      typeof row.subtitle !== "string"
    ) {
      return null;
    }
    return {
      screen,
      title_lead: row.title_lead.trim(),
      title_accent: row.title_accent.trim(),
      subtitle: row.subtitle.trim(),
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    };
  });

  if (rows.some((row) => row === null)) {
    return NextResponse.json(
      { ok: false, error: "Invalid tagline payload" },
      { status: 400 },
    );
  }

  const validRows = rows.filter((row): row is NonNullable<typeof row> => !!row);

  const { error } = await auth.supabase
    .from("app_screen_taglines")
    .upsert(validRows, { onConflict: "screen" });

  if (error) {
    const hint =
      error.message.includes("app_screen_taglines") || error.code === "42P01"
        ? "Apply migration 018_cms_taglines_banners.sql in Supabase."
        : error.message;
    return NextResponse.json({ ok: false, error: hint }, { status: 500 });
  }

  revalidatePath("/dashboard/content");
  return NextResponse.json({ ok: true });
}
