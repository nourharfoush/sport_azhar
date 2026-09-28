"use client";

import { ALL_ACTIVITIES, SPORTS } from "@/types";
import type { RefKind } from "@/models/SportsReference";
import type { SportsRefItem } from "./types";

interface Props {
  open: boolean;
  /** السجل القائم للتعديل (عند null = إضافة). */
  item: SportsRefItem | null;
  /** نوع التبويب المفتوح: ملاعب | أجهزة. */
  kind: RefKind;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
}

const inputCls =
  "w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30";
const labelCls = "block text-xs font-semibold text-slate-700 mb-1";

/** قائمة الألعاب المتاحة — مرتبطة بالمسارات. */
const SPORT_OPTIONS = [...new Set<string>([...ALL_ACTIVITIES, ...SPORTS])];

/** نافذة إضافة/تعديل سجل مرجعي (ملعب أو جهاز). */
export function SportsRefModal({
  open,
  item,
  kind,
  onClose,
  onSubmit,
  loading,
  error,
}: Props) {
  if (!open) return null;
  const isPitch = kind === "pitch";
  const isEdit = Boolean(item);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-900 text-base">
            {isEdit
              ? "تعديل السجل"
              : isPitch
                ? "إضافة مقاس ملعب"
                : "إضافة مواصفة جهاز"}{" "}
            — {isPitch ? "مقاييس الملاعب" : "مواصفات الأجهزة الرياضية"}
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
          <input type="hidden" name="kind" value={kind} />

          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>
                {isPitch ? "اسم الملعب *" : "اسم الجهاز *"}
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={item?.name ?? ""}
                placeholder={isPitch ? "مثال: ملعب كرة قدم" : "مثال: كرة قدم مقاس 5"}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>اللعبة / الرياضة *</label>
              <select
                name="sport"
                required
                defaultValue={item?.sport ?? ""}
                className={inputCls}
              >
                <option value="">-- اختر --</option>
                {SPORT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {isPitch && (
              <div>
                <label className={labelCls}>نوع السطح</label>
                <input
                  type="text"
                  name="surfaceType"
                  defaultValue={item?.surfaceType ?? ""}
                  placeholder="مثال: عشب صناعي"
                  className={inputCls}
                />
              </div>
            )}

            <div>
              <label className={labelCls}>
                {isPitch ? "الأبعاد (مثال: 105×68 م)" : "الكمية المعتمدة"}
              </label>
              <input
                type="text"
                name={isPitch ? "dimensions" : "quantity"}
                defaultValue={
                  isPitch ? (item?.dimensions ?? "") : (item?.quantity ?? "")
                }
                placeholder={isPitch ? "105×68" : "مثال: 10 كرات"}
                className={inputCls}
              />
            </div>

            {!isPitch && (
              <div className="md:col-span-2">
                <label className={labelCls}>المقاس / المواصفة المختصرة</label>
                <input
                  type="text"
                  name="dimensions"
                  defaultValue={item?.dimensions ?? ""}
                  placeholder="مثال: مقاس 5 / وزن 430 جم"
                  className={inputCls}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className={labelCls}>المواصفات التفصيلية</label>
              <textarea
                name="specifications"
                rows={3}
                defaultValue={item?.specifications ?? ""}
                placeholder="الخامة، المعايير، أي تفاصيل فنية..."
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>رابط المخطط / الصورة (اختياري)</label>
              <input
                type="url"
                name="diagramUrl"
                defaultValue={item?.diagramUrl ?? ""}
                placeholder="https://..."
                dir="ltr"
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>ملاحظات (اختياري)</label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={item?.notes ?? ""}
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