"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flag,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  Users,
  CalendarDays,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/users", label: "Users", icon: Users, exact: false },
  { href: "/dashboard/meetups", label: "Meetups", icon: CalendarDays, exact: false },
  { href: "/dashboard/reports", label: "Reports", icon: Flag, exact: false },
  { href: "/dashboard/broadcast", label: "Broadcast", icon: Megaphone, exact: false },
  { href: "/dashboard/lessons", label: "Lessons", icon: GraduationCap, exact: false },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-widest text-emerald-400">
          Rabt
        </p>
        <p className="text-sm font-semibold text-zinc-100">Admin</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {NAV.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                active
                  ? "bg-zinc-800 text-zinc-50"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              }`}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
