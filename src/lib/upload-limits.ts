/**
 * ثوابت رفع الصور — ملف نقي (بدون وحدات سيرفر) ليُستخدم في
 * مكوّنات العميل والسيرفر معاً.
 */

/** الحد الأقصى لعدد الصور المرفقة بالخبر الواحد. */
export const MAX_IMAGES_PER_NEWS = 4;

/** الحد الأقصى لحجم الصورة الواحدة (4 ميجابايت). */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** صيغ الصور المدعومة. */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

/** سمة accept لحقل اختيار الملفات. */
export const ACCEPT_ATTRIBUTE = ALLOWED_IMAGE_TYPES.join(",");

/** وصف مقروء للحد الأقصى للحجم. */
export const MAX_IMAGE_LABEL = "4 ميجابايت";

/** وصف مقروء للصيغ المسموحة. */
export const ALLOWED_IMAGE_LABEL = "JPG / PNG / WEBP / GIF";
