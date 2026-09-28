"use client";

import { PLANNING_SECTION_LABELS, type PlanningSection } from "@/types";
import type { PlanningInstituteOption, PlanningRecordItem } from "./types";

interface Props {
  open: boolean;
  item: PlanningRecordItem | null;
  section: PlanningSection;
  institutes: PlanningInstituteOption[];
  /** يتيح «سجل مركزي» (بلا معهد) — للإدارة العامة فقط. */
  allowCentral: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
}

const inputCls =
  "w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30";
const labelCls = "block text-xs font-semibold text-slate-700 mb-1";

/** نافذة إضافة/تعديل سجل في أقسام «التخطيط والمتابعة». */
export function PlanningRecordModal({
  open,
  item,
  section,
  institutes,
  allowCentral,
  onClose,
  onSubmit,
  loading,
  error,
}: Props) {
  if (!open) return null;
  const isEdit = Boolean(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-900 text-base">
            {isEdit ? "تعديل السجل" : "إضافة سجل جديد"} —{" "}
            {PLANNING_SECTION_LABELS[section]}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4 overflow-y-auto">
          {item && <input type="hidden" name="id" value={item._id} />}
          <input type="hidden" name="section" value={section} />

          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelCls}>العنوان *</label>
              <input
                type="text"
                name="title"
                required
                defaultValue={item?.title ?? ""}
                placeholder="عنوان واضح للسجل"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>العام الدراسي</label>
              <input
                type="text"
                name="academicYear"
                defaultValue={item?.academicYear ?? "2025/2026"}
                placeholder="2025/2026"
                dir="ltr"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>النطاق / المعهد</label>
              <select
                name="instituteId"
                defaultValue={item?.institute ?? ""}
                className={inputCls}
              >
                {allowCentral && (
                  <option value="">سجل مركزي (لكل الجمهورية)</option>
                )}
                {institutes.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name}
                    {i.administrationName ? ` — ${i.administrationName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>التفاصيل / المحتوى</label>
              <textarea
                name="content"
                rows={5}
                defaultValue={item?.content ?? ""}
                placeholder="اكتب التفاصيل..."
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>
                الإجراءات / الخطوات (اكتب كل إجراء في سطر — اختياري)
              </label>
              <textarea
                name="items"
                rows={4}
                defaultValue={item?.items ?? ""}
                placeholder={"1) الإجراء الأول\n2) الإجراء الثاني\n3) الإجراء الثالث"}
                className={`${inputCls} font-mono text-xs`}
                dir="ltr"
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>روابط / مصادر (اختياري)</label>
              <input
                type="text"
                name="links"
                defaultValue={item?.links ?? ""}
                placeholder="https://..."
                dir="ltr"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>الحالة (اختياري)</label>
              <input
                type="text"
                name="status"
                defaultValue={item?.status ?? ""}
                placeholder="مثال: معتمد / جارٍ التنفيذ"
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition shadow-sm"
            >
              {loading ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}