"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { User } from "@/models/User";
import { Region } from "@/models/Region";
import { Administration } from "@/models/Administration";
import { Institute } from "@/models/Institute";
import { MonthlyVisit } from "@/models/MonthlyVisit";
import { DailyReport } from "@/models/DailyReport";
import { VISIT_TYPES, type VisitType } from "@/types";

type PlanActionResult = { success: boolean; error?: string };

/** المدير الذي يضع الخطة: المنطقة أو الإدارة التعليمية فقط. */
function isPlanManager(role: string | undefined): boolean {
  return role === "region" || role === "administration";
}

/** يقرأ قيمة حقل من FormData كسلسلة مقصوصة. */
function fd(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

/**
 * حفظ مواعيد الخطة الشهرية (تُرسل دفعة واحدة).
 * كل موعد: موجّه + منطقة + إدارة + معهد + نوع + تاريخ.
 */
export async function saveMonthlyPlanAction(
  prevState: PlanActionResult,
  formData: FormData,
): Promise<PlanActionResult> {
  const session = await getSession();
  if (!session || !isPlanManager(session.role)) {
    return { success: false, error: "الخطة الشهرية يضعها موجه المنطقة أو الإدارة التعليمية فقط." };
  }

  const month = fd(formData, "month");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return { success: false, error: "صيغة الشهر غير صحيحة (المتوقع YYYY-MM)." };
  }

  // المواعيد كحقول متوازية: supervisorIds[] instituteIds[] visitTypes[] dates[]
  const supervisors = formData.getAll("supervisorIds").map(String);
  const institutes = formData.getAll("instituteIds").map(String);
  const visitTypes = formData.getAll("visitTypes").map(String);
  const dates = formData.getAll("dates").map(String);
  const len = Math.max(supervisors.length, institutes.length, visitTypes.length, dates.length);

  if (len === 0) {
    return { success: false, error: "أضف موعدًا واحدًا على الأقل للخطة." };
  }

  await dbConnect();

  // نطاق المدير
  const regionDocs = await Region.find(
    session.role === "region" && session.regionId ? { _id: session.regionId } : {},
  ).lean();
  const adminDocs = await Administration.find(
    session.role === "administration" && session.administrationId
      ? { _id: session.administrationId }
      : session.role === "region" && session.regionId
        ? { region: session.regionId }
        : {},
  ).lean();

  const validRegionIds = new Set(regionDocs.map((r) => String(r._id)));
  const validAdminIds = new Set(adminDocs.map((a) => String(a._id)));
  const adminById = new Map(adminDocs.map((a) => [String(a._id), a]));
  const validInstDocs = await Institute.find({
    administration: { $in: [...validAdminIds] },
  }).lean();
  const instById = new Map(validInstDocs.map((i) => [String(i._id), i]));

  const docs: Array<Record<string, unknown>> = [];

  for (let idx = 0; idx < len; idx++) {
    const supervisorId = supervisors[idx];
    const instituteId = institutes[idx];
    const visitType = visitTypes[idx];
    const dateRaw = dates[idx];

    if (!supervisorId || !instituteId || !visitType || !dateRaw) {
      return { success: false, error: `الموعد رقم ${idx + 1} غير مكتمل.` };
    }
    if (!VISIT_TYPES.includes(visitType as VisitType)) {
      return { success: false, error: `نوع الموعد رقم ${idx + 1} غير صالح.` };
    }

    const inst = instById.get(instituteId);
    if (!inst) {
      return { success: false, error: `المعهد في الموعد رقم ${idx + 1} خارج نطاقك.` };
    }

    // الموجّه يجب أن يكون داخل نطاق المدير
    const supervisor = await User.findOne({
      _id: supervisorId,
      role: { $in: ["region", "administration"] },
    }).lean();
    if (!supervisor) {
      return { success: false, error: `الموجّه في الموعد رقم ${idx + 1} غير موجود أو ليس موجّهًا.` };
    }
    const supRegion = supervisor.region ? String(supervisor.region) : null;
    const supAdmin = supervisor.administration ? String(supervisor.administration) : null;
    if (supRegion && !validRegionIds.has(supRegion)) {
      return { success: false, error: `الموجّه في الموعد رقم ${idx + 1} خارج نطاقك الإداري.` };
    }
    if (supAdmin && !validAdminIds.has(supAdmin)) {
      return { success: false, error: `الموجّه في الموعد رقم ${idx + 1} خارج نطاقك الإداري.` };
    }

    // التاريخ يجب أن يقع داخل الشهر المطلوب
    const [y, m] = month.split("-").map(Number);
    const date = new Date(dateRaw);
    if (
      Number.isNaN(date.getTime()) ||
      date.getFullYear() !== y ||
      date.getMonth() + 1 !== m
    ) {
      return { success: false, error: `تاريخ الموعد رقم ${idx + 1} خارج الشهر المحدد.` };
    }

    const admin = adminById.get(String(inst.administration));
    if (!admin?.region) {
      return { success: false, error: `تعذّر تحديد منطقة المعهد في الموعد رقم ${idx + 1}.` };
    }

    docs.push({
      month,
      supervisor: new Types.ObjectId(supervisorId),
      region: admin.region,
      administration: inst.administration,
      institute: inst._id,
      visitType: visitType as VisitType,
      date,
      notes: "",
      createdBy: new Types.ObjectId(session.id),
      createdByRole: session.role,
    });
  }

  try {
    await MonthlyVisit.insertMany(docs, { ordered: false });
    revalidatePath("/dashboard/followup");
    return { success: true };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return { success: false, error: "يوجد موعد مكرر لنفس الموجّه في نفس المعهد والتاريخ." };
    }
    return { success: false, error: "حدث خطأ أثناء حفظ الخطة." };
  }
}

