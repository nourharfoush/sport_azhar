"use client";

import { useEffect, useState } from "react";
import {
  ACCEPT_ATTRIBUTE,
  ALLOWED_IMAGE_LABEL,
  MAX_IMAGE_LABEL,
} from "@/lib/upload-limits";

interface Props {
  /** الصورة المحفوظة حاليًا (تظهر كبديل إذا لم يُرفع ملف جديد). */
  currentPhoto?: string;
  /** صورة المعاينة المحلية (تُلغى عند تغيير الاختيار). */
  preview?: string | null;
  onPreviewChange?: (url: string | null) => void;
  required?: boolean;
}

/**
 * حقل رفع صورة الطالب الموهوب (صورة واحدة فقط).
 * يتحقق من اختيار ملف فعلي قبل السماح بالإرسال.
 */
export function StudentPhotoField({
  currentPhoto,
  preview,
  onPreviewChange,
  required = false,
}: Props) {
  const [hasFile, setHasFile] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setHasFile(Boolean(file));
    if (!file) {
      onPreviewChange?.(null);
      return;
    }
    onPreviewChange?.(URL.createObjectURL(file));
  };

  const shown = preview ?? currentPhoto ?? "";

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        صورة الطالب {required ? "*" : "(اختياري)"}
      </label>

      <div className="flex items-start gap-4">
        <div className="w-24 h-28 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown}
              alt="صورة الطالب"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[11px] text-slate-400 text-center px-1">
              لا توجد صورة
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <input
            type="file"
            name="photo"
            accept={ACCEPT_ATTRIBUTE}
            required={required && !currentPhoto}
            onChange={handleChange}
            className="block w-full text-xs text-slate-600 border border-dashed border-slate-300 rounded-xl px-3 py-2 file:me-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-1.5 file:text-white file:text-xs file:font-semibold hover:file:bg-emerald-800"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            {currentPhoto && !hasFile
              ? "الصورة الحالية محفوظة — ارفع صورة جديدة لاستبدالها."
              : `صورة واحدة بحد أقصى ${MAX_IMAGE_LABEL}، والصيغ المسموحة: ${ALLOWED_IMAGE_LABEL}`}
          </p>
        </div>
      </div>
    </div>
  );
}