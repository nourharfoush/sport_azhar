"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/types";
import { ROLE_LABELS, displayName } from "@/types";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logoutAction } from "@/app/(auth)/login/actions";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "الرئيسية",
    items: [{ href: "/dashboard", label: "لوحة المؤشرات", icon: "📊", exact: true }],
  },
  {
    title: "الأنشطة",
    items: [
      { href: "/dashboard/events", label: "الفعاليات والمسابقات", icon: "🏆" },
      { href: "/dashboard/news", label: "الأخبار والتعميمات", icon: "📰" },
      { href: "/dashboard/planning", label: "التخطيط والمتابعة", icon: "🗓️" },
      { href: "/dashboard/gifted", label: "ركن الموهوبين", icon: "⭐" },
    ],
  },
  {
    title: "الإدارة",
    items: [
      { href: "/dashboard/users", label: "المستخدمون والصلاحيات", icon: "👥" },
      { href: "/dashboard/specs", label: "مقاييس الملاعب والأجهزة", icon: "📐" },
      { href: "/dashboard/entities", label: "الهيكل التنظيمي", icon: "🏢" },
    ],
  },
];


function SidebarContent({
  session,
  onNavigate,
}: {
  session: SessionUser;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  // «العضو الفني» لا يدير المستخدمين ولا الهيكل التنظيمي (متابعة فقط)
  const canManageEntities =
    session.role !== "institute" && session.role !== "technical";

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      {/* سلسلة VIC: الأزهر الشريف في الأعلى ثم الإدارة العامة في الأسفل */}
      <div className="border-b border-slate-800/80 px-5 py-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 text-xl font-black text-white shadow-lg shadow-emerald-900/50">
            أ
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black leading-tight text-white">
              الأزهر الشريف
            </p>
            <p className="mt-1 truncate text-sm font-bold leading-tight text-emerald-400">
              قطاع المعاهد الأزهرية
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5 border-t border-slate-800/80 pt-4">
          <li className="flex items-center gap-2.5 text-sm font-bold leading-snug text-slate-300">
            <span aria-hidden className="text-base text-slate-600">
              –
            </span>
            الإدارة المركزية لرعاية الطلاب
          </li>
          <li className="flex items-center gap-2.5 rounded-lg bg-emerald-500/10 px-2 py-1 text-sm font-extrabold leading-snug text-emerald-300 ring-1 ring-inset ring-emerald-500/25">
            <span aria-hidden className="text-base text-emerald-500">
              –
            </span>
            الإدارة العامة للرعاية الرياضية
          </li>
        </ul>
      </div>

      <div className="px-4 pt-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-base font-extrabold text-slate-100">
              {displayName(session.name).trim().charAt(0) || "م"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-slate-100">
                {displayName(session.name)}
              </p>
              <span className="mt-1 inline-block rounded-full border border-emerald-700/60 bg-emerald-950/70 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                {ROLE_LABELS[session.role]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 text-base font-semibold">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter(
            (item) =>
              canManageEntities || !item.href.startsWith("/dashboard/users"),
          );
          if (items.length === 0) return null;

          return (
            <div key={group.title}>
              <p className="mb-2 px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const active = isActive(pathname, item);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex items-center gap-3.5 rounded-xl px-3.5 py-3 transition ${
                          active
                            ? "bg-emerald-600/15 font-bold text-white ring-1 ring-inset ring-emerald-500/40"
                            : "font-semibold text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        {active && (
                          <span className="absolute inset-y-1.5 -right-4 w-1 rounded-full bg-emerald-400" />
                        )}
                        <span
                          aria-hidden
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg transition ${
                            active
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800/70 group-hover:bg-slate-700"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-800/80 p-4 space-y-2">
        <ThemeToggle tone="dark" />
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-3 text-sm font-bold text-slate-300 transition hover:border-rose-800 hover:bg-rose-950/60 hover:text-rose-300"
          >
            <span aria-hidden>↩</span>
            تسجيل الخروج
          </button>
        </form>
      </div>
    </div>
  );
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export function DashboardShell({
  session,
  children,
}: {
  session: SessionUser;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 md:flex-row">
      <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-l border-slate-800 md:block">
        <SidebarContent session={session} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="إغلاق القائمة"
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-900/60 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 w-80 max-w-[85%] shadow-2xl">
            <SidebarContent session={session} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="فتح القائمة"
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-lg text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            ☰
          </button>
          <div className="min-w-0 text-center">
            <p className="truncate text-base font-black text-slate-900">
              الأزهر الشريف
            </p>
            <p className="truncate text-[11px] font-bold text-slate-500">
              قطاع المعاهد الأزهرية – الإدارة المركزية لرعاية الطلاب
            </p>
            <p className="truncate text-[11px] font-extrabold text-emerald-600">
              الإدارة العامة للرعاية الرياضية
            </p>
          </div>
          <ThemeToggle compact tone="light" />
        </header>

        <main className="flex-1 overflow-x-hidden p-5 md:p-10">{children}</main>
      </div>
    </div>
  );
}
