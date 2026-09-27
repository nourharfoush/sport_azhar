"use client";

import { useActionState, useState } from "react";
import { saveDailyReportAction, submitDailyReportAction } from "./planActions";
import {
  DAILY_REPORT_STATUS_LABELS,
  VISIT_TYPE_LABELS,
  WEEKDAY_LABELS,
  type DailyReportStatus,
  type VisitType,
} from "@/types";

export interface VisitRow {
  _id: string;
  date: string; // ISO
  visitType: VisitType;
  supervisorName: string;
  instituteName: string;
  administrationName: string;
  regionName: string;
  reportStatus: DailyReportStatus;
  summary: string;
  recommendations: string;
}

function fmtDate(iso: string): { weekday: string; date: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { weekday: "", date: iso };
  return {
    weekday: WEEKDAY_LABELS[d.getDay()],
    date: d.toLocaleDateString("ar-EG", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
}

/**
 * بطاقة موعد يومي + التقرير المرتبط.
 * - الموجّه: يفتح التقرير ويملؤه ثم يرسله.
 * - المدير: يعرض حالة التقرير فقط.
 */
export function DailyReportCard({
  visit,
  isSupervisor,
}: {
  visit: VisitRow;
  isSupervisor: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { weekday, date } = fmtDate(visit.date);
  const locked = visit.reportStatus === "submitted";

  const [saveState, saveAction, saving] = useActionState(saveDailyReportAction, {
    success: false,
  });
  const [submitState, submitAction, submitting] = useActionState(
    submitDailyReportAction,
    { success: false },
  );

  const statusClass =
    visit.reportStatus === "submitted"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : visit.reportStatus === "draft"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900">{visit.instituteName}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {VISIT_TYPE_LABELS[visit.visitType]}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {weekday} — {date} • {visit.administrationName} • {visit.regionName}
          </p>
          {isSupervisor && (
            <p className="text-xs text-slate-500 mt-1">الموجّه: {visit.supervisorName}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${statusClass}`}>
            {DAILY_REPORT_STATUS_LABELS[visit.reportStatus]}
          </span>
          {isSupervisor && !locked && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
            >
              {open ? "إغلاق" : "فتح التقرير"}
            </button>
          )}
        </div>
      </div>

      {(visit.summary || visit.recommendations) && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
          {visit.summary && (
            <p className="text-slate-700">
              <span className="font-bold">الخلاصة: </span>
              {visit.summary}
            </p>
          )}
          {visit.recommendations && (
            <p className="text-slate-700">
              <span className="font-bold">التوصيات: </span>
              {visit.recommendations}
            </p>
          )}
        </div>
      )}


      {isSupervisor && open && !locked && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            حقول التقرير التفصيلية ستُضاف لاحقًا. المخصّصات المتاحة الآن: الخلاصة والتوصيات.
          </p>

          <form action={saveAction} className="space-y-3">
            <input type="hidden" name="visitId" value={visit._id} />
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">الخلاصة</label>
              <textarea
                name="summary"
                defaultValue={visit.summary}
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">التوصيات</label>
              <textarea
                name="recommendations"
                defaultValue={visit.recommendations}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            {saveState?.error && <p className="text-xs text-rose-700">{saveState.error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ كمسودة"}
            </button>
          </form>

          <form action={submitAction}>
            <input type="hidden" name="visitId" value={visit._id} />
            {submitState?.error && (
              <p className="text-xs text-rose-700 mb-2">{submitState.error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
            >
              {submitting ? "جارٍ الإرسال..." : "إرسال التقرير"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
