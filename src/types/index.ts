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
  "اللياقة البدنية",
  "كرة القدم",
  "كرة الطائرة",
  "كرة السلة",
  "كرة اليد",
  "تنس الطاولة",
  "ألعاب قوى",
  "الشطرنج",
  "الكاراتيه",
  "التايكوندو",
  "السباحة",
] as const;

/** فئة المتسابقين */
export const GENDERS = ["بنين", "فتيات"] as const;

export type Gender = (typeof GENDERS)[number];

export const GENDER_LABELS: Record<Gender, string> = {
  بنين: "بنين",
  فتيات: "فتيات",
};

/** ألعاب خاصة بفتيات (تشمل المرشدات والزهرات) */
export const FEMALE_ONLY_SPORTS = ["المرشدات", "الزهرات"] as const;

/** قائمة الألعاب لكل فئة: بنين = القائمة العامة، وفتيات = العامة + ألعاب الفتيات */
export const SPORTS_BY_GENDER: Record<Gender, readonly string[]> = {
  بنين: SPORTS,
  فتيات: [...SPORTS, ...FEMALE_ONLY_SPORTS],
};

/** كل الرياضات المسموح بها في أي فئة (بنين + فتيات بدون تكرار) */
export const ALL_SPORTS: readonly string[] = [
  ...new Set<string>([...SPORTS, ...FEMALE_ONLY_SPORTS]),
];

/** التحقق من صحة اللعبة بالنسبة للفئة المختارة */
export function isSportValid(gender: string, sport: string): boolean {
  const list = SPORTS_BY_GENDER[gender as Gender] ?? SPORTS;
  return list.includes(sport);
}

// ─────────────────────────────────────────────────────────────
// المسارات: البرامج والمشروعات  |  المسابقات الرياضية
// ─────────────────────────────────────────────────────────────

export const SPORT_CATEGORIES = ["programs", "competitions"] as const;

export type SportCategory = (typeof SPORT_CATEGORIES)[number];

export const SPORT_CATEGORY_LABELS: Record<SportCategory, string> = {
  programs: "البرامج والمشروعات",
  competitions: "المسابقات الرياضية",
};

/**
 * المسار الأول: البرامج والمشروعات.
 * - "المشروع القومي للياقة البدنية" و"العروض الرياضية" متاحان للجميع.
 * - "الزهرات والمرشدات" للبنات فقط.
 */
export const PROGRAMS = [
  "المشروع القومي للياقة البدنية",
  "الزهرات والمرشدات",
  "العروض الرياضية",
] as const;

/** برامج متاحة لفئة الفتيات فقط. */
export const FEMALE_ONLY_PROGRAMS = ["الزهرات والمرشدات"] as const;

/** البرامج المشتركة بين الفئتين. */
export const COMMON_PROGRAMS = [
  "المشروع القومي للياقة البدنية",
  "العروض الرياضية",
] as const;

/** قائمة البرامج لكل فئة. */
export const PROGRAMS_BY_GENDER: Record<Gender, readonly string[]> = {
  بنين: COMMON_PROGRAMS,
  فتيات: PROGRAMS,
};

/**
 * المسار الثاني: المسابقات الرياضية.
 * المرشدات والزهرات مسابقات تُقام للبنات ضمن هذا المسار.
 */
export const COMPETITIONS_BY_GENDER: Record<Gender, readonly string[]> = {
  بنين: SPORTS,
  فتيات: [...SPORTS, ...FEMALE_ONLY_SPORTS],
};

/** عناصر كل مسار لكل فئة — تُستخدم في القوائم المُجمَّعة. */
export const ITEMS_BY_CATEGORY_AND_GENDER: Record<
  SportCategory,
  Record<Gender, readonly string[]>
> = {
  programs: PROGRAMS_BY_GENDER,
  competitions: COMPETITIONS_BY_GENDER,
};

/** كل العناصر المتاحة لكل فئة (برامج + مسابقات بدون تكرار). */
export const ACTIVITIES_BY_GENDER: Record<Gender, readonly string[]> = {
  بنين: [...new Set([...PROGRAMS_BY_GENDER.بنين, ...COMPETITIONS_BY_GENDER.بنين])],
  فتيات: [...new Set([...PROGRAMS_BY_GENDER.فتيات, ...COMPETITIONS_BY_GENDER.فتيات])],
};

/** كل العناصر في المسارين (بلا تكرار) — تُستخدم في فلاتر العرض. */
export const ALL_ACTIVITIES: readonly string[] = [
  ...new Set([...ACTIVITIES_BY_GENDER.بنين, ...ACTIVITIES_BY_GENDER.فتيات]),
];

/** استنتاج المسار الذي تنتمي إليه اللعبة أو البرنامج من اسمه. */
export function categoryOf(item: string): SportCategory {
  return (PROGRAMS as readonly string[]).includes(item)
    ? "programs"
    : "competitions";
}

