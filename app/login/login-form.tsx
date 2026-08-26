"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("Magic link sent. Check your inbox.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: AuthMode) {
    setMode(next);
    setMessage(null);
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
        {busy
          ? "Working…"
          : mode === "password"
            ? "Sign in"
            : "Send magic link"}
      </button>
    </form>
  );
}
