"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { GiftedStudent } from "@/models/GiftedStudent";
import { Institute } from "@/models/Institute";
import { Administration } from "@/models/Administration";
import { canManageGifted, canManageGiftedItem } from "@/lib/rbac";
import {
  deleteImages,
  extractImageFiles,
  normalizeImagePath,
  saveSingleImage,
} from "@/lib/upload";
import {
  GENDERS,
  SPORT_CATEGORIES,
  STUDENT_GRADES,
  categoryOf,
  isActivityValid,
  isNationalIdValid,
  type Gender,
  type SessionUser,
  type SportCategory,
} from "@/types";

/** مجلد حفظ صور الطلاب الموهوبين. */
const PHOTO_FOLDER = "gifted";

interface ParsedForm {
  fullName: string;
  nationalId: string;
  instituteId: string;
  grade: string;
  gender: Gender;
  category: SportCategory;
  sport: string;
  notes: string;
}

interface ParsedScope {
  data: ParsedForm;
  administrationId: string;
  regionId: string;
}

/**
 * التحقق من صحة حقول النموذج، واستخراج نطاق الطالب (منطقة/إدارة)
 * من المعهد المختار بدل الثقة بالقيم القادمة من المتصفح.
 */
async function parseGiftedForm(
  formData: FormData,
  session: SessionUser,
): Promise<ParsedScope | { error: string }> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const nationalId = String(formData.get("nationalId") ?? "").trim();
  const instituteId = String(formData.get("instituteId") ?? "").trim();
  const grade = String(formData.get("grade") ?? "").trim();
  const gender = String(formData.get("gender") ?? "بنين").trim() as Gender;
  const category = String(
    formData.get("category") ?? "competitions",
  ).trim() as SportCategory;
  const sport = String(formData.get("sport") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fullName) return { error: "يرجى كتابة اسم الطالب." };
  if (!isNationalIdValid(nationalId)) {
    return { error: "الرقم القومي يجب أن يتكوّن من 14 رقمًا." };
  }
  if (!instituteId) return { error: "يرجى اختيار المعهد." };
  if (!STUDENT_GRADES.includes(grade as (typeof STUDENT_GRADES)[number])) {
    return { error: "الصف الدراسي غير صالح." };
  }
  if (!GENDERS.includes(gender)) {
    return { error: "فئة الطالب غير صالحة." };
  }
  if (!SPORT_CATEGORIES.includes(category)) {
    return { error: "المسار المختار غير صالح." };
  }
  if (!sport) {
    return {
      error:
        category === "programs"
          ? "يرجى اختيار البرنامج."
          : "يرجى اختيار المسابقة.",
    };
  }
  // المسار يجب أن يطابق العنصر المختار، والعنصر يجب أن ينتمي لفئة الطالب
  if (categoryOf(sport) !== category) {
    return {
      error:
        category === "programs"
          ? "العنصر المختار ليس من البرامج والمشروعات."
          : "العنصر المختار ليس من المسابقات الرياضية.",
    };
  }
  if (!isActivityValid(gender, category, sport)) {
    return {
      error:
        gender === "فتيات" &&
        (category === "programs"
          ? !isActivityValid("بنين", category, sport)
          : false)
          ? "هذا العنصر متاح لفئة البنات فقط."
          : "العنصر المختار غير متاح لفئة الطالب.",
    };
  }

  await dbConnect();
  const scope = await resolveInstituteScope(session, instituteId);
  if ("error" in scope) return scope;

  return {
    data: {
      fullName,
      nationalId,
      instituteId,
      grade,
      gender,
      category,
      sport,
      notes,
    },
    administrationId: scope.administrationId,
    regionId: scope.regionId,
  };
}

/**
 * يستخرج (الإدارة التعليمية، المنطقة) من المعهد، ويتحقق أن المعهد
 * يقع ضمن نطاق المستخدم الهرمي:
 * - الإدارة العامة: كل المعاهد.
 * - المنطقة: معاهد منطقتها.
 * - الإدارة التعليمية: معاهد إدارتها.
 * - المعهد: معهده فقط.
 */
async function resolveInstituteScope(
  session: SessionUser,
  instituteId: string,
): Promise<
  { administrationId: string; regionId: string } | { error: string }
> {
  const institute = await Institute.findById(instituteId).select("administration");
  if (!institute) return { error: "المعهد غير موجود." };

  const administrationId = String(institute.administration ?? "");
  if (!administrationId || administrationId === "null") {
    return { error: "المعهد غير مرتبط بإدارة تعليمية." };
  }

  const administration = await Administration.findById(administrationId).select(
    "region",
  );
  const regionId = administration?.region ? String(administration.region) : "";

  if (session.role === "general") {
    if (!regionId) return { error: "الإدارة التعليمية غير مرتبطة بمنطقة." };
    return { administrationId, regionId };
  }

  if (session.role === "region") {
    if (!regionId || String(session.regionId ?? "") !== regionId) {
      return { error: "لا تملك صلاحية التسجيل في معاهد خارج منطقتك." };
    }
    return { administrationId, regionId };
  }

  if (session.role === "administration") {
    if (String(session.administrationId ?? "") !== administrationId) {
      return { error: "لا تملك صلاحية التسجيل في معاهد خارج إدارتك." };
    }
    if (!regionId) return { error: "الإدارة التعليمية غير مرتبطة بمنطقة." };
    return { administrationId, regionId };
  }

  if (session.role === "institute") {
    if (String(session.instituteId ?? "") !== String(institute._id)) {
      return { error: "لا تملك صلاحية التسجيل لطلاب معاهد أخرى." };
    }
    if (!regionId) return { error: "المعهد غير مرتبط بمنطقة صحيحة." };
    return { administrationId, regionId };
  }

  return { error: "غير مصرح لك بإضافة الطلاب الموهوبين." };
}

