"use client";

import { useActionState, useState } from "react";
import { saveMonthlyPlanAction } from "./planActions";
import { VISIT_TYPES, VISIT_TYPE_LABELS, type Role, type VisitType } from "@/types";

export interface PlanSupervisorOption {
  _id: string;
  name: string;
  regionName: string;
  administrationName: string;
  /** دور الموجّه — يحدد نوع المتابعة (معهد أم إدارة تعليمية). */
  role?: Role;
}

export interface PlanInstituteOption {
  _id: string;
  name: string;
  stage: string;
  administrationName: string;
  regionName: string;
  /** معرّف الإدارة التعليمية (تُستعمل لربط الموعد). */
  administrationId?: string;
}

export interface PlanAdministrationOption {
  _id: string;
  name: string;
  regionName: string;
}

interface DraftRow {
  key: number;
  supervisorId: string;
  instituteId: string;
  /** معرّف الإدارة التعليمية المستهدفة (للعضو الفني). */
  administrationId: string;
  visitType: VisitType;
  date: string;
}

let rowSeq = 0;
function newRow(month: string): DraftRow {
  rowSeq += 1;
  return {
    key: rowSeq,
    supervisorId: "",
    instituteId: "",
    administrationId: "",
    visitType: "supervisory",
    date: `${month}-01`,
  };
}

/** بناء الخطة الشهرية: يختار المدير الموجّه والهدف (معهد/إدارة) والنوع واليوم. */
export function MonthlyPlanBuilder({
  supervisors,
  institutes,
  administrations = [],
  defaultMonth,
}: {
  supervisors: PlanSupervisorOption[];
  institutes: PlanInstituteOption[];
  /** الإدارات التعليمية — تُستهدف فقط في متابعة «العضو الفني». */
  administrations?: PlanAdministrationOption[];
  defaultMonth: string;
}) {
  const [month, setMonth] = useState(defaultMonth);
  const [rows, setRows] = useState<DraftRow[]>([newRow(defaultMonth)]);
  const [state, formAction, pending] = useActionState(saveMonthlyPlanAction, {
    success: false,
  });

  const patch = (key: number, part: Partial<DraftRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...part } : r)));

  /** الموجّه «العضو الفني» يتابع الإدارات التعليمية فقط. */
  const followsAdmin = (row: DraftRow) =>
    supervisors.find((s) => s._id === row.supervisorId)?.role === "technical";

  const changeMonth = (value: string) => {
    setMonth(value);
    setRows((prev) =>
      prev.map((r) => ({ ...r, date: `${value}-${r.date.slice(8) || "01"}` })),
    );
  };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="month" value={month} />

      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            شهر الخطة *
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => changeMonth(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
          />
        </div>
        <p className="text-xs text-slate-500 md:mt-6">
          ضع خطة الشهر لكل الموجّهين في نطاقك. لكل يوم في الخطة تقرير منفصل خاص بالموجّه.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 md:grid-cols-4 gap-3"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                الموجّه *
              </label>
              <select
                name="supervisorIds"
                required
                value={row.supervisorId}
                onChange={(e) =>
                  patch(row.key, {
                    supervisorId: e.target.value,
                    // الهدف يتغيّر بتغيّر نوع المتابعة
                    instituteId: "",
                    administrationId: "",
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="">-- اختر --</option>
                {supervisors.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.administrationName || s.regionName})
                  </option>
                ))}
              </select>
            </div>

            {followsAdmin(row) ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  الإدارة التعليمية *
                </label>
                <select
                  name="administrationIds"
                  required
                  value={row.administrationId}
                  onChange={(e) =>
                    patch(row.key, { administrationId: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="">-- اختر الإدارة --</option>
                  {administrations.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name}
                      {a.regionName ? ` — ${a.regionName}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  العضو الفني يتابع المسابقات والبرامج على مستوى الإدارات التعليمية.
                </p>
                {/* حقل موازٍ فارغ للحفاظ على تطابق ترتيب الصفوف في الخادم */}
                <input type="hidden" name="instituteIds" value="" />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  المعهد *
                </label>
                <select
                  name="instituteIds"
                  required
                  value={row.instituteId}
                  onChange={(e) => patch(row.key, { instituteId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="">-- اختر --</option>
                  {institutes.map((ins) => (
                    <option key={ins._id} value={ins._id}>
                      {ins.name} — {ins.administrationName}
                    </option>
                  ))}
                </select>
                <input type="hidden" name="administrationIds" value="" />
              </div>
            )}


            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نوع الزيارة *
              </label>
              <select
                name="visitTypes"
                required
                value={row.visitType}
                onChange={(e) =>
                  patch(row.key, { visitType: e.target.value as VisitType })
                }
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                اليوم / التاريخ *
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  name="dates"
                  required
                  value={row.date}
                  onChange={(e) => patch(row.key, { date: e.target.value })}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                />
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setRows((prev) => prev.filter((r) => r.key !== row.key))
                    }
                    className="px-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100"
                    aria-label={`حذف الموعد ${i + 1}`}
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {state?.error && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          تم حفظ الخطة الشهرية بنجاح.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, newRow(month)])}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
        >
          + إضافة موعد
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-sm transition"
        >
          {pending ? "جارٍ الحفظ..." : "حفظ الخطة الشهرية"}
        </button>
      </div>
    </form>
  );
}

