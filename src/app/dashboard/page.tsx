import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDashboardStats, getVisibleEvents } from "@/lib/data";
import { ROLE_LABELS, EVENT_LABELS } from "@/types";

export default async function DashboardPage() {
  const session = (await getSession())!;
  const stats = await getDashboardStats(session);
  const events = await getVisibleEvents(session);

  return (
    <div className="space-y-8">
      {/* الترويسة */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            مرحباً، {session.name}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            نطاق العمل: {ROLE_LABELS[session.role]}
          </p>
        </div>

        {session.role !== "institute" && (
          <Link
            href="/dashboard/events"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold shadow-sm transition"
          >
            <span>+</span> إضافة فعالية جديدة
          </Link>
        )}
      </div>

      {/* بطاقات المؤشرات */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {session.role === "general" && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">المناطق الأزهرية</div>
            <div className="text-3xl font-extrabold text-emerald-800 mt-2">
              {stats.regions}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">منطقة على مستوى الجمهورية</div>
          </div>
        )}

        {(session.role === "general" || session.role === "region") && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="text-xs text-slate-500 font-medium">الإدارات التعليمية</div>
            <div className="text-3xl font-extrabold text-emerald-800 mt-2">
              {stats.administrations}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">إدارة في النطاق</div>
          </div>
        )}

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">المعاهد المشمولة</div>
          <div className="text-3xl font-extrabold text-emerald-800 mt-2">
            {stats.institutes}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">معهد أزهري</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">الفعاليات والمسابقات</div>
          <div className="text-3xl font-extrabold text-emerald-800 mt-2">
            {stats.events}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            منها {stats.publishedEvents} معلنة
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">نسبة الاستجابة والمشاركة</div>
          <div className="text-3xl font-extrabold text-emerald-800 mt-2">
            {stats.completionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.followupsCompleted} من {stats.followupsTotal} معهد مشارك
          </div>
        </div>
      </div>

      {/* آخر الفعاليات */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            الفعاليات المتاحة في نطاقك
          </h2>
          <Link
            href="/dashboard/events"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            عرض الكل ←
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            لا توجد فعاليات مسجّلة حالياً.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.slice(0, 5).map((e) => (
              <div
                key={String(e._id)}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {e.title}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    الرياضة: {e.sport} • الموسم: {e.season} • النطاق:{" "}
                    {e.scope === "general"
                      ? "عام لكافة الجمهورية"
                      : e.scope === "region"
                        ? "منطقة"
                        : "إدارة"}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
                    {EVENT_LABELS[e.status]}
                  </span>
                  <span className="text-xs text-slate-500">
                    مشاركة: {e.respondedCount} / {e.targetCount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