/** إضافة طالب موهوب جديد مع رفع صورته. */
export async function createGiftedAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageGifted(session)) {
    return { success: false, error: "غير مصرح لك بإضافة الطلاب الموهوبين." };
  }

  const parsed = await parseGiftedForm(formData, session);
  if ("error" in parsed) return { success: false, error: parsed.error };

  // الرقم القومي فريد على مستوى الجمهورية
  const duplicate = await GiftedStudent.findOne({
    nationalId: parsed.data.nationalId,
  });
  if (duplicate) {
    return {
      success: false,
      error: "هذا الرقم القومي مسجَّل بالفعل في ركن الموهوبين.",
    };
  }

  const files = extractImageFiles(formData, "photo");
  if (files.length === 0) {
    return { success: false, error: "يرجى إرفاق صورة الطالب." };
  }

  const { path: photo, error: uploadError } = await saveSingleImage(
    files[0],
    PHOTO_FOLDER,
  );
  if (uploadError || !photo) {
    return { success: false, error: uploadError ?? "تعذّر حفظ صورة الطالب." };
  }

  try {
    await GiftedStudent.create({
      fullName: parsed.data.fullName,
      nationalId: parsed.data.nationalId,
      institute: parsed.data.instituteId,
      administration: parsed.administrationId,
      region: parsed.regionId,
      grade: parsed.data.grade,
      gender: parsed.data.gender,
      category: parsed.data.category,
      sport: parsed.data.sport,
      notes: parsed.data.notes,
      photo,
      createdBy: session.id,
    });

    revalidatePath("/dashboard/gifted");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    // تنظيف الصورة المرفوعة حتى لا يبقى ملف يتيم بلا سجل
    await deleteImages([photo]);
    return { success: false, error: "حدث خطأ أثناء حفظ بيانات الطالب." };
  }
}

/** تعديل بيانات طالب موهوب (مع استبدال الصورة اختياريًا). */
export async function updateGiftedAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageGifted(session)) {
    return { success: false, error: "غير مصرح لك بتعديل الطلاب الموهوبين." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "معرف الطالب مفقود." };

  await dbConnect();
  const student = await GiftedStudent.findById(id);
  if (!student) return { success: false, error: "الطالب غير موجود." };
  if (!canManageGiftedItem(session, student)) {
    return { success: false, error: "لا تملك صلاحية تعديل طالب خارج نطاقك." };
  }

  const parsed = await parseGiftedForm(formData, session);
  if ("error" in parsed) return { success: false, error: parsed.error };

  const duplicate = await GiftedStudent.findOne({
    nationalId: parsed.data.nationalId,
    _id: { $ne: id },
  });
  if (duplicate) {
    return {
      success: false,
      error: "هذا الرقم القومي مسجَّل بالفعل في ركن الموهوبين.",
    };
  }

  // الصورة القديمة تُحذف فقط عند رفع صورة جديدة
  const files = extractImageFiles(formData, "photo");
  const previousPhoto = student.photo;
  let photo = previousPhoto;

  if (files.length > 0) {
    const { path: newPhoto, error: uploadError } = await saveSingleImage(
      files[0],
      PHOTO_FOLDER,
    );
    if (uploadError || !newPhoto) {
      return { success: false, error: uploadError ?? "تعذّر حفظ صورة الطالب." };
    }
    photo = newPhoto;
  }

  try {
    student.fullName = parsed.data.fullName;
    student.nationalId = parsed.data.nationalId;
    student.institute = parsed.data.instituteId as never;
    student.administration = parsed.administrationId as never;
    student.region = parsed.regionId as never;
    student.grade = parsed.data.grade;
    student.gender = parsed.data.gender;
    student.category = parsed.data.category;
    student.sport = parsed.data.sport;
    student.notes = parsed.data.notes;
    student.photo = photo;
    await student.save();

    if (photo !== previousPhoto) await deleteImages([previousPhoto]);

    revalidatePath("/dashboard/gifted");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    if (photo !== previousPhoto) await deleteImages([photo]);
    return { success: false, error: "حدث خطأ أثناء تعديل بيانات الطالب." };
  }
}

/** حذف طالب موهوب مع حذف صورته من التخزين. */
export async function deleteGiftedAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageGifted(session)) {
    return { success: false, error: "غير مصرح لك بحذف الطلاب الموهوبين." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "معرف الطالب مفقود." };

  await dbConnect();
  try {
    const student = await GiftedStudent.findById(id);
    if (!student) return { success: false, error: "الطالب غير موجود." };
    if (!canManageGiftedItem(session, student)) {
      return { success: false, error: "لا تملك صلاحية حذف طالب خارج نطاقك." };
    }

    const photo = normalizeImagePath(student.photo);
    await GiftedStudent.findByIdAndDelete(id);
    await deleteImages([photo]);

    revalidatePath("/dashboard/gifted");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حذف الطالب." };
  }
}
