import { createClient } from "@/lib/supabase/server";
import { fetchDashboardMetrics } from "@/lib/metrics";
import { MetricsPanel } from "@/components/dashboard/metrics-panel";

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const result = await fetchDashboardMetrics(supabase);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Live ops overview from Supabase.
        </p>
      </div>
      <MetricsPanel
        initialMetrics={result.ok ? result.metrics : null}
        initialError={result.ok ? null : result.error}
      />
    </div>
  );
}
