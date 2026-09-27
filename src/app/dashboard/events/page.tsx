import { getSession } from "@/lib/auth";
import { getVisibleEvents } from "@/lib/data";
import { SPORTS, EVENT_LABELS } from "@/types";
import { createEventAction, publishEventAction } from "./actions";

export default async function EventsPage() {
  const session = (await getSession())!;
  const events = await getVisibleEvents(session);
  const canCreate = session.role !== "institute";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          الفعاليات والمسابقات الرياضية
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          إطلاق المسابقات ومتابعة جاهزية الفرق في النطاق الإداري.
        </p>
      </div>

      {canCreate && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            إطلاق بطولة أو مسابقة جديدة
          </h2>
          <form action={createEventAction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              name="title"
              required
              placeholder="اسم المسابقة (مثل: دوري كرة القدم للمرحلة الثانوية)"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm md:col-span-2"
            />
            <select
              name="sport"
              required
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="">اختر اللعبة الرياضية...</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="season"
              defaultValue="2025/2026"
              placeholder="الموسم الرياضي"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <input
              type="date"
              name="startDate"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <input
              type="date"
              name="endDate"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <textarea
              name="description"
              rows={2}
              placeholder="شروط ولوائح المسابقة أو الفئات العمرية..."
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm md:col-span-3"
            />
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition"
              >
                حفظ كمسودة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* قائمة الفعاليات */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">
            سجل البطولات المتاحة ({events.length})
          </h2>
        </div>

        {events.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            لا توجد بطولات أو فعاليات حالياً.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((e) => (
              <div key={String(e._id)} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base text-slate-900">{e.title}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      {e.sport}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {EVENT_LABELS[e.status]}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    الموسم: {e.season} • النطاق:{" "}
                    {e.scope === "general"
                      ? "عام لكافة مناطق الجمهورية"
                      : e.scope === "region"
                        ? "بطولة منطقة"
                        : "بطولة إدارة تعليمية"}
                  </div>
                  {e.description && (
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl">{e.description}</p>
                  )}
                  <div className="text-xs text-emerald-800 font-medium pt-1">
                    المعاهد المشاركة حتى الآن: {e.respondedCount} من إجمالي {e.targetCount} معهد مستهدف
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {e.status === "draft" && canCreate && (
                    <form action={publishEventAction}>
                      <input type="hidden" name="id" value={String(e._id)} />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition"
                      >
                        نشر وتعميم على المعاهد
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
