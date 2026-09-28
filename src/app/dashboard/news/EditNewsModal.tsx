"use client";

import { useState } from "react";
import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_LABELS,
  availableNewsCategories,
  type NewsCategory,
  type Role,
} from "@/types";
import { NewsItem } from "./types";
import { ImageUploadField } from "./ImageUploadField";

interface Props {
  news: NewsItem | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  /** دور المستخدم: يحجب تصنيفات الإدارة العامة عن غيرها */
  userRole: Role;
}

export function EditNewsModal({
  news,
  onClose,
  onSubmit,
  loading,
  error,
  userRole,
}: Props) {
  const [removed, setRemoved] = useState<string[]>([]);

  if (!news) return null;

  // الإدارة العامة ترى كل التصنيفات، وغيرها محجوبٌ عن تصنيفاتها المحجوزة
  const categories = availableNewsCategories(userRole);
  const isRestricted = categories.length < NEWS_CATEGORIES.length;

  const toggleRemoved = (src: string) => {
    setRemoved((prev) =>
      prev.includes(src) ? prev.filter((p) => p !== src) : [...prev, src],
    );
  };

  const keptCount = news.images.filter((src) => !removed.includes(src)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">تعديل الخبر أو التعميم</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4 overflow-y-auto">
          <input type="hidden" name="id" value={news._id} />

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
              defaultValue={news.title}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">التصنيف *</label>
            <select
              name="category"
              defaultValue={news.category}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {NEWS_CATEGORY_LABELS[c as NewsCategory]}
                </option>
              ))}
            </select>
            {isRestricted && (
              <p className="text-[11px] text-slate-500 mt-1">
                «دليل العمل» و«ضوابط وتعليمات» من اختصاص الإدارة العامة وحدها.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">نص الخبر *</label>
            <textarea
              name="content"
              rows={4}
              defaultValue={news.content}
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          {news.images.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                الصور المرفقة حالياً ({keptCount} صورة بعد الحذف)
              </div>
              <div className="flex flex-wrap gap-3">
                {news.images.map((src) => {
                  const isRemoved = removed.includes(src);
                  return (
                    <div key={src} className="w-24 space-y-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt="صورة مرفقة"
                        className={`w-24 h-20 object-cover rounded-xl border ${
                          isRemoved
                            ? "border-rose-300 opacity-40 grayscale"
                            : "border-slate-200"
                        }`}
                      />
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-700 cursor-pointer">
                        <input
                          type="checkbox"
                          name="removeImages"
                          value={src}
                          checked={isRemoved}
                          onChange={() => toggleRemoved(src)}
                          className="w-3.5 h-3.5 accent-rose-600"
                        />
                        حذف الصورة
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <ImageUploadField
            existingCount={keptCount}
            label="إضافة صور جديدة (اختياري)"
          />


          <div className="flex flex-wrap items-center gap-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                name="published"
                defaultChecked={news.published}
                className="w-4 h-4 accent-emerald-700"
              />
              منشور للجميع
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                name="isPinned"
                defaultChecked={news.isPinned}
                className="w-4 h-4 accent-emerald-700"
              />
              تثبيت في أعلى القائمة
            </label>
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
              {loading ? "جاري التحديث..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

