"use client";

import type { GiftedInstituteOption, GiftedStudentItem } from "./types";
import { GiftedStudentFields } from "./GiftedStudentFields";

interface Props {
  open: boolean;
  /** سجل قائم للتعديل (عند null تكون العملية إضافة). */
  student: GiftedStudentItem | null;
  institutes: GiftedInstituteOption[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
}

/** النافذة المنبثقة للإضافة/التعديل — تُعاد تهيئتها بـ key عند كل فتح. */
export function GiftedStudentModal({
  open,
  student,
  institutes,
  onClose,
  onSubmit,
  loading,
  error,
}: Props) {
  if (!open) return null;
  const isEdit = Boolean(student);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-900 text-base">
            {isEdit ? "تعديل بيانات الطالب الموهوب" : "إضافة طالب موهوب جديد"}
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
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <GiftedStudentFields student={student} institutes={institutes} />

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
              {loading ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "حفظ الطالب"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}