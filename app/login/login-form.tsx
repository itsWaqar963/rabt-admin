"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getAppOrigin } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "password" | "magic";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onGoogleSignIn() {
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const adminOrigin = getAppOrigin();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${adminOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const adminOrigin = getAppOrigin();

    try {
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setMessage(error.message);
          return;
        }
        router.replace(nextPath);
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${adminOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(
        "Magic link sent. Check your inbox. Opens back into Rabt Admin — ensure redirect URL allowlisted.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onForgotPassword() {
    if (!email.trim()) {
      setMessage("Enter your email first, then use Forgot / set password.");
      return;
    }
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const adminOrigin = getAppOrigin();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${adminOrigin}/auth/callback?next=${encodeURIComponent("/auth/update-password")}`,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage(
        "Password email sent. Google-only admins: set a password once, then use the Password tab. Opens back into Rabt Admin — ensure redirect URL allowlisted.",
      );
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setMessage(null);
  }

  let submitLabel: string;
  switch (mode) {
    case "password":
      submitLabel = "Sign in";
      break;
    case "magic":
      submitLabel = "Send magic link";
      break;
    default: {
      const _exhaustive: never = mode;
      void _exhaustive;
      submitLabel = "Continue";
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-5">
      <button
        type="button"
        disabled={busy}
        onClick={onGoogleSignIn}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-600 bg-zinc-50 px-3 py-2.5 text-sm font-medium text-zinc-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <GoogleMark className="h-4 w-4 shrink-0" />
        Sign in with Google
      </button>

      <div className="relative flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs uppercase tracking-wide text-zinc-500">or</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-1 rounded-md bg-zinc-950 p-1 text-sm">
          <button
            type="button"
            onClick={() => switchMode("password")}
            className={`flex-1 rounded px-2 py-1.5 ${
              mode === "password"
                ? "bg-zinc-800 text-zinc-50"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => switchMode("magic")}
            className={`flex-1 rounded px-2 py-1.5 ${
              mode === "magic"
                ? "bg-zinc-800 text-zinc-50"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Magic link
          </button>
        </div>

        <label className="block space-y-1.5 text-sm">
          <span className="text-zinc-300">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none ring-emerald-500/40 focus:ring-2"
          />
        </label>

        {mode === "password" ? (
          <label className="block space-y-1.5 text-sm">
            <span className="text-zinc-300">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-50 outline-none ring-emerald-500/40 focus:ring-2"
            />
          </label>
        ) : null}

        {message ? (
          <p className="text-sm text-zinc-300" role="status">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working…" : submitLabel}
        </button>

        {mode === "password" ? (
          <button
            type="button"
            disabled={busy}
            onClick={onForgotPassword}
            className="w-full text-center text-sm text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Forgot / set password
          </button>
        ) : null}

        {mode === "password" ? (
          <p className="text-xs text-zinc-500">
            Prefer Google above. Password tab for accounts that already set one —
            use Forgot / set password once if needed.
          </p>
        ) : null}
      </form>
    </div>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
