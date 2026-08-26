export default function UsersPage() {
  return (
    <Placeholder title="Users" body="User list + moderation actions — stub." />
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-lg font-semibold text-zinc-50">{title}</h1>
      <p className="text-sm text-zinc-400">{body}</p>
    </div>
  );
}
