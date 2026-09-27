// أدوار/مستويات المتابعة في النظام (بالترتيب الهرمي)
export const ROLES = [
  "general", // الإدارة العامة للرعاية الرياضية
  "region", // المنطقة الأزهرية
  "administration", // الإدارة التعليمية بالمناطق الأزهرية
  "institute", // المعهد الأزهري
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  general: "الإدارة العامة للرعاية الرياضية",
  region: "المنطقة الأزهرية",
  administration: "الإدارة التعليمية",
  institute: "المعهد الأزهري",
};

// حالة متابعة الفعالية/المسابقة لكل معهد
export const FOLLOWUP_STATUSES = [
  "not_started", // لم تبدأ
  "registered", // تم التسجيل
  "ongoing", // جارية
  "completed", // مكتملة
  "withdrawn", // اعتذار/انسحاب
] as const;

export type FollowupStatus = (typeof FOLLOWUP_STATUSES)[number];

export const FOLLOWUP_LABELS: Record<FollowupStatus, string> = {
  not_started: "لم تبدأ",
  registered: "تم التسجيل",
  ongoing: "جارية",
  completed: "مكتملة",
  withdrawn: "اعتذار",
};

// حالة الفعالية نفسها
export const EVENT_STATUSES = [
  "draft", // مسودة
  "published", // معلنة
  "active", // جارية
  "archived", // مؤرشفة
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

// نطاقات المسابقة ومستويات البطولة
export const EVENT_SCOPES = ["general", "region", "administration"] as const;

export type EventScope = (typeof EVENT_SCOPES)[number];

/**
 * تسميات مستويات المسابقات:
 * - general: نهائي الجمهورية (تضاف من الإدارة العامة فقط)
 * - region: نهائي المنطقة (تضاف من المنطقة الأزهرية)
 * - administration: تصفيات الإدارة التعليمية (تضاف من المنطقة أو الإدارة)
 */
export const EVENT_SCOPE_LABELS: Record<EventScope, string> = {
  general: "نهائي الجمهورية",
  region: "نهائي المنطقة",
  administration: "تصفيات الإدارة التعليمية",
};

export const EVENT_LABELS: Record<EventStatus, string> = {
  draft: "مسودة",
  published: "معلنة",
  active: "جارية",
  archived: "مؤرشفة",
};

// أنواع الرياضات/المسابقات المتاحة
export const SPORTS = [
  "كرة القدم",
  "كرة الطائرة",
  "كرة السلة",
  "كرة اليد",
  "تنس الطاولة",
  "ألعاب قوى",
  "اللياقة البدنية",
  "الشطرنج",
  "الكاراتيه",
  "التايكوندو",
  "السباحة",
] as const;


// ─────────────────────────────────────────────────────────────
// الخطة الشهرية للموجّه + التقارير اليومية
// ─────────────────────────────────────────────────────────────

/** نوع الموعد اليومي في الخطة الشهرية. */
export const VISIT_TYPES = [
  "competition", // مسابقة
  "supervisory", // زيارة توجيهيّة
] as const;

export type VisitType = (typeof VISIT_TYPES)[number];

export const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  competition: "مسابقة",
  supervisory: "زيارة توجيهيّة",
};

/** حالة التقرير اليومي المرتبط بموعد في الخطة. */
export const DAILY_REPORT_STATUSES = ["pending", "draft", "submitted"] as const;

export type DailyReportStatus = (typeof DAILY_REPORT_STATUSES)[number];

export const DAILY_REPORT_STATUS_LABELS: Record<DailyReportStatus, string> = {
  pending: "لم يُرسل بعد", // الموعد لم يُكتب تقريره
  draft: "مسودة", // بدأ الموجّه الكتابة ولم يرسل
  submitted: "مُرسل", // تقرير مكتمل مُرسل للإدارة
};

/** أسماء الشهور بالعربية (1-based) لعرض الخطة الشهرية. */
export const MONTH_LABELS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const;


// ─────────────────────────────────────────────────────────────
// معاهد الأزهر: المراحل التعليمية وأنواع المعاهد
// (ملف مشترك بين الخادم والمتصفح — لا يستورد Mongoose)
// ─────────────────────────────────────────────────────────────

export const STAGES = ["الابتدائي", "الإعدادي", "الثانوي"] as const;

export type Stage = (typeof STAGES)[number];

/** نوع المعهد من حيث الفئة (بنين/فتيات/مشترك). */
export const INSTITUTE_TYPES = ["بنين", "فتيات", "مشترك"] as const;

export type InstituteType = (typeof INSTITUTE_TYPES)[number];

/** أسماء أيام الأسبوع بالعربية لعرض «اليوم» في الموعد. */

/** نعم/لا في تقارير المتابعة. */
export const YES_NO = ["yes", "no"] as const;
export type YesNo = (typeof YES_NO)[number];
export const YES_NO_LABELS: Record<YesNo, string> = { yes: "نعم", no: "لا" };

