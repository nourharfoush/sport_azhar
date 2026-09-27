"use client";

import { NEWS_CATEGORIES, NEWS_CATEGORY_LABELS } from "@/types";
import { ImageUploadField } from "./ImageUploadField";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
}

export function CreateNewsModal({ open, onClose, onSubmit, loading, error }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">إضافة خبر أو تعميم جديد</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              عنوان الخبر / التعميم *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="مثال: انطلاق تصفيات بطولة كرة القدم للمرحلة الإعدادية"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">التصنيف *</label>
            <select
              name="category"
              defaultValue="news"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {NEWS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {NEWS_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نص الخبر *</label>
            <textarea
              name="content"
              rows={5}
              required
              placeholder="تفاصيل الخبر أو نص التعميم..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <ImageUploadField />

          <div className="flex flex-wrap items-center gap-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" name="published" defaultChecked className="w-4 h-4 accent-emerald-700" />
              نشر فوري للجميع
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input type="checkbox" name="isPinned" className="w-4 h-4 accent-emerald-700" />
              تثبيت في أعلى القائمة
            </label>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            يتم إرسال الخبر تلقائياً على نطاق مستواك الإداري فقط (الإدارة العامة / المنطقة / الإدارة التعليمية).
          </p>

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
              {loading ? "جاري الحفظ..." : "حفظ الخبر"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
