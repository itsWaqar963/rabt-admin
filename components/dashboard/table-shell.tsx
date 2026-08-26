import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 space-y-1">
      <h1 className="text-lg font-semibold text-zinc-50">{title}</h1>
      {subtitle ? <p className="text-sm text-zinc-400">{subtitle}</p> : null}
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-md border border-red-900/60 bg-red-950/50 px-3 py-2 text-sm text-red-200"
    >
      {message}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border border-zinc-800">
      <table className="w-full min-w-[640px] border-collapse text-left text-xs text-zinc-300">
        {children}
      </table>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap border-b border-zinc-800 bg-zinc-900/80 px-3 py-2 font-medium text-zinc-400">
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-zinc-800/80 px-3 py-2 align-middle ${className}`}
    >
      {children}
    </td>
  );
}
