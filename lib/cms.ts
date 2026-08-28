export type AppScreen = "discover" | "meetups" | "reflect" | "profile";

export type TaglineRow = {
  screen: AppScreen;
  title_lead: string;
  title_accent: string;
  subtitle: string;
};

export const APP_SCREENS: AppScreen[] = [
  "discover",
  "meetups",
  "reflect",
  "profile",
];

export function isAppScreen(value: string): value is AppScreen {
  return (
    value === "discover" ||
    value === "meetups" ||
    value === "reflect" ||
    value === "profile"
  );
}

export function screenLabel(screen: AppScreen): string {
  switch (screen) {
    case "discover":
      return "Discover";
    case "meetups":
      return "Meetups";
    case "reflect":
      return "Reflect";
    case "profile":
      return "Profile";
    default: {
      const _exhaustive: never = screen;
      return String(_exhaustive);
    }
  }
}
