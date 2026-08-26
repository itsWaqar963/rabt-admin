import { MetricsPanel } from "@/components/dashboard/metrics-panel";

export default function DashboardHomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Live ops overview from Supabase.
        </p>
      </div>
      <MetricsPanel />
    </div>
  );
}
