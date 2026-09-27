import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_NEWS,
} from "@/lib/upload-limits";

export {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_NEWS,
} from "@/lib/upload-limits";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

/** استخراج ملفات الصور الصالحة من FormData (تجاهل الحقول الفارغة). */
export function extractImageFiles(formData: FormData, field = "images"): File[] {
  return formData
    .getAll(field)
    .filter(
      (entry): entry is File =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as File).arrayBuffer === "function" &&
        (entry as File).size > 0,
    );
}

/**
 * حفظ صور الأخبار داخل public/uploads/<folder> وإرجاع مساراتها العامة.
 * تُعيد error عند مخالفة الصيغة أو الحجم أو العدد.
 */
export async function saveImages(
  files: File[],
  folder = "news",
): Promise<{ paths: string[]; error?: string }> {
  if (files.length === 0) return { paths: [] };

  if (files.length > MAX_IMAGES_PER_NEWS) {
    return { paths: [], error: `الحد الأقصى ${MAX_IMAGES_PER_NEWS} صور للخبر الواحد.` };
  }

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      return {
        paths: [],
        error: "صيغة الصورة غير مدعومة (المسموح: JPG أو PNG أو WEBP أو GIF).",
      };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { paths: [], error: "حجم الصورة الواحدة يجب ألا يتجاوز 4 ميجابايت." };
    }
  }

  const dir = path.join(UPLOADS_ROOT, folder);
  await mkdir(dir, { recursive: true });

  const paths: string[] = [];
  try {
    for (const file of files) {
      const rawExt = path.extname(file.name).toLowerCase();
      const ext = /^\.[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : ".jpg";
      const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, fileName), buffer);
      paths.push(`/uploads/${folder}/${fileName}`);
    }
  } catch {
    // إزالة ما تم حفظه جزئياً عند حدوث خطأ
    await deleteImages(paths);
    return { paths: [], error: "تعذّر حفظ الصور على الخادم." };
  }

  return { paths };
}

/** حذف صور مرفوعة مسبقاً من مجلد الرفع (يتجاهل أي مسار خارج /uploads). */
export async function deleteImages(paths: string[]): Promise<void> {
  await Promise.all(
    paths.map(async (publicPath) => {
      const relative = String(publicPath).replace(/^\/+/, "");
      if (!relative.startsWith("uploads/")) return;
      const target = path.join(process.cwd(), "public", relative);
      if (!target.startsWith(UPLOADS_ROOT)) return;
      try {
        await unlink(target);
      } catch {
        // الملف غير موجود — لا حاجة لأي إجراء
      }
    }),
  );
}

/** تصفية مسارات الصور المخزنة في قاعدة البيانات. */
export function normalizeImagePaths(values: unknown): string[] {
  const list = Array.isArray(values) ? values : [values];
  return list
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.startsWith("/uploads/"));
}
