"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchDashboardMetrics,
  type DashboardMetrics,
} from "@/lib/metrics";

const REFETCH_DEBOUNCE_MS = 400;

type MetricsPanelProps = {
  initialMetrics: DashboardMetrics | null;
  initialError: string | null;
};

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

export function MetricsPanel({
  initialMetrics,
  initialError,
}: MetricsPanelProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(
    initialMetrics,
  );
  const [error, setError] = useState<string | null>(initialError);
  const [live, setLive] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const result = await fetchDashboardMetrics(supabase);
    if (result.ok) {
      setMetrics(result.metrics);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  const scheduleRefetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void refetch();
    }, REFETCH_DEBOUNCE_MS);
  }, [refetch]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-dashboard-metrics")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        scheduleRefetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetups" },
        scheduleRefetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_reports" },
        scheduleRefetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "meetup_reports" },
        scheduleRefetch,
      )
      .subscribe((status) => {
        setLive(status === "SUBSCRIBED");
      });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [scheduleRefetch]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          {error
            ? `Metrics error: ${error}`
            : "Counts from profiles, meetups, and reports."}
        </p>
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
