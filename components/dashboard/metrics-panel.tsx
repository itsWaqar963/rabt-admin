"use client";

import type { DashboardMetrics } from "@/lib/metrics";
import { useMetricsContext } from "@/components/dashboard/metrics-provider";

const CARDS: {
  key: keyof DashboardMetrics;
  title: string;
}[] = [
  { key: "totalUsers", title: "Total Users" },
  { key: "onlineNow", title: "Online Now" },
  { key: "offline", title: "Offline" },
  { key: "totalMeetups", title: "Total Meetups" },
  { key: "openReports", title: "Open Reports" },
];

export function MetricsPanel() {
  const { metrics, error, live } = useMetricsContext();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          {error
            ? `Metrics error: ${error}`
            : "Counts from profiles, meetups, and reports."}
        </p>
        <div className="flex flex-col items-end gap-0.5">
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
              live ? "text-emerald-400" : "text-zinc-600"
            }`}
            title={
              live
                ? "Realtime subscribed"
                : "Realtime not subscribed (enable table replication if silent)"
            }
          >
            <span
              className={`size-1.5 rounded-full ${
                live ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
              }`}
            />
            Live
          </span>
          <span className="text-[10px] text-zinc-600">
            Presence polls every 15s
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <p className="text-sm font-medium text-zinc-200">{card.title}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
              {metrics ? metrics[card.key].toLocaleString() : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