/** حفظ/تحديث التقرير اليومي لموعد (مسودة). الموجّه يملؤه لنفسه. */
export async function saveDailyReportAction(
  prevState: PlanActionResult,
  formData: FormData,
): Promise<PlanActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "غير مصرح." };

  const visitId = fd(formData, "visitId");
  if (!visitId) return { success: false, error: "الموعد غير محدد." };

  await dbConnect();
  const visit = await MonthlyVisit.findById(visitId);
  if (!visit) return { success: false, error: "الموعد غير موجود." };

  // المعهد لا يكتب تقارير (الموجّه فقط)
  if (session.role === "institute") {
    return { success: false, error: "التقرير يملؤه الموجّه فقط." };
  }
  if (String(visit.supervisor) !== session.id) {
    return { success: false, error: "هذا الموعد يخصّ موجّهًا آخر." };
  }

  await DailyReport.findOneAndUpdate(
    { visit: visitId },
    {
      $set: {
        month: visit.month,
        supervisor: visit.supervisor,
        summary: fd(formData, "summary"),
        recommendations: fd(formData, "recommendations"),
        status: "draft",
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  revalidatePath("/dashboard/followup");
  return { success: true };
}

/** إرسال التقرير اليومي (يقفله في وضع «مُرسل»). */
export async function submitDailyReportAction(
  prevState: PlanActionResult,
  formData: FormData,
): Promise<PlanActionResult> {
  const session = await getSession();
  if (!session) return { success: false, error: "غير مصرح." };

  const visitId = fd(formData, "visitId");
  if (!visitId) return { success: false, error: "الموعد غير محدد." };

  await dbConnect();
  const visit = await MonthlyVisit.findById(visitId);
  if (!visit) return { success: false, error: "الموعد غير موجود." };
  if (session.role === "institute") {
    return { success: false, error: "التقرير يرسله الموجّه فقط." };
  }
  if (String(visit.supervisor) !== session.id) {
    return { success: false, error: "هذا الموعد يخصّ موجّهًا آخر." };
  }

  await DailyReport.findOneAndUpdate(
    { visit: visitId },
    {
      $set: {
        month: visit.month,
        supervisor: visit.supervisor,
        status: "submitted",
        submittedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  revalidatePath("/dashboard/followup");
  return { success: true };
}
