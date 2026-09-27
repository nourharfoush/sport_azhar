"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { News } from "@/models/News";
import {
  canManageNews,
  canManageScopedItem,
  scopedOwnershipForRole,
} from "@/lib/rbac";
import { NEWS_CATEGORIES, type NewsCategory } from "@/types";
import {
  MAX_IMAGES_PER_NEWS,
  deleteImages,
  extractImageFiles,
  normalizeImagePaths,
  saveImages,
} from "@/lib/upload";

/** التحقق من صحة تصنيف الخبر. */
function parseCategory(value: string): NewsCategory | null {
  return NEWS_CATEGORIES.includes(value as NewsCategory)
    ? (value as NewsCategory)
    : null;
}

/** إنشاء خبر/تعميم داخل نطاق المستخدم حسب مستواه الهرمي. */
export async function createNewsAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageNews(session)) {
    return { success: false, error: "غير مصرح لك بإضافة أخبار أو تعميمات." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const category = parseCategory(String(formData.get("category") ?? "news"));
  const isPinned = Boolean(formData.get("isPinned"));
  const published = Boolean(formData.get("published"));

  if (!title || !content) {
    return { success: false, error: "يرجى كتابة عنوان الخبر ونصه." };
  }
  if (!category) {
    return { success: false, error: "تصنيف الخبر غير صالح." };
  }

  // الصور المرفقة (اختيارية) — تُحفظ داخل public/uploads/news
  const { paths: imagePaths, error: uploadError } = await saveImages(
    extractImageFiles(formData),
  );
  if (uploadError) return { success: false, error: uploadError };

  // النطاق يُستنتج من المستوى (نفس منطق الفعاليات)
  const { scope, region, administration } = scopedOwnershipForRole(session);

  await dbConnect();
  try {
    await News.create({
      title,
      content,
      category,
      scope,
      region,
      administration,
      isPinned,
      published,
      images: imagePaths,
      authorRole: session.role,
      createdBy: session.id,
    });

    revalidatePath("/dashboard/news");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    await deleteImages(imagePaths);
    return { success: false, error: "حدث خطأ أثناء حفظ الخبر." };
  }
}

/** تعديل خبر/تعميم مع التحقق من الصلاحيات والنطاق. */
export async function updateNewsAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageNews(session)) {
    return { success: false, error: "غير مصرح لك بتعديل الأخبار." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const category = parseCategory(String(formData.get("category") ?? "news"));
  const isPinned = Boolean(formData.get("isPinned"));
  const published = Boolean(formData.get("published"));

  if (!id || !title || !content) {
    return { success: false, error: "يرجى استيفاء الحقول الإلزامية." };
  }
  if (!category) {
    return { success: false, error: "تصنيف الخبر غير صالح." };
  }

  await dbConnect();
  try {
    const news = await News.findById(id);
    if (!news) return { success: false, error: "الخبر غير موجود." };

    // التحقق من الصلاحيات (منطق موحّد في lib/rbac)
    if (!canManageScopedItem(session, news)) {
      return { success: false, error: "لا تملك صلاحية تعديل خبر خارج نطاقك." };
    }

    // الصور: الحفاظ على القديم (فيما لم يُطلب حذفه) + إضافة الجديد
    const removable = normalizeImagePaths(formData.getAll("removeImages"));
    const keptImages = (news.images ?? []).filter(
      (img) => !removable.includes(img),
    );
    const files = extractImageFiles(formData);

    if (keptImages.length + files.length > MAX_IMAGES_PER_NEWS) {
      return {
        success: false,
        error: `الحد الأقصى ${MAX_IMAGES_PER_NEWS} صور للخبر الواحد.`,
      };
    }

    const { paths: newImages, error: uploadError } = await saveImages(files);
    if (uploadError) return { success: false, error: uploadError };

    news.title = title;
    news.content = content;
    news.category = category;
    news.isPinned = isPinned;
    news.published = published;
    news.images = [...keptImages, ...newImages];
    await news.save();

    // حذف ملفات الصور التي أزالها المستخدم من القرص
    await deleteImages(removable);

    revalidatePath("/dashboard/news");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء تعديل الخبر." };
  }
}

/** نشر/إلغاء نشر خبر (تنبيه سريع من القائمة) مع التحقق من الصلاحيات. */
export async function toggleNewsPublishAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !canManageNews(session)) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await dbConnect();
  const news = await News.findById(id);
  if (!news) return;

  if (!canManageScopedItem(session, news)) return;

  news.published = !news.published;
  await news.save();

  revalidatePath("/dashboard/news");
  revalidatePath("/dashboard");
}

/** تثبيت/إلغاء تثبيت خبر في أعلى القائمة. */
export async function toggleNewsPinAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || !canManageNews(session)) return;

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await dbConnect();
  const news = await News.findById(id);
  if (!news) return;

  if (!canManageScopedItem(session, news)) return;

  news.isPinned = !news.isPinned;
  await news.save();

  revalidatePath("/dashboard/news");
  revalidatePath("/dashboard");
}

/** حذف خبر/تعميم مع التحقق من الصلاحيات. */
export async function deleteNewsAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageNews(session)) {
    return { success: false, error: "غير مصرح لك بحذف الأخبار." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "معرف الخبر مفقود." };

  await dbConnect();
  try {
    const news = await News.findById(id);
    if (!news) return { success: false, error: "الخبر غير موجود." };

    // التحقق من الصلاحيات (منطق موحّد في lib/rbac)
    if (!canManageScopedItem(session, news)) {
      return { success: false, error: "لا تملك صلاحية حذف خبر خارج نطاقك." };
    }

    await News.findByIdAndDelete(id);

    // حذف الصور المرفقة من القرص
    await deleteImages(normalizeImagePaths(news.images));

    revalidatePath("/dashboard/news");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حذف الخبر." };
  }
}