/** التحقق من صحة العنصر بالنسبة للمسار والفئة المختارة. */
export function isActivityValid(
  gender: string,
  category: SportCategory,
  item: string,
): boolean {
  if (categoryOf(item) !== category) return false;
  const list = ITEMS_BY_CATEGORY_AND_GENDER[category][gender as Gender];
  return (list ?? []).includes(item);
}


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

// ─────────────────────────────────────────────────────────────
// ركن الموهوبين: الطلاب الموهوبون رياضيًا
// ─────────────────────────────────────────────────────────────

/** الصفوف الدراسية في مراحل الأزهر (ابتدائي / إعدادي / ثانوي). */
export const STUDENT_GRADES = [
  "الصف الأول الابتدائي",
  "الصف الثاني الابتدائي",
  "الصف الثالث الابتدائي",
  "الصف الرابع الابتدائي",
  "الصف الخامس الابتدائي",
  "الصف السادس الابتدائي",
  "الصف الأول الإعدادي",
  "الصف الثاني الإعدادي",
  "الصف الثالث الإعدادي",
  "الصف الأول الثانوي",
  "الصف الثاني الثانوي",
  "الصف الثالث الثانوي",
] as const;

export type StudentGrade = (typeof STUDENT_GRADES)[number];

/** طول الرقم القومي المصري (14 رقمًا). */
export const NATIONAL_ID_LENGTH = 14;

/** التحقق من صيغة الرقم القومي: 14 رقمًا بلا مسافات أو رموز. */
export function isNationalIdValid(value: string): boolean {
  return new RegExp(`^\\d{${NATIONAL_ID_LENGTH}}$`).test(value.trim());
}

// ─────────────────────────────────────────────────────────────
// التخطيط والمتابعة: أقسام القسم الرئيسي
// ─────────────────────────────────────────────────────────────

export const PLANNING_SECTIONS = [
  "conferences", // المؤتمرات والاجتماعات
  "time_plan", // الخطة الزمنية للبرامج والأنشطة الرياضية للعام الدراسي
  "recommendations", // التوصيات والمقترحات
  "monthly_followup", // المتابعات الشهرية
  "followup_reports", // التقارير للمتابعات
  "annual_reports", // التقارير السنوية
  "improvement_plans", // خطط التحسين
] as const;

export type PlanningSection = (typeof PLANNING_SECTIONS)[number];

export const PLANNING_SECTION_LABELS: Record<PlanningSection, string> = {
  conferences: "المؤتمرات والاجتماعات",
  time_plan: "الخطة الزمنية للبرامج والأنشطة الرياضية",
  recommendations: "التوصيات والمقترحات",
  monthly_followup: "المتابعات الشهرية",
  followup_reports: "التقارير للمتابعات",
  annual_reports: "التقارير السنوية",
  improvement_plans: "خطط التحسين",
};

/** أقسام تبويب داخل «التخطيط والمتابعة» (بترتيب العرض). */
export const PLANNING_TABS: PlanningSection[] = [...PLANNING_SECTIONS];

/** الأقسام التي تُدار بسجل موحّد (الباقي له صفحات قائمة خاصة به). */
export const GENERIC_PLANNING_SECTIONS: PlanningSection[] = [
  "conferences",
  "time_plan",
  "recommendations",
  "annual_reports",
  "improvement_plans",
];

/** التحقق من صحة القسم. */
export function isPlanningSection(
  value: string,
): value is PlanningSection {
  return (PLANNING_SECTIONS as readonly string[]).includes(value);
}

// تصنيفات الأخبار والتعميمات
export const NEWS_CATEGORIES = [
  "news", // خبر رياضي
  "announcement", // إعلان وتنبيه
  "decision", // قرار وزاري / إداري
  "sports_report", // تقرير وبطولات
  "work_manual", // دليل عمل
  "regulations", // ضوابط وتعليمات
] as const;

export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  news: "خبر رياضي",
  announcement: "إعلان وتنبيه",
  decision: "قرار وزاري / إداري",
  sports_report: "تقرير نتائج وبطولات",
  work_manual: "دليل عمل",
  regulations: "ضوابط وتعليمات",
};

/**
 * تصنيفات محجوزة للإدارة العامة وحدها في الإضافة والتعديل والحذف،
 * لكن يراها جميع المستخدمين (دليل العمل / الضوابط والتعليمات).
 */
export const GENERAL_ONLY_NEWS_CATEGORIES = [
  "work_manual",
  "regulations",
] as const;

export type GeneralOnlyNewsCategory =
  (typeof GENERAL_ONLY_NEWS_CATEGORIES)[number];

/** هل التصنيف من اختصاص الإدارة العامة وحدها؟ */
export function isGeneralOnlyCategory(
  category: string,
): category is GeneralOnlyNewsCategory {
  return (GENERAL_ONLY_NEWS_CATEGORIES as readonly string[]).includes(category);
}

/** التصنيفات التي يستطيع المستخدم إضافتها حسب دوره. */
export function availableNewsCategories(userRole: string): readonly string[] {
  return userRole === "general"
    ? NEWS_CATEGORIES
    : NEWS_CATEGORIES.filter((c) => !isGeneralOnlyCategory(c));
}


