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
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/80 p-5">
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
          Google-only admins have no password yet — use Forgot / set password once,
          then sign in with the Password tab.
        </p>
      ) : null}
    </form>
  );
}
