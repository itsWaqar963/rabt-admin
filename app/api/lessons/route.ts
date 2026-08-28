import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyIsAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";

function parseOptions(raw: unknown): [string, string, string, string] | null {
  if (!Array.isArray(raw) || raw.length !== 4) return null;
  const options = raw.filter((o): o is string => typeof o === "string");
  if (options.length !== 4) return null;
  if (options.some((o) => !o.trim())) return null;
  return options as [string, string, string, string];
}

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

  const {
    youtube_url: youtubeUrl,
    question,
    options: rawOptions,
    correct_index: correctIndex,
  } = payload as {
    youtube_url?: unknown;
    question?: unknown;
    options?: unknown;
    correct_index?: unknown;
  };

  if (typeof youtubeUrl !== "string" || !youtubeUrl.trim()) {
    return NextResponse.json(
      { ok: false, error: "YouTube URL required" },
      { status: 400 },
    );
  }

  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json(
      { ok: false, error: "Question required" },
      { status: 400 },
    );
  }

  const options = parseOptions(rawOptions);
  if (!options) {
    return NextResponse.json(
      { ok: false, error: "Four non-empty options required" },
      { status: 400 },
    );
  }

  if (
    typeof correctIndex !== "number" ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex > 3
  ) {
    return NextResponse.json(
      { ok: false, error: "Correct answer must be 0–3" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("lesson_submissions").insert({
    youtube_url: youtubeUrl.trim(),
    question: question.trim(),
    options,
    correct_index: correctIndex,
    status: "approved",
    submitter_id: user.id,
    reviewed_by: user.id,
    reviewed_at: now,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  revalidatePath("/dashboard/lessons");
  return NextResponse.json({ ok: true });
}
