import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminApi } from "@/lib/api-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Banner id required" },
      { status: 400 },
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

  const body = payload as {
    image_url?: unknown;
    link_url?: unknown;
    is_active?: unknown;
  };

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.image_url !== undefined) {
    if (typeof body.image_url !== "string" || !body.image_url.trim()) {
      return NextResponse.json(
        { ok: false, error: "image_url must be a non-empty string" },
        { status: 400 },
      );
    }
    patch.image_url = body.image_url.trim();
  }

  if (body.link_url !== undefined) {
    if (typeof body.link_url !== "string" || !body.link_url.trim()) {
      return NextResponse.json(
        { ok: false, error: "link_url must be a non-empty string" },
        { status: 400 },
      );
    }
    patch.link_url = body.link_url.trim();
  }

  if (body.is_active !== undefined) {
    if (typeof body.is_active !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "is_active must be a boolean" },
        { status: 400 },
      );
    }
    patch.is_active = body.is_active;
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json(
      { ok: false, error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("app_banners")
    .update(patch)
    .eq("id", id)
    .select("id, image_url, link_url, is_active, created_at, updated_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Banner not found" },
      { status: 404 },
    );
  }

  revalidatePath("/dashboard/banners");
  return NextResponse.json({ ok: true, banner: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Banner id required" },
      { status: 400 },
    );
  }

  const { error, count } = await auth.supabase
    .from("app_banners")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  if (!count) {
    return NextResponse.json(
      { ok: false, error: "Banner not found" },
      { status: 404 },
    );
  }

  revalidatePath("/dashboard/banners");
  return NextResponse.json({ ok: true });
}
