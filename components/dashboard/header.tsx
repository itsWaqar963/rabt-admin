"use client";

import type { ReactNode } from "react";
import { Users, CalendarDays, Flag } from "lucide-react";
import { useMetricsContext } from "@/components/dashboard/metrics-provider";

type HeaderProps = {
  email: string | undefined;
  children?: ReactNode;
};

export function Header({ email, children }: HeaderProps) {
  const { metrics } = useMetricsContext();

  const chips = [
    {
      label: "Users",
      value: metrics ? metrics.totalUsers.toLocaleString() : "—",
      icon: Users,
    },
    {
      label: "Live meetups",
      value: metrics ? metrics.liveMeetups.toLocaleString() : "—",
      icon: CalendarDays,
    },
    {
      label: "Reports",
      value: metrics ? metrics.openReports.toLocaleString() : "—",
      icon: Flag,
    },
  ] as const;

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/60 px-5 py-3">
      <div className="flex flex-wrap gap-3">
        {chips.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="flex min-w-[7rem] items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
            >
              <Icon className="size-3.5 text-zinc-500" aria-hidden />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {m.label}
                </p>
                <p className="text-sm font-medium tabular-nums text-zinc-200">
                  {m.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <span className="truncate text-xs text-zinc-400">{email ?? "—"}</span>
        {children}
      </div>
    </header>
  );
}
