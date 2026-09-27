/**
 * قواعد تقرير المتابعة اليومية — مشتركة بين العميل والسيرفر
 * حتى تتطابق رسالة «الحقول الناقصة» مع التحقق في السيرفر.
 * (ملف بلا "use server" وبلا استيراد Mongoose ليستخدمه العميل أيضًا.)
 */
import {
  ATTENDANCE_LABELS,
  COMPLETENESS_LABELS,
  EXISTENCE_LABELS,
  PLAN_EXECUTION_LABELS,
  YES_NO_LABELS,
  type DailyReportBody,
} from "@/types";

export interface ReportFieldRule {
  /** مفتاح الحقل في DailyReportBody */
  key: keyof DailyReportBody;
  /** العنوان كما يظهر في الجدول */
  label: string;
  /** شرط الإلزام (افتراضي: إلزامي) */
  requiredWhen?: (b: DailyReportBody, isMixed: boolean) => boolean;
  /** يحوّل القيمة المعتمدة إلى نص عربي للعرض */
  format: (b: DailyReportBody) => string;
}

/** توقيت مصر — الخادم قد يكون UTC (Vercel) فلا يصلح الاعتماد على توقيته. */
export const CAIRO_TZ = "Africa/Cairo";

/** مفتاح اليوم بصيغة YYYY-MM-DD بتوقيت مصر. */
export function dayKey(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CAIRO_TZ }).format(d);
}

/** اليوم الحالي بتوقيت مصر. */
export function todayKey(): string {
  return dayKey(new Date());
}

/** عدد الأيام بين اليوم الحالي ويوم الموعد (موجب = الموعد قادم). */
export function daysUntil(visitDate: string | Date): number {
  const target = dayKey(new Date(visitDate));
  const now = todayKey();
  // كلاهما بصيغة YYYY-MM-DD فيكفي طرح الطابعين زمنيين
  return (
    (Date.parse(`${target}T00:00:00Z`) - Date.parse(`${now}T00:00:00Z`)) / 86400000
  );
}

export interface SubmitWindow {
  allowed: boolean;
  message: string;
}

/** هل يُسمح بالإرسال الآن؟ (يوميوم فقط: لا قبله ولا بعده) */
export function submitWindow(visitDate: string | Date): SubmitWindow {
  const diff = daysUntil(visitDate);
  if (diff === 0) {
    return { allowed: true, message: "يمكن الإرسال — اليوم هو يوم المتابعة." };
  }
  if (diff > 0) {
    return {
      allowed: false,
      message:
        diff === 1
          ? "لا يمكن الإرسال قبل يوم المتابعة (غدًا)."
          : `لا يمكن الإرسال قبل يوم المتابعة (بعد ${diff} أيام).`,
    };
  }
  const late = Math.abs(diff);
  return {
    allowed: false,
    message:
      late === 1
        ? "انتهى موعد الإرسال — يوم المتابعة كان أمس."
        : `انتهى موعد الإرسال — مضى على يوم المتابعة ${late} أيام.`,
  };
}

const isEmpty = (v: unknown) =>
  v === undefined || v === null || (typeof v === "string" && v.trim() === "");

/** هل المعهد مشترك؟ (يلزم تفصيل البنات والبنين) */
export const isMixedInstitute = (type: string) => type === "مشترك";

/**
 * ترتيب حقول التقرير كما تظهر في الجدول.
 * الحقول الشرطية تُدرَج فقط عندما يتحقق شرطها.
 */
