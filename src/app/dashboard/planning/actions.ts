"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PlanningRecord } from "@/models/PlanningRecord";
import { Institute } from "@/models/Institute";
import { Administration } from "@/models/Administration";
import { canManagePlanningItem } from "@/lib/rbac";
import {
  GENERIC_PLANNING_SECTIONS,
  isPlanningSection,
  type PlanningSection,
} from "@/types";

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/** الأقسام التي تُدار بهذه Actions (الأخرى لها صفحة خاصة). */
function parseSection(value: string): PlanningSection | null {
  const v = value as PlanningSection;
  return GENERIC_PLANNING_SECTIONS.includes(v) && isPlanningSection(v) ? v : null;
}

/**
 * تحديد نطاق السجل من المعهد المختار (منطقة/إدارة/معهد).
 * السجل بلا معهد = سجل مركزي يراه الجميع.
 */
async function resolveScope(
  session: {
    role: string;
    regionId: string | null;
    administrationId: string | null;
    instituteId: string | null;
  },
  instituteId: string,
): Promise<
  | {
      regionId: string | null;
      administrationId: string | null;
      instituteId: string | null;
    }
  | { error: string }
> {
  // سجل مركزي — الإدارة العامة فقط
  if (!instituteId) {
    if (session.role !== "general") {
      return { error: "السجلات المركزية من اختصاص الإدارة العامة وحدها." };
    }
    return { regionId: null, administrationId: null, instituteId: null };
  }

  await dbConnect();
  const institute = await Institute.findById(instituteId).select("administration");
  if (!institute) return { error: "المعهد غير موجود." };

  const administrationId = String(institute.administration ?? "");
  const administration = await Administration.findById(administrationId).select(
    "region",
  );
  const regionId = administration?.region ? String(administration.region) : "";

  if (session.role === "region" && regionId !== String(session.regionId)) {
    return { error: "لا تملك صلاحية التسجيل في معاهد خارج منطقتك." };
  }
  if (
    session.role === "administration" &&
    administrationId !== String(session.administrationId)
  ) {
    return { error: "لا تملك صلاحية التسجيل في معاهد خارج إدارتك." };
  }
  if (
    session.role === "institute" &&
    String(session.instituteId ?? "") !== String(instituteId)
  ) {
    return { error: "لا تملك صلاحية التسجيل لغير معهدك." };
  }

  return { regionId, administrationId, instituteId };
}

/** إضافة سجل جديد في قسم من أقسام «التخطيط والمتابعة». */
export async function createPlanningRecordAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "انتهت الجلسة." };

  const section = parseSection(field(formData, "section"));
  if (!section) return { success: false, error: "القسم غير صالح." };

  const title = field(formData, "title");
  if (!title) return { success: false, error: "يرجى كتابة العنوان." };

  const scope = await resolveScope(session, field(formData, "instituteId"));
  if ("error" in scope) return { success: false, error: scope.error };

  try {
    await PlanningRecord.create({
      section,
      title,
      academicYear: field(formData, "academicYear"),
      content: field(formData, "content"),
      items: field(formData, "items"),
      links: field(formData, "links"),
      status: field(formData, "status"),
      region: scope.regionId,
      administration: scope.administrationId,
      institute: scope.instituteId,
      authorRole: session.role,
      createdBy: session.id,
    });
    revalidatePath("/dashboard/planning");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حفظ السجل." };
  }
}

/** تعديل سجل في «التخطيط والمتابعة». */
export async function updatePlanningRecordAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "انتهت الجلسة." };

  const id = field(formData, "id");
  if (!id) return { success: false, error: "معرف السجل مفقود." };

  const section = parseSection(field(formData, "section"));
  if (!section) return { success: false, error: "القسم غير صالح." };

  const title = field(formData, "title");
  if (!title) return { success: false, error: "يرجى كتابة العنوان." };

  await dbConnect();
  const record = await PlanningRecord.findById(id);
  if (!record) return { success: false, error: "السجل غير موجود." };
  if (!canManagePlanningItem(session, record)) {
    return { success: false, error: "لا تملك صلاحية تعديل سجل خارج نطاقك." };
  }

  const scope = await resolveScope(session, field(formData, "instituteId"));
  if ("error" in scope) return { success: false, error: scope.error };

  try {
    record.section = section;
    record.title = title;
    record.academicYear = field(formData, "academicYear");
    record.content = field(formData, "content");
    record.items = field(formData, "items");
    record.links = field(formData, "links");
    record.status = field(formData, "status");
    record.region = scope.regionId as never;
    record.administration = scope.administrationId as never;
    record.institute = scope.instituteId as never;
    await record.save();
    revalidatePath("/dashboard/planning");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء تعديل السجل." };
  }
}

/** حذف سجل من «التخطيط والمتابعة». */
export async function deletePlanningRecordAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session) return { success: false, error: "انتهت الجلسة." };

  const id = field(formData, "id");
  if (!id) return { success: false, error: "معرف السجل مفقود." };

  await dbConnect();
  try {
    const record = await PlanningRecord.findById(id);
    if (!record) return { success: false, error: "السجل غير موجود." };
    if (!canManagePlanningItem(session, record)) {
      return { success: false, error: "لا تملك صلاحية حذف سجل خارج نطاقك." };
    }
    await PlanningRecord.findByIdAndDelete(id);
    revalidatePath("/dashboard/planning");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حذف السجل." };
  }
}