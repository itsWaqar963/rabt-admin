import { createClient } from "@/lib/supabase/server";
import { ContentForm } from "@/components/dashboard/content-form";
import {
  ErrorBanner,
  PageHeader,
} from "@/components/dashboard/table-shell";
import {
  APP_SCREENS,
  isAppScreen,
  type AppScreen,
  type TaglineRow,
} from "@/lib/cms";

const DEFAULT_TAGLINES: Record<AppScreen, Omit<TaglineRow, "screen">> = {
  discover: {
    title_lead: "Find your ",
    title_accent: "cluster.",
    subtitle: "Real people. Shared intent. A reason to meet offline.",
  },
  meetups: {
    title_lead: "Meet with ",
    title_accent: "intent.",
    subtitle:
      "Small gatherings for useful conversations, shared practice, and a reason to show up.",
  },
  reflect: {
    title_lead: "Reflect ",
    title_accent: "& grow.",
    subtitle:
      "Verify your physical meetups, build community trust, and claim your growth XP.",
  },
  profile: {
    title_lead: "Show up as ",
    title_accent: "yourself.",
    subtitle:
      "A clear signal for people who want to turn shared intent into real local connection.",
  },
};

export default async function ContentPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_screen_taglines")
    .select("screen, title_lead, title_accent, subtitle")
    .order("screen");

  const byScreen = new Map<AppScreen, TaglineRow>();
  for (const row of data ?? []) {
    const screen = String(row.screen ?? "");
    if (!isAppScreen(screen)) continue;
    byScreen.set(screen, {
      screen,
      title_lead: String(row.title_lead ?? DEFAULT_TAGLINES[screen].title_lead),
      title_accent: String(
        row.title_accent ?? DEFAULT_TAGLINES[screen].title_accent,
      ),
      subtitle: String(row.subtitle ?? DEFAULT_TAGLINES[screen].subtitle),
    });
  }

  const rows: TaglineRow[] = APP_SCREENS.map((screen) => {
    const existing = byScreen.get(screen);
    if (existing) return existing;
    return { screen, ...DEFAULT_TAGLINES[screen] };
  });

  return (
    <div>
      <PageHeader
        title="Content"
        subtitle="Screen taglines shown on Discover, Meetups, Reflect, and Profile."
      />
      {error ? (
        <ErrorBanner
          message={
            error.message.includes("app_screen_taglines") ||
            error.code === "42P01"
              ? "Apply migration 018_cms_taglines_banners.sql in Supabase, then refresh."
              : error.message
          }
        />
      ) : null}
      <ContentForm initial={rows} />
    </div>
  );
}
