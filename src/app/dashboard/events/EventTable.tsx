import { EVENT_LABELS, EVENT_SCOPE_LABELS } from "@/types";
import { EventItem } from "./types";
import { publishEventAction } from "./actions";

interface Props {
  events: EventItem[];
  canManageEvent: (e: EventItem) => boolean;
  onEdit: (e: EventItem) => void;
  onDelete: (e: EventItem) => void;
}

export function EventTable({ events, canManageEvent, onEdit, onDelete }: Props) {
  if (events.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        لا توجد فعاليات مطابقة للبحث أو النطاق المحدد.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {events.map((e) => {
        const canEditThis = canManageEvent(e);

        return (
          <div
            key={e._id}
            className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-bold text-base text-slate-900">{e.title}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {e.sport}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    e.status === "published"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : e.status === "active"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : e.status === "archived"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {EVENT_LABELS[e.status]}
                </span>
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>الموسم: <strong>{e.season}</strong></span>
                <span>•</span>
                <span>
                  المستوى:{" "}
                  <strong className="text-slate-700">
                    {EVENT_SCOPE_LABELS[e.scope] ?? e.scope}
                    {e.scope === "region" && e.regionName
                      ? ` — ${e.regionName}`
                      : e.scope === "administration" && e.administrationName
                        ? ` — ${e.administrationName}`
                        : e.scope === "administration"
                          ? ` — جميع إدارات ${e.regionName ?? "المنطقة"}`
                          : ""}
                  </strong>
                </span>
                {e.status === "draft" && (
                  <>
                    <span>•</span>
                    <span className="text-amber-700 font-semibold">
                      مسودة غير معلنة
                    </span>
                  </>
                )}
                {(e.startDate || e.endDate) && (
                  <>
                    <span>•</span>
                    <span>
                      الفترة: {e.startDate || "غير محدد"} إلى {e.endDate || "غير محدد"}
                    </span>
                  </>
                )}
              </div>

              {e.description && (
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  {e.description}
                </p>
              )}

              <div className="text-xs text-emerald-800 font-medium pt-1">
                المعاهد المتفاعلة: <span className="font-bold">{e.respondedCount}</span> من إجمالي <span className="font-bold">{e.targetCount}</span> معهد مستهدف
              </div>
            </div>

            {/* أزرار العمليات */}
            <div className="flex items-center gap-2 shrink-0">
              {e.status === "draft" && canEditThis && (
                <form action={publishEventAction}>
                  <input type="hidden" name="id" value={e._id} />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
                  >
                    نشر للجميع
                  </button>
                </form>
              )}

              {canEditThis && (
                <>
                  <button
                    onClick={() => onEdit(e)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => onDelete(e)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition"
                  >
                    حذف
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
