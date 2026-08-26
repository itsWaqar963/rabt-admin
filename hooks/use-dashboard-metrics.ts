"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchDashboardMetrics,
  type DashboardMetrics,
} from "@/lib/metrics";

const REFETCH_DEBOUNCE_MS = 400;
export const PRESENCE_POLL_MS = 15_000;

export type UseDashboardMetricsResult = {
  metrics: DashboardMetrics | null;
  error: string | null;
  live: boolean;
  refetch: () => Promise<void>;
};

export function useDashboardMetrics(
  initialMetrics: DashboardMetrics | null,
  initialError: string | null,
): UseDashboardMetricsResult {
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
        if (status === "SUBSCRIBED") {
          setLive(true);
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setLive(false);
        }
      });

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void supabase.removeChannel(channel);
    };
  }, [scheduleRefetch]);

  useEffect(() => {
    const id = setInterval(() => {
      void refetch();
    }, PRESENCE_POLL_MS);
    return () => clearInterval(id);
  }, [refetch]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    const onFocus = () => {
      void refetch();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [refetch]);

  return { metrics, error, live, refetch };
}
