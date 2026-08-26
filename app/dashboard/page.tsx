export default function DashboardHomePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zinc-50">Dashboard</h1>
        <p className="text-sm text-zinc-400">
          Ops overview. Counts and tables land in later slices.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "Users", note: "TODO: count from profiles" },
          { title: "Meetups", note: "TODO: count from meetups" },
          { title: "Open reports", note: "TODO: user_reports + meetup_reports" },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4"
          >
            <p className="text-sm font-medium text-zinc-200">{card.title}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-50">
              —
            </p>
            <p className="mt-2 text-xs text-zinc-500">{card.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
