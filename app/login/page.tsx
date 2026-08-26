import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params.error;

  let banner: string | null = null;
  if (error === "not_admin") {
    banner = "Signed in, but this account is not in admin_users.";
  } else if (error === "auth") {
    banner = "Auth failed. Try again.";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
            Rabt Admin
          </p>
          <h1 className="text-2xl font-semibold text-zinc-50">Sign in</h1>
          <p className="text-sm text-zinc-400">
            Email + password or magic link. Must be listed in admin_users.
          </p>
        </div>

        {banner ? (
          <div
            role="alert"
            className="rounded-md border border-amber-700/60 bg-amber-950/40 px-3 py-2 text-sm text-amber-200"
          >
            {banner}
          </div>
        ) : null}

        <LoginForm nextPath={params.next ?? "/dashboard"} />
      </div>
    </main>
  );
}
