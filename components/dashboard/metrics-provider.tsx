"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { DashboardMetrics } from "@/lib/metrics";
import {
  useDashboardMetrics,
  type UseDashboardMetricsResult,
} from "@/hooks/use-dashboard-metrics";

const MetricsContext = createContext<UseDashboardMetricsResult | null>(null);

type MetricsProviderProps = {
  initialMetrics: DashboardMetrics | null;
  initialError: string | null;
  children: ReactNode;
};

export function MetricsProvider({
  initialMetrics,
  initialError,
  children,
}: MetricsProviderProps) {
  const value = useDashboardMetrics(initialMetrics, initialError);
  return (
    <MetricsContext.Provider value={value}>{children}</MetricsContext.Provider>
  );
}

export function useMetricsContext(): UseDashboardMetricsResult {
  const ctx = useContext(MetricsContext);
  if (!ctx) {
    throw new Error("useMetricsContext must be used within MetricsProvider");
  }
  return ctx;
}
