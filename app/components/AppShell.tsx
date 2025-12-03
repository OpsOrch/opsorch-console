"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import { isEnterprise } from "@/app/lib/edition";

type NavItem = {
  href: string;
  label: string;
  edition?: "enterprise" | "oss" | "both";
};

const allNavItems: NavItem[] = [
  { href: "/", label: "Home" }, // Available in both editions
  { href: "/chats", label: "Chats", edition: "enterprise" },
  { href: "/incidents", label: "Incidents" },
  { href: "/alerts", label: "Alerts" },
  { href: "/logs", label: "Logs" },
  { href: "/metrics", label: "Metrics" },
  { href: "/tickets", label: "Tickets" },
  { href: "/services", label: "Services" },
  { href: "/settings", label: "Settings" },
];

// Filter navigation items based on edition
const navItems = allNavItems.filter((item) => {
  if (!item.edition || item.edition === "both") return true;
  if (item.edition === "enterprise") return isEnterprise();
  if (item.edition === "oss") return !isEnterprise();
  return true;
});

export function AppShell({
  title,
  description,
  children,
  hero,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  hero?: ReactNode;
}) {
  const pathname = usePathname();
  const activeHref = useMemo(() => pathname?.split("?")[0] || "/", [pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d1416] via-[#0f2026] to-[#102b31] text-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 lg:flex-row">
        <aside className="flex w-full flex-col gap-6 rounded-3xl border border-[#2c4c52] bg-[#0f1c20]/80 p-5 text-sm shadow-2xl lg:w-72">
          <div className="flex items-center gap-3 rounded-2xl border border-[#1c343a] bg-[#122328]/70 px-3 py-2">
            <Image src="/OpsOrch.png" alt="OpsOrch" width={48} height={48} className="rounded-xl" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#72e0e0]">OpsOrch</p>
              <p className="text-base font-semibold text-white">Console</p>
            </div>
          </div>

          <nav className="grid gap-1">
            {navItems.map((item) => {
              const active = activeHref === item.href || activeHref.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 transition ${active
                    ? "border-[#55cfd0] bg-[#10333a] text-white shadow-sm"
                    : "border-transparent bg-transparent text-slate-300 hover:border-[#23464d] hover:bg-[#10282f]"
                    }`}
                >
                  <span className="font-semibold">{item.label}</span>
                  {active ? <span className="text-[10px] uppercase text-[#89f3f3]">active</span> : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 pb-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-[#1f3c43] bg-white/90 p-6 text-slate-900 shadow-xl backdrop-blur">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3d8f92]">{hero || "Ops sources"}</p>
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              {description ? <p className="text-sm text-slate-600">{description}</p> : null}
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
