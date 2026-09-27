"use client";

import { useEffect, useState } from "react";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_IMAGE_LABEL,
  MAX_IMAGE_LABEL,
  MAX_IMAGES_PER_NEWS,
} from "@/lib/upload-limits";

interface Props {
  /** عدد الصور المحفوظة مسبقاً (التي لم يُطلب حذفها) لحساب المتاح. */
  existingCount?: number;
  label?: string;
}

export function ImageUploadField({
  existingCount = 0,
  label = "الصور المرفقة (اختياري)",
}: Props) {
  const [previews, setPreviews] = useState<string[]>([]);
  const remaining = Math.max(0, MAX_IMAGES_PER_NEWS - existingCount);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, remaining);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  if (remaining === 0) {
    return (
      <p className="p-3 text-[11px] rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
        تم الوصول للحد الأقصى ({MAX_IMAGES_PER_NEWS} صور). احذف صورة من الصور
        المرفقة لتتمكن من إضافة صورة أخرى.
      </p>
    );
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label}
      </label>
      <input
        key={remaining}
        type="file"
        name="images"
        multiple
        accept={ACCEPT_ATTRIBUTE}
        onChange={handleChange}
        className="block w-full text-xs text-slate-600 border border-dashed border-slate-300 rounded-xl px-3 py-2 file:me-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-white file:text-xs file:font-semibold hover:file:bg-emerald-800"
      />
      <p className="text-[11px] text-slate-500 mt-1">
        يمكنك إرفاق حتى {remaining} صورة — بحد أقصى {MAX_IMAGE_LABEL} للصورة
        الواحدة، والصيغ المسموحة: {ALLOWED_IMAGE_LABEL}
      </p>

      {previews.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {previews.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt="معاينة الصورة المرفقة"
              className="w-24 h-20 object-cover rounded-xl border border-slate-200"
            />
          ))}
        </div>
      )}
    </div>
  );
}