/** حضور/غياب معلم التربية الرياضية. */
export const ATTENDANCE = ["present", "absent"] as const;
export type Attendance = (typeof ATTENDANCE)[number];
export const ATTENDANCE_LABELS: Record<Attendance, string> = {
  present: "حاضر",
  absent: "غائب",
};

/** حالة وجود سجل أو كشكول: موجود أم غير موجود. */
export const EXISTENCE = ["present", "absent"] as const;
export type Existence = (typeof EXISTENCE)[number];
export const EXISTENCE_LABELS: Record<Existence, string> = {
  present: "موجود",
  absent: "غير موجود",
};

/** اكتمال السجل/الكشكول. */
export const COMPLETENESS = ["complete", "incomplete"] as const;
export type Completeness = (typeof COMPLETENESS)[number];
export const COMPLETENESS_LABELS: Record<Completeness, string> = {
  complete: "مكتمل",
  incomplete: "غير مكتمل",
};

/** مدى تنفيذ الخطة المالية. */
export const PLAN_EXECUTION = ["full", "partial", "none"] as const;
export type PlanExecution = (typeof PLAN_EXECUTION)[number];
export const PLAN_EXECUTION_LABELS: Record<PlanExecution, string> = {
  full: "تم تنفيذ الخطة",
  partial: "تم تنفيذ جزء منها",
  none: "لم تنفذ",
};

/**
 * محتوى تقرير المتابعة اليومي.
 * يُخزَّن في DailyReport.body (Mixed) — يمكن إضافة حقول دون تعديل المخطط.
 */
export interface DailyReportBody {
  // 1) عدد الطلاب (يكتبه الموجّه)
  studentCount?: number;
  /** عدد البنات — يُطلب فقط إذا كان المعهد «مشترك». */
  boysCount?: number;
  girlsCount?: number;
  // 2) معلم التربية الرياضية
  peTeacherPresent?: Attendance;
  // 3) الانتداب لمعهد آخر
  seconded?: YesNo;
  secondedInstituteName?: string;
  // 4) عدد حصص التربية الرياضية
  peLessonsCount?: number;
  // 5) الالتزام بالزي الرياضي
  uniformCompliant?: YesNo;
  // 6) الكشكول
  recordBook?: Existence;
  recordBookCompleteness?: Completeness;
  // 7) السجلات
  records?: Existence;
  recordsCompleteness?: Completeness;
  missingRecordsNames?: string;
  // 8) الخطة المالية
  financialPlan?: Existence;
  financialPlanAbsentReason?: string;
  financialPlanExecution?: PlanExecution;
  // 9..12) ملاحظات
  positives?: string;
  negatives?: string;
  suggestions?: string;
  generalNotes?: string;
}

export const WEEKDAY_LABELS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

export type Sport = (typeof SPORTS)[number];

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  regionId: string | null;
  administrationId: string | null;
  instituteId: string | null;
}

/** الألقاب المعروفة التي تُحذف من بداية الاسم عند العرض */
const NAME_TITLES = new Set([
  "أ.د",
  "ا.د",
  "د.م",
  "أ.م",
  "د",
  "أ",
  "ا",
  "م",
  "ش",
  "ك",
  "كابتن",
]);

/** إزالة الفواصل الملحقة باللقب مثل: "أ.د/" أو "د.م." */
function normalizeTitleToken(token: string): string {
  return token
    .replace(/^[/–—.\-:،]+/, "")
    .replace(/[/–—.\-:،]+$/, "");
}

/**
 * إزالة الألقاب العلمية/الأدبية من أسماء المستخدمين عند العرض.
 * أمثلة: "أ.د/ مدير عام الرعاية الرياضية" -> "مدير عام الرعاية الرياضية"
 *       "د.م. عبد الله محمد"              -> "عبد الله محمد"
 *       "محمد بدون لقب"                    -> "محمد بدون لقب" (بدون تغيير)
 */
export function displayName(name?: string | null): string {
  if (!name) return "";
  const original = String(name).trim();
  const parts = original.split(/\s+/);

  // نتجاوز أقصى 3 رموز في البداية (أ.د/ د.م. ...)
  let index = 0;
  while (index < parts.length && index < 3) {
    const raw = parts[index];
    const token = normalizeTitleToken(raw);
    const remaining = parts.slice(index + 1);

    if (!token || !NAME_TITLES.has(token) || remaining.length === 0) break;

    // اللقب المفرد (حرف واحد) لا يُحذف إلا إذا تبعه فاصل صريح مثل / - .
    if (token.length === 1 && !/[/–—.]/.test(raw)) break;

    index += 1;
  }

  return parts.slice(index).join(" ").trim() || original;
}

// تصنيفات الأخبار والتعميمات
export const NEWS_CATEGORIES = [
  "news", // خبر رياضي
  "announcement", // إعلان وتنبيه
  "decision", // قرار وزاري / إداري
  "sports_report", // تقرير وبطولات
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  news: "خبر رياضي",
  announcement: "إعلان وتنبيه",
  decision: "قرار وزاري / إداري",
  sports_report: "تقرير نتائج وبطولات",
};


