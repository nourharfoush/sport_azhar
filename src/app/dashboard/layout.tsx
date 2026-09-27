import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ROLE_LABELS } from "@/types";
import { logoutAction } from "@/app/(auth)/login/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const canManageEntities = session.role !== "institute";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* القائمة الجانبية */}
      <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shrink-0 border-l border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
              أ
            </div>
            <div>
              <div className="font-bold text-sm leading-tight text-white">
                رعاية الطلاب الرياضية
              </div>
              <div className="text-[11px] text-emerald-400 mt-0.5">
                الأزهر الشريف
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="text-xs text-slate-400">المستخدم الحالي:</div>
            <div className="font-semibold text-sm text-slate-100 mt-0.5 truncate">
              {session.name}
            </div>
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950 text-emerald-300 border border-emerald-800">
              {ROLE_LABELS[session.role]}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            📊 لوحة المؤشرات
          </Link>
          <Link
            href="/dashboard/events"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            🏆 الفعاليات والمسابقات
          </Link>
          <Link
            href="/dashboard/followup"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
          >
            📋 متابعة المشاركات والنتائج
          </Link>
          {canManageEntities && (
            <Link
              href="/dashboard/entities"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              🏢 الهيكل التنظيمي
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 text-xs font-semibold transition"
            >
              تسجيل الخروج
            </button>
          </form>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
