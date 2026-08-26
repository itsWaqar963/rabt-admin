"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/moderation";

type Props = {
  label: string;
  confirmMessage: string;
  action: () => Promise<ActionResult>;
  variant?: "danger" | "default" | "accent";
  disabled?: boolean;
};

const VARIANT: Record<NonNullable<Props["variant"]>, string> = {
  danger:
    "border-red-900/50 text-red-300 hover:bg-red-950/60 disabled:opacity-40",
  accent:
    "border-emerald-900/50 text-emerald-300 hover:bg-emerald-950/50 disabled:opacity-40",
  default:
    "border-zinc-700 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40",
};

export function ConfirmActionButton({
  label,
  confirmMessage,
  action,
  variant = "default",
  disabled,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col gap-0.5">
      <button
        type="button"
        disabled={disabled || pending}
        className={`rounded border px-2 py-0.5 text-[11px] font-medium ${VARIANT[variant]}`}
        onClick={() => {
          if (!window.confirm(confirmMessage)) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (!result.ok) setError(result.error);
          });
        }}
      >
        {pending ? "…" : label}
      </button>
      {error ? (
        <span className="max-w-[10rem] text-[10px] leading-tight text-red-400">
          {error}
        </span>
      ) : null}
    </span>
  );
}
