"use client";

import { useActionState, useState } from "react";
import {
  saveDailyReportAction,
  updateVisitAction,
  deleteVisitAction,
} from "./planActions";
import { ReportFormFields } from "./ReportForm";
import { visibleReportFields } from "./reportRules";
import {
  DAILY_REPORT_STATUS_LABELS,
  VISIT_TYPES,
  VISIT_TYPE_LABELS,
  WEEKDAY_LABELS,
  type DailyReportBody,
  type DailyReportStatus,
  type VisitType,
} from "@/types";

export interface VisitRow {
  _id: string;
  date: string; // ISO
  visitType: VisitType;
  supervisorId: string;
  supervisorName: string;
  instituteName: string;
  instituteType: string;
  administrationName: string;
  regionName: string;
  reportStatus: DailyReportStatus;
  body: DailyReportBody;
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
/** هل محتوى التقرير يحتوي أي قيمة؟ (لإخفاء الملخّص الفارغ) */

/**
 * جدول عرض التقرير المُرسل (قراءة فقط) + زر طباعة.
 * يطبع التقرير وحده عبر CSS الطباعة في globals.css.
 */
function ReportTable({
  instituteName,
  visitDate,
  visitType,
  supervisorName,
  body,
}: {
  instituteName: string;
  visitDate: string;
  visitType: string;
  supervisorName: string;
  body: DailyReportBody;
}) {
  const fields = visibleReportFields(body ?? {}, "");
  return (
    <div className="mt-4 pt-4 border-t border-slate-100 print-area">
      <div className="flex items-center justify-between mb-2 print:hidden">
        <p className="text-xs font-bold text-slate-700">بيانات التقرير</p>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
        >
          🖨 طباعة التقرير
        </button>
      </div>

      <table className="w-full text-right border-collapse text-xs">
        <thead className="hidden print:table-header-group">
          <tr>
            <th className="py-1 px-2">البند</th>
            <th className="py-1 px-2">القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-200">
            <th className="py-1.5 px-2 text-slate-600 font-semibold w-1/3">المعهد</th>
            <td className="py-1.5 px-2 font-bold text-slate-900">{instituteName}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <th className="py-1.5 px-2 text-slate-600 font-semibold">الموجّه</th>
            <td className="py-1.5 px-2 text-slate-800">{supervisorName}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <th className="py-1.5 px-2 text-slate-600 font-semibold">نوع الزيارة</th>
            <td className="py-1.5 px-2 text-slate-800">{visitType}</td>
          </tr>
          <tr className="border-b border-slate-200">
            <th className="py-1.5 px-2 text-slate-600 font-semibold">التاريخ</th>
            <td className="py-1.5 px-2 text-slate-800">{visitDate}</td>
          </tr>
          {fields.map((f) => (
            <tr key={f.key} className="border-b border-slate-200">
              <th className="py-1.5 px-2 text-slate-600 font-semibold w-1/3">{f.label}</th>
              <td className="py-1.5 px-2 text-slate-800 whitespace-pre-wrap">{f.format(body ?? {})}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DailyReportCard({
  visit,
  isSupervisor,
  canManage,
}: {
  visit: VisitRow;
  isSupervisor: boolean;
  /** المدير الذي يحكم هذا الموعد يستطيع تعديله/حذفه. */
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const { weekday, date } = fmtDate(visit.date);
  const locked = visit.reportStatus === "submitted";
  const [saveState, saveAction, saving] = useActionState(saveDailyReportAction, {
    success: false,
  });
  const [updateState, updateAction, updating] = useActionState(updateVisitAction, {
    success: false,
  });
  const [deleteState, deleteAction, deleting] = useActionState(deleteVisitAction, {
    success: false,
  });

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
          {!isSupervisor && (
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
          {canManage && (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
            >
              {editing ? "إغلاق التعديل" : "تعديل الموعد"}
            </button>
          )}
        </div>
      </div>

      {canManage && editing && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          <form action={updateAction} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <input type="hidden" name="id" value={visit._id} />
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع الزيارة</label>
              <select
                name="visitType"
                defaultValue={visit.visitType}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                {VISIT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {VISIT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">التاريخ</label>
              <input
                type="date"
                name="date"
                defaultValue={visit.date.slice(0, 10)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={updating}
                className="w-full px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition"
              >
                {updating ? "جارٍ الحفظ..." : "حفظ التعديل"}
              </button>
            </div>
            {updateState?.error && (
              <p className="md:col-span-3 text-xs text-rose-700">{updateState.error}</p>
            )}
          </form>

          <form action={deleteAction} className="pt-2">
            <input type="hidden" name="id" value={visit._id} />
            {deleteState?.error && (
              <p className="text-xs text-rose-700 mb-2">{deleteState.error}</p>
            )}
            <button
              type="submit"
              disabled={deleting}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition"
            >
              {deleting ? "جارٍ الحذف..." : "حذف الموعد من الخطة"}
            </button>
          </form>
        </div>
      )}

      {(locked || (isSupervisor && !open)) && (
        <ReportTable
          instituteName={visit.instituteName}
          visitDate={date}
          visitType={VISIT_TYPE_LABELS[visit.visitType]}
          supervisorName={visit.supervisorName}
          body={visit.body}
        />
      )}


      {isSupervisor && open && !locked && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <form action={saveAction} className="space-y-3">
            <input type="hidden" name="visitId" value={visit._id} />
            <ReportFormFields
              instituteName={visit.instituteName}
              instituteType={visit.instituteType}
              body={visit.body ?? {}}
              pending={saving}
            />
            {saveState?.error && (
              <p className="text-xs text-rose-700">{saveState.error}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}



