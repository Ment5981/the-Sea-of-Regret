"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "首页" },
  { href: "/create", label: "觉醒" },
  { href: "/plaza", label: "广场" },
  { href: "/simulation", label: "推演" },
  { href: "/result", label: "结果" },
  { href: "/dashboard", label: "控制台" },
  { href: "/demo", label: "演示" },
  { href: "/share", label: "拉票" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/90 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-wide text-cyan-400 transition hover:text-cyan-300"
        >
          命中注定的离别
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {NAV.map(({ href, label }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-xs transition sm:text-sm",
                  active
                    ? "bg-fuchsia-950/60 text-fuchsia-200 ring-1 ring-fuchsia-800/50"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100",
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
