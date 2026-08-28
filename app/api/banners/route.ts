import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("app_banners")
    .select("id, image_url, link_url, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    const hint =
      error.message.includes("app_banners") || error.code === "42P01"
        ? "Apply migration 018_cms_taglines_banners.sql in Supabase."
        : error.message;
    return NextResponse.json({ ok: false, error: hint }, { status: 500 });
  }

  return NextResponse.json({ ok: true, banners: data ?? [] });
}

export async function POST(request: Request) {
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

  const { image_url: rawImage, link_url: rawLink } = payload as {
    image_url?: unknown;
    link_url?: unknown;
  };

  if (typeof rawImage !== "string" || typeof rawLink !== "string") {
    return NextResponse.json(
      { ok: false, error: "image_url and link_url required" },
      { status: 400 },
    );
  }

  const image_url = rawImage.trim();
  const link_url = rawLink.trim();
  if (!image_url || !link_url) {
    return NextResponse.json(
      { ok: false, error: "image_url and link_url required" },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("app_banners")
    .insert({
      image_url,
      link_url,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .select("id, image_url, link_url, is_active, created_at, updated_at")
    .single();

  if (error) {
    const hint =
      error.message.includes("app_banners") || error.code === "42P01"
        ? "Apply migration 018_cms_taglines_banners.sql in Supabase."
        : error.message;
    return NextResponse.json({ ok: false, error: hint }, { status: 500 });
  }

  revalidatePath("/dashboard/banners");
  return NextResponse.json({ ok: true, banner: data });
}
