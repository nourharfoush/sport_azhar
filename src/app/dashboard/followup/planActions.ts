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
import { VISIT_TYPES, type SessionUser, type VisitType } from "@/types";
import { isPlanManager, supervisedRolesFor } from "./planScope";
import {
  missingReportFields,
  missingAdminReportFields,
  submitWindow,
} from "./reportRules";
import {
  ADMIN_DATA_COMPLETENESS,
  ADMIN_PROGRAM_STATUS,
  ATTENDANCE,
  COMPLETENESS,
  EXISTENCE,
  PLAN_EXECUTION,
  SPORT_CATEGORIES,
  YES_NO,
  type AdministrationReportBody,
  type DailyReportBody,
} from "@/types";

/**
 * يقرأ نموذج التقرير إلى كائن DailyReportBody.
 * الحقول الشرطية تُحفظ فقط عندما يتحقق شرطها،
 * فلا تتراكم قيم قديمة بعد تغيير الاختيار.
 */
function parseReportBody(formData: FormData): DailyReportBody {
  const num = (k: string): number | undefined => {
    const raw = String(formData.get(k) ?? "").trim();
    if (raw === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const str = (k: string): string | undefined => {
    const raw = String(formData.get(k) ?? "").trim();
    return raw === "" ? undefined : raw;
  };
  const oneOf = <T extends string>(k: string, allowed: readonly T[]): T | undefined => {
    const raw = String(formData.get(k) ?? "").trim() as T;
    return allowed.includes(raw) ? raw : undefined;
  };

  const body: DailyReportBody = {};

  const studentCount = num("studentCount");
  if (studentCount !== undefined) body.studentCount = studentCount;
  const boysCount = num("boysCount");
  if (boysCount !== undefined) body.boysCount = boysCount;
  const girlsCount = num("girlsCount");
  if (girlsCount !== undefined) body.girlsCount = girlsCount;

  const peTeacherPresent = oneOf("peTeacherPresent", ATTENDANCE);
  if (peTeacherPresent) body.peTeacherPresent = peTeacherPresent;

  const seconded = oneOf("seconded", YES_NO);
  if (seconded) body.seconded = seconded;
  if (seconded === "yes") {
    const nm = str("secondedInstituteName");
    if (nm) body.secondedInstituteName = nm;
  }

  const peLessonsCount = num("peLessonsCount");
  if (peLessonsCount !== undefined) body.peLessonsCount = peLessonsCount;

  const uniformCompliant = oneOf("uniformCompliant", YES_NO);
  if (uniformCompliant) body.uniformCompliant = uniformCompliant;

  const recordBook = oneOf("recordBook", EXISTENCE);
  if (recordBook) body.recordBook = recordBook;
  if (recordBook === "present") {
    const c = oneOf("recordBookCompleteness", COMPLETENESS);
    if (c) body.recordBookCompleteness = c;
  }

  const records = oneOf("records", EXISTENCE);
  if (records) body.records = records;
  if (records === "present") {
    const c = oneOf("recordsCompleteness", COMPLETENESS);
    if (c) body.recordsCompleteness = c;
    if (c === "incomplete") {
      const names = str("missingRecordsNames");
      if (names) body.missingRecordsNames = names;
    }
  }

  const financialPlan = oneOf("financialPlan", EXISTENCE);
  if (financialPlan) body.financialPlan = financialPlan;
  if (financialPlan === "absent") {
    const reason = str("financialPlanAbsentReason");
    if (reason) body.financialPlanAbsentReason = reason;
  } else if (financialPlan === "present") {
    const ex = oneOf("financialPlanExecution", PLAN_EXECUTION);
    if (ex) body.financialPlanExecution = ex;
  }

  const positives = str("positives");
  if (positives) body.positives = positives;
  const negatives = str("negatives");
  if (negatives) body.negatives = negatives;
  const suggestions = str("suggestions");
  if (suggestions) body.suggestions = suggestions;
  const generalNotes = str("generalNotes");
  if (generalNotes) body.generalNotes = generalNotes;

  return body;
}

/**
 * يقرأ نموذج تقرير متابعة الإدارة التعليمية إلى كائن AdministrationReportBody.
 * الحقول الشرطية تُحفظ فقط عندما يتحقق شرطها.
 */
function parseAdminReportBody(formData: FormData): AdministrationReportBody {
  const num = (k: string): number | undefined => {
    const raw = String(formData.get(k) ?? "").trim();
    if (raw === "") return undefined;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const str = (k: string): string | undefined => {
    const raw = String(formData.get(k) ?? "").trim();
    return raw === "" ? undefined : raw;
  };
  const oneOf = <T extends string>(k: string, allowed: readonly T[]): T | undefined => {
    const raw = String(formData.get(k) ?? "").trim() as T;
    return allowed.includes(raw) ? raw : undefined;
  };

  const body: AdministrationReportBody = {};

  const programName = str("programName");
  if (programName) body.programName = programName;
  const programCategory = oneOf("programCategory", SPORT_CATEGORIES);
  if (programCategory) body.programCategory = programCategory;
  const programStatus = oneOf("programStatus", ADMIN_PROGRAM_STATUS);
  if (programStatus) body.programStatus = programStatus;
  if (programStatus !== "no_teams") {
    const teamsCount = num("teamsCount");
    if (teamsCount !== undefined) body.teamsCount = teamsCount;
    const studentsCount = num("studentsCount");
    if (studentsCount !== undefined) body.studentsCount = studentsCount;
  }
  const dataCompleteness = oneOf("dataCompleteness", ADMIN_DATA_COMPLETENESS);
  if (dataCompleteness) body.dataCompleteness = dataCompleteness;
  const commitmentsDone = oneOf("commitmentsDone", YES_NO);
  if (commitmentsDone) body.commitmentsDone = commitmentsDone;
  const recordsExistence = oneOf("recordsExistence", EXISTENCE);
  if (recordsExistence) body.recordsExistence = recordsExistence;
  const financialPlan = oneOf("financialPlan", EXISTENCE);
  if (financialPlan) body.financialPlan = financialPlan;
  if (financialPlan === "present") {
    const execution = oneOf("financialPlanExecution", PLAN_EXECUTION);
    if (execution) body.financialPlanExecution = execution;
  }
  const positives = str("positives");
  if (positives) body.positives = positives;
  const negatives = str("negatives");
  if (negatives) body.negatives = negatives;
  const suggestions = str("suggestions");
  if (suggestions) body.suggestions = suggestions;
  const generalNotes = str("generalNotes");
  if (generalNotes) body.generalNotes = generalNotes;

  return body;
}

type PlanActionResult = { success: boolean; error?: string };

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
    return { success: false, error: "وضع الخطط من صلاحية الإدارة العامة والمنطقة والإدارة التعليمية فقط." };
  }

  const month = fd(formData, "month");
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return { success: false, error: "صيغة الشهر غير صحيحة (المتوقع YYYY-MM)." };
  }

  // المواعيد كحقول متوازية:
  // supervisorIds[] instituteIds[] administrationIds[] visitTypes[] dates[]
  const supervisors = formData.getAll("supervisorIds").map(String);
  const institutes = formData.getAll("instituteIds").map(String);
  const administrations = formData.getAll("administrationIds").map(String);
  const visitTypes = formData.getAll("visitTypes").map(String);
  const dates = formData.getAll("dates").map(String);
  const len = Math.max(
    supervisors.length,
    institutes.length,
    visitTypes.length,
    dates.length,
  );

  if (len === 0) {
    return { success: false, error: "أضف موعدًا واحدًا على الأقل للخطة." };
  }

  await dbConnect();

  // نطاق المدير
  const regionDocs = await Region.find(
    (session.role === "region" || session.role === "technical") && session.regionId
      ? { _id: session.regionId }
      : {},
  ).lean();
  const adminDocs = await Administration.find(
    session.role === "administration" && session.administrationId
      ? { _id: session.administrationId }
      : (session.role === "region" || session.role === "technical") &&
          session.regionId
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
    const instituteId = institutes[idx] ?? "";
    const administrationId = administrations[idx] ?? "";
    const visitType = visitTypes[idx];
    const dateRaw = dates[idx];

    if (!supervisorId || !visitType || !dateRaw) {
      return { success: false, error: `الموعد رقم ${idx + 1} غير مكتمل.` };
    }
    if (!instituteId && !administrationId) {
      return {
        success: false,
        error: `اختر هدف المتابعة (معهد أو إدارة تعليمية) في الموعد رقم ${idx + 1}.`,
      };
    }
    if (!VISIT_TYPES.includes(visitType as VisitType)) {
      return { success: false, error: `نوع الموعد رقم ${idx + 1} غير صالح.` };
    }

    // الموجّه: لازم يكون دوره من المستويات التي يشرف عليها هذا المدير
    const supervisedRoles = supervisedRolesFor(session);
    const supervisor = await User.findOne({
      _id: supervisorId,
      role: { $in: supervisedRoles },
    }).lean();
    if (!supervisor) {
      return {
        success: false,
        error: `الموجّه في الموعد رقم ${idx + 1} ليس ضمن المستويات التي تشرف عليها.`,
      };
    }
    // نطاق الموجّه يجب أن يقع داخل نطاق المدير
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

    if (instituteId) {
      // ── متابعة معهد ──
      if ((supervisor.role as string) === "technical") {
        return {
          success: false,
          error: `الموعد رقم ${idx + 1}: العضو الفني يتابع الإدارات التعليمية فقط.`,
        };
      }
      const inst = instById.get(instituteId);
      if (!inst) {
        return { success: false, error: `المعهد في الموعد رقم ${idx + 1} خارج نطاقك.` };
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
        kind: "institute",
        visitType: visitType as VisitType,
        date,
        notes: "",
        createdBy: new Types.ObjectId(session.id),
        createdByRole: session.role,
      });
    } else {
      // ── متابعة إدارة تعليمية (العضو الفني بالمنطقة) ──
      // «العضو الفني» يتابع الإدارات التعليمية فقط: يُتحقق من دوره صراحةً
      if ((supervisor.role as string) !== "technical") {
        return {
          success: false,
          error: `الموعد رقم ${idx + 1}: متابعة الإدارة التعليمية مخصّصة للعضو الفني بالمنطقة.`,
        };
      }
      const admin = adminById.get(administrationId);
      if (!admin) {
        return {
          success: false,
          error: `الإدارة التعليمية في الموعد رقم ${idx + 1} خارج نطاقك.`,
        };
      }
      if (!admin.region) {
        return {
          success: false,
          error: `تعذّر تحديد منطقة الإدارة التعليمية في الموعد رقم ${idx + 1}.`,
        };
      }
      docs.push({
        month,
        supervisor: new Types.ObjectId(supervisorId),
        region: admin.region,
        administration: admin._id,
        institute: null,
        kind: "administration",
        visitType: visitType as VisitType,
        date,
        notes: "",
        createdBy: new Types.ObjectId(session.id),
        createdByRole: session.role,
      });
    }
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

/**
 * التأكد أن هذا المدير يشرف على الموعد (للتعديل/الحذف).
 * المنطقة تدير مواعيد الإدارات属下ارتها، والعامة تدير الجميع.
 */
async function canManageVisit(
  session: SessionUser,
  visit: { supervisor: unknown; region: unknown; administration: unknown },
): Promise<boolean> {
  if (!isPlanManager(session.role)) return false;
  if (session.role === "general") return true;
  if (session.role === "region" || session.role === "technical") {
    return String(visit.region ?? "") === String(session.regionId ?? "");
  }
  if (session.role === "administration") {
    return String(visit.administration ?? "") === String(session.administrationId ?? "");
  }
  return false;
}

/** تعديل موعد في الخطة (الموجّه/المعهد/النوع/التاريخ). */
export async function updateVisitAction(
  prevState: PlanActionResult,
  formData: FormData,
): Promise<PlanActionResult> {
  const session = await getSession();
  if (!session || !isPlanManager(session.role)) {
    return { success: false, error: "غير مصرح لك بتعديل الخطط." };
  }

  const id = fd(formData, "id");
  if (!id) return { success: false, error: "الموعد غير محدد." };

  const visitType = fd(formData, "visitType");
  const dateRaw = fd(formData, "date");
  if (!VISIT_TYPES.includes(visitType as VisitType)) {
    return { success: false, error: "نوع الزيارة غير صالح." };
  }
  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) {
    return { success: false, error: "التاريخ غير صالح." };
  }

  await dbConnect();
  const visit = await MonthlyVisit.findById(id);
  if (!visit) return { success: false, error: "الموعد غير موجود." };
  if (!(await canManageVisit(session, visit))) {
    return { success: false, error: "هذا الموعد خارج نطاق صلاحياتك." };
  }

  // التعديل يجب أن يبقى داخل نفس شهر الخطة
  const [y, m] = visit.month.split("-").map(Number);
  if (date.getFullYear() !== y || date.getMonth() + 1 !== m) {
    return { success: false, error: "التاريخ يجب أن يبقى داخل نفس شهر الخطة." };
  }

  visit.visitType = visitType as VisitType;
  visit.date = date;
  const notes = fd(formData, "notes");
  if (notes) visit.notes = notes;
  await visit.save();

  revalidatePath("/dashboard/followup");
  return { success: true };
}

