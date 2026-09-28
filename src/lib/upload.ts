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

/** نطاق Vercel Blob العام — يُستخدم للتمييز بين الروابط السحابية والمسارات المحلية. */
const BLOB_HOST_PATTERN =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

/** هل التخزين السحابي (Vercel Blob) مُفعّل عبر متغيّر البيئة؟ */
export function isCloudStorageEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** وصف مختصر لوسيلة التخزين الحالية (للعرض في الواجهة). */
export function storageModeLabel(): string {
  return isCloudStorageEnabled()
    ? "صور الأخبار تُخزَّن سحابياً (Vercel Blob)"
    : "صور الأخبار تُخزَّن محلياً على الخادم (public/uploads)";
}

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

/** التحقق من الصيغة والحجم والعدد — يُعيد رسالة الخطأ أو null. */
function validateImages(files: File[]): string | null {
  if (files.length > MAX_IMAGES_PER_NEWS) {
    return `الحد الأقصى ${MAX_IMAGES_PER_NEWS} صور للخبر الواحد.`;
  }
  for (const file of files) {
    if (
      !ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      )
    ) {
      return "صيغة الصورة غير مدعومة (المسموح: JPG أو PNG أو WEBP أو GIF).";
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return "حجم الصورة الواحدة يجب ألا يتجاوز 4 ميجابايت.";
    }
  }
  return null;
}

/** توليد اسم ملف فريد آمن. */
function buildImageName(file: File): string {
  const rawExt = path.extname(file.name).toLowerCase();
  const ext = /^\.[a-z0-9]{2,5}$/.test(rawExt) ? rawExt : ".jpg";
  return `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
}

/** رفع الصور إلى Vercel Blob (بيئة الإنتاج). */
async function saveToBlob(
  files: File[],
  folder: string,
): Promise<{ paths: string[]; error?: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN as string;
  const { put } = await import("@vercel/blob");
  const paths: string[] = [];

  try {
    for (const file of files) {
      const result = await put(`${folder}/${buildImageName(file)}`, file, {
        access: "public",
        token,
        addRandomSuffix: true,
        contentType: file.type,
      });
      paths.push(result.url);
    }
  } catch {
    await deleteImages(paths);
    return {
      paths: [],
      error: "تعذّر رفع الصور إلى التخزين السحابي. تحقق من إعداد Vercel Blob.",
    };
  }

  return { paths };
}

/** حفظ الصور على قرص الخادم (بيئة التطوير المحلية). */
async function saveToDisk(
  files: File[],
  folder: string,
): Promise<{ paths: string[]; error?: string }> {
  const paths: string[] = [];

  try {
    const dir = path.join(UPLOADS_ROOT, folder);
    await mkdir(dir, { recursive: true });

    for (const file of files) {
      const fileName = buildImageName(file);
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, fileName), buffer);
      paths.push(`/uploads/${folder}/${fileName}`);
    }
  } catch {
    await deleteImages(paths);
    return {
      paths: [],
      error:
        "تعذّر حفظ الصور على هذا الخادم (نظام الملفات للقراءة فقط). فعّل Vercel Blob للتخزين السحابي.",
    };
  }

  return { paths };
}

/**
 * حفظ صور الأخبار: سحابياً إن توفّر BLOB_READ_WRITE_TOKEN، وإلا على القرص المحلي.
 * تُعيد error عند مخالفة الصيغة أو الحجم أو العدد.
 */
export async function saveImages(
  files: File[],
  folder = "news",
): Promise<{ paths: string[]; error?: string }> {
  if (files.length === 0) return { paths: [] };

  const invalid = validateImages(files);
  if (invalid) return { paths: [], error: invalid };

  return isCloudStorageEnabled()
    ? saveToBlob(files, folder)
    : saveToDisk(files, folder);
}

/**
 * حفظ صورة واحدة (صورة الطالب الموهوب).
 * يستخدم نفس التحقق من الصيغة والحجم المستخدَم في `saveImages`،
 * ويعيد المسار الناتج أو رسالة خطأ.
 */
export async function saveSingleImage(
  file: File | null,
  folder: string,
): Promise<{ path: string | null; error?: string }> {
  if (!file) return { path: null };

  const { paths, error } = await saveImages([file], folder);
  if (error) return { path: null, error };
  return { path: paths[0] ?? null };
}

/**
 * تصفية قيمة صورة مفردة قادمة من النموذج/قاعدة البيانات.
 * تقبل المسارات المحلية `/uploads/...` أو روابط Vercel Blob العامة فقط.
 */
export function normalizeImagePath(value: unknown): string {
  return normalizeImagePaths(value)[0] ?? "";
}

/** حذف صور مرفوعة (محلية أو سحابية) — يتجاهل أي قيمة غير معروفة المصدر. */
export async function deleteImages(paths: string[]): Promise<void> {
  const local: string[] = [];
  const remote: string[] = [];

  for (const value of paths ?? []) {
    const publicPath = String(value ?? "").trim();
    if (!publicPath) continue;
    if (BLOB_HOST_PATTERN.test(publicPath)) remote.push(publicPath);
    else if (publicPath.startsWith("/uploads/")) local.push(publicPath);
  }

  const tasks: Promise<void>[] = local.map(async (publicPath) => {
    const relative = publicPath.replace(/^\/+/, "");
    const target = path.join(process.cwd(), "public", relative);
    if (!target.startsWith(UPLOADS_ROOT)) return;
    try {
      await unlink(target);
    } catch {
      // الملف غير موجود — لا حاجة لأي إجراء
    }
  });

  if (remote.length > 0 && isCloudStorageEnabled()) {
    tasks.push(
      (async () => {
        try {
          const { del } = await import("@vercel/blob");
          await del(remote, {
            token: process.env.BLOB_READ_WRITE_TOKEN as string,
          });
        } catch {
          // فشل حذف أحد الملفات السحابية لا يمنع بقية العملية
        }
      })(),
    );
  }

  await Promise.all(tasks);
}

/**
 * تصفية قيم الصور القادمة من النماذج/قاعدة البيانات:
 * تقبل المسارات المحلية `/uploads/...` أو روابط Vercel Blob العامة فقط.
 */
export function normalizeImagePaths(values: unknown): string[] {
  const list = Array.isArray(values) ? values : [values];
  return list
    .map((value) => String(value ?? "").trim())
    .filter(
      (value) => value.startsWith("/uploads/") || BLOB_HOST_PATTERN.test(value),
    );
}

