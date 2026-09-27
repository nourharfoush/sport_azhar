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
  "الشطرنج",
  "الكاراتيه",
  "التايكوندو",
  "السباحة",
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