/** حذف موعد من الخطة (ويحذف تقريره إن وُجد). */
export async function deleteVisitAction(
  prevState: PlanActionResult,
  formData: FormData,
): Promise<PlanActionResult> {
  const session = await getSession();
  if (!session || !isPlanManager(session.role)) {
    return { success: false, error: "غير مصرح لك بحذف الخطط." };
  }

  const id = fd(formData, "id");
  if (!id) return { success: false, error: "الموعد غير محدد." };

  await dbConnect();
  const visit = await MonthlyVisit.findById(id);
  if (!visit) return { success: false, error: "الموعد غير موجود." };
  if (!(await canManageVisit(session, visit))) {
    return { success: false, error: "هذا الموعد خارج نطاق صلاحياتك." };
  }

  await DailyReport.deleteOne({ visit: id });
  await visit.deleteOne();

  revalidatePath("/dashboard/followup");
  return { success: true };
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

  const isSubmit = fd(formData, "intent") === "submitted";
  // متابعة الإدارات التعليمية (العضو الفني) لها تقرير مستقل عن تقرير المعهد
  const isAdminVisit = (visit.kind ?? "institute") === "administration";
  const body: DailyReportBody | AdministrationReportBody = isAdminVisit
    ? parseAdminReportBody(formData)
    : parseReportBody(formData);

  if (isSubmit) {
    // 1) القيد الزمني: الإرسال في يوم المتابعة فقط (بتوقيت مصر)
    const win = submitWindow(visit.date);
    if (!win.allowed) {
      return { success: false, error: win.message };
    }
    // 2) التحقق من اكتمال الحقول
    const missing = isAdminVisit
      ? missingAdminReportFields(body as AdministrationReportBody)
      : await (async () => {
          const inst = visit.institute
            ? await Institute.findById(visit.institute).select("type")
            : null;
          return missingReportFields(
            body as DailyReportBody,
            inst?.type ?? "مشترك",
          );
        })();
    if (missing.length) {
      return {
        success: false,
        error: `لا يمكن الإرسال قبل اكتمال الحقول: ${missing.join("، ")}`,
      };
    }
  }

  await DailyReport.findOneAndUpdate(
    { visit: visitId },
    {
      $set: {
        month: visit.month,
        supervisor: visit.supervisor,
        body,
        status: isSubmit ? "submitted" : "draft",
        ...(isSubmit ? { submittedAt: new Date() } : {}),
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  revalidatePath("/dashboard/followup");
  return { success: true };
}