export const REPORT_FIELDS: ReportFieldRule[] = [
  {
    key: "studentCount",
    label: "عدد الطلاب",
    format: (b) => (isEmpty(b.studentCount) ? "—" : String(b.studentCount)),
  },
  {
    key: "boysCount",
    label: "عدد البنين",
    requiredWhen: (_b, isMixed) => isMixed,
    format: (b) => (isEmpty(b.boysCount) ? "—" : String(b.boysCount)),
  },
  {
    key: "girlsCount",
    label: "عدد الفتيات",
    requiredWhen: (_b, isMixed) => isMixed,
    format: (b) => (isEmpty(b.girlsCount) ? "—" : String(b.girlsCount)),
  },
  {
    key: "peTeacherPresent",
    label: "معلّم التربية الرياضية",
    format: (b) =>
      b.peTeacherPresent ? ATTENDANCE_LABELS[b.peTeacherPresent] : "—",
  },
  {
    key: "seconded",
    label: "منتدب لمعهد آخر",
    format: (b) => (b.seconded ? YES_NO_LABELS[b.seconded] : "—"),
  },
  {
    key: "secondedInstituteName",
    label: "اسم المعهد الآخر",
    requiredWhen: (b) => b.seconded === "yes",
    format: (b) => b.secondedInstituteName || "—",
  },
  {
    key: "peLessonsCount",
    label: "عدد حصص التربية الرياضية",
    format: (b) => (isEmpty(b.peLessonsCount) ? "—" : String(b.peLessonsCount)),
  },
  {
    key: "uniformCompliant",
    label: "الالتزام بالزي الرياضي",
    format: (b) => (b.uniformCompliant ? YES_NO_LABELS[b.uniformCompliant] : "—"),
  },
  {
    key: "recordBook",
    label: "الكشكول",
    format: (b) => (b.recordBook ? EXISTENCE_LABELS[b.recordBook] : "—"),
  },
  {
    key: "recordBookCompleteness",
    label: "حالة الكشكول",
    requiredWhen: (b) => b.recordBook === "present",
    format: (b) =>
      b.recordBookCompleteness
        ? COMPLETENESS_LABELS[b.recordBookCompleteness]
        : "—",
  },
  {
    key: "records",
    label: "السجلات",
    format: (b) => (b.records ? EXISTENCE_LABELS[b.records] : "—"),
  },
  {
    key: "recordsCompleteness",
    label: "حالة السجلات",
    requiredWhen: (b) => b.records === "present",
    format: (b) =>
      b.recordsCompleteness
        ? COMPLETENESS_LABELS[b.recordsCompleteness]
        : "—",
  },
  {
    key: "missingRecordsNames",
    label: "السجلات الناقصة",
    requiredWhen: (b) => b.recordsCompleteness === "incomplete",
    format: (b) => b.missingRecordsNames || "—",
  },
  {
    key: "financialPlan",
    label: "الخطة المالية",
    format: (b) => (b.financialPlan ? EXISTENCE_LABELS[b.financialPlan] : "—"),
  },
  {
    key: "financialPlanAbsentReason",
    label: "سبب عدم وجود الخطة",
    requiredWhen: (b) => b.financialPlan === "absent",
    format: (b) => b.financialPlanAbsentReason || "—",
  },
  {
    key: "financialPlanExecution",
    label: "مدى تنفيذ الخطة",
    requiredWhen: (b) => b.financialPlan === "present",
    format: (b) =>
      b.financialPlanExecution
        ? PLAN_EXECUTION_LABELS[b.financialPlanExecution]
        : "—",
  },
  { key: "positives", label: "الإيجابيات", format: (b) => b.positives || "—" },
  { key: "negatives", label: "السلبيات", format: (b) => b.negatives || "—" },
  { key: "suggestions", label: "المقترحات", format: (b) => b.suggestions || "—" },
  {
    key: "generalNotes",
    label: "ملاحظات عامة",
    format: (b) => b.generalNotes || "—",
  },
];

/** الحقول الظاهرة في الجدول (بعد تطبيق الشروط). */
export function visibleReportFields(
  b: DailyReportBody,
  instituteType: string,
): ReportFieldRule[] {
  const isMixed = isMixedInstitute(instituteType);
  return REPORT_FIELDS.filter((f) => f.requiredWhen?.(b, isMixed) !== false);
}

/** عناوين الحقول الإلزامية التي لم تُملأ بعد. */
export function missingReportFields(
  b: DailyReportBody,
  instituteType: string,
): string[] {
  const isMixed = isMixedInstitute(instituteType);
  return REPORT_FIELDS.filter((f) => f.requiredWhen?.(b, isMixed) !== false)
    .filter((f) => isEmpty(b[f.key]))
    .map((f) => f.label);
}

/** هل التقرير مكتمل وجاهز للإرسال؟ */
export function isReportComplete(
  b: DailyReportBody,
  instituteType: string,
): boolean {
  return missingReportFields(b, instituteType).length === 0;
}
