import { createClient } from "@/lib/supabase/server";
import { BannersPanel, type BannerRow } from "@/components/dashboard/banners-panel";
import {
  ErrorBanner,
  PageHeader,
} from "@/components/dashboard/table-shell";

export default async function BannersPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_banners")
    .select("id, image_url, link_url, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  const rows: BannerRow[] = (data ?? []).map((row) => ({
    id: row.id as string,
    image_url: row.image_url as string,
    link_url: row.link_url as string,
    is_active: Boolean(row.is_active),
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
  }));

  return (
    <div>
      <PageHeader
        title="Banners"
        subtitle={`${rows.length} banner${rows.length === 1 ? "" : "s"} · newest active banner shows in the PWA on fresh sessions.`}
      />
      {error ? (
        <ErrorBanner
          message={
            error.message.includes("app_banners") || error.code === "42P01"
              ? "Apply migration 018_cms_taglines_banners.sql in Supabase, then refresh."
              : error.message
          }
        />
      ) : null}
      <BannersPanel initial={rows} />
    </div>
  );
}
