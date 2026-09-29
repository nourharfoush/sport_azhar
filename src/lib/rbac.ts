import {
  GENERAL_ONLY_NEWS_CATEGORIES,
  ROLES,
  isGeneralOnlyCategory,
  type SessionUser,
} from "@/types";

/**
 * يبني فلتر المونغو للفعاليات التي يرى/تخصّه المستخدم الحالي
 * حسب مستواه الهرمي.
 */
export function buildEventFilter(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case "general":
      return {};
    // العضو الفني بالمنطقة يتابع المسابقات والبرامج على مستوى منطقته
    case "region":
    case "technical":
      return {
        $or: [
          { scope: "general" },
          { scope: "region", region: user.regionId },
          // مسابقاته الداخلية: تصفيات الإدارات التعليمية التابعة لمنطقته
          { scope: "administration", region: user.regionId },
        ],
      };
    case "administration":
    case "institute":
      return {
        $or: [
          { scope: "general" },
          ...(user.regionId
            ? [{ scope: "region", region: user.regionId }]
            : []),
          // تصفيات "جميع الإدارات" التي أطلقتها المنطقة التابع لها (administration فارغ)
          ...(user.regionId
            ? [{ scope: "administration", region: user.regionId, administration: null }]
            : []),
          ...(user.administrationId
            ? [{ scope: "administration", administration: user.administrationId }]
            : []),
        ],
      };
    default:
      return { _id: null };
  }
}
/**
 * يبني فلتر المونغو للأخبار التي يراها المستخدم الحالي
 * حسب نطاقه الجغرافي والإداري.
 *
 * تصنيفات الإدارة العامة (دليل العمل / الضوابط والتعليمات) يراها
 * جميع المستخدمين على اختلاف المستويات، لذلك تُضمن في كل الفلاتر.
 */
export function buildNewsFilter(user: SessionUser): Record<string, unknown> {
  const generalOnly = { category: { $in: [...GENERAL_ONLY_NEWS_CATEGORIES] } };

  switch (user.role) {
    case "general":
      return {};
    case "region":
    case "technical":
      return {
        $or: [
          generalOnly,
          { scope: "general" },
          { scope: "region", region: user.regionId },
        ],
      };
    case "administration":
    case "institute":
      return {
        $or: [
          generalOnly,
          { scope: "general" },
          ...(user.regionId
            ? [{ scope: "region", region: user.regionId }]
            : []),
          ...(user.administrationId
            ? [{ scope: "administration", administration: user.administrationId }]
            : []),
        ],
      };
    default:
      return { _id: null };
  }
}


/** هل يملك المستخدم إضافة/تعديل/حذف الطلاب الموهوبين؟ (كل المستويات — المعهد يسجّل طلابه) */
export function canManageGifted(user: SessionUser): boolean {
  return ROLES.includes(user.role);
}

/**
 * هل يملك المستخدم إدارة المرجع الرياضي (مقاييس الملاعب / مواصفات الأجهزة)؟
 * الإدارة العامة وحدها تعدّلها؛ والباقي مستويات للمشاهدة فقط.
 */
export function canManageSportsRefs(user: SessionUser): boolean {
  return user.role === "general";
}

/**
 * فلتر سجلات «التخطيط والمتابعة» حسب نطاق المستخدم.
 * - الإدارة العامة: كل السجلات.
 * - المنطقة: سجلات منطقتها.
 * - الإدارة التعليمية: سجلات إدارتها.
 * - المعهد: سجلات معهده.
 * السجلات المركزية (بلا نطاق محدَّد) يراها الجميع كمرجع مشترك.
 */
export function buildPlanningFilter(
  user: SessionUser,
): Record<string, unknown> {
  switch (user.role) {
    case "general":
      return {};
    // العضو الفني يرى سجلات تخطيط منطقته (ويعدّل ما يخصّها)
    case "region":
    case "technical":
      return { $or: [{ region: user.regionId ?? null }, { region: null }] };
    case "administration":
      return {
        $or: [
          { administration: user.administrationId ?? null },
          { administration: null },
        ],
      };
    case "institute":
      return {
        $or: [{ institute: user.instituteId ?? null }, { institute: null }],
      };
    default:
      return { _id: null };
  }
}

/** سجل تخطيط بصيغة موحّدة للتحقق من الصلاحيات. */
export interface PlanningItem {
  region?: unknown;
  administration?: unknown;
  institute?: unknown;
}

/** هل يملك المستخدم تعديل/حذف هذا السجل؟ */
export function canManagePlanningItem(
  user: SessionUser,
  item: PlanningItem,
): boolean {
  if (user.role === "general") return true;
  // السجلات المركزية (بلا نطاق محدَّد) يعدّلها الإدارة العامة فقط
  const isCentral = !item.region && !item.administration && !item.institute;
  if (isCentral) return false;

  if (user.role === "region" || user.role === "technical") {
    return String(item.region ?? "") === String(user.regionId ?? "");
  }
  if (user.role === "administration") {
    return (
      String(item.administration ?? "") === String(user.administrationId ?? "")
    );
  }
  if (user.role === "institute") {
    return String(item.institute ?? "") === String(user.instituteId ?? "");
  }
  return false;
}

/**
 * فلتر المونغو للطلاب الموهوبين المرئيين للمستخدم حسب نطاقه الهرمي.
 * النطاق مُخزَّن مع كل سجل (منطقة/إدارة/معهد) فيُقارَن مباشرةً بمعرّفات الجلسة.
 */
export function buildGiftedFilter(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case "general":
      return {};
    case "region":
    case "technical":
      return { region: user.regionId ?? null };
    case "administration":
      return { administration: user.administrationId ?? null };
    case "institute":
      return { institute: user.instituteId ?? null };
    default:
      return { _id: null };
  }
}

/** سجل موهوب بصيغة موحّدة للتحقق من الصلاحيات. */
export interface GiftedItem {
  region?: unknown;
  administration?: unknown;
  institute?: unknown;
}

/**
 * هل يملك المستخدم تعديل/حذف هذا الطالب الموهوب؟
 * الإدارة العامة: كل الطلاب. المنطقة: طلاب منطقتها فقط.
 * الإدارة التعليمية: طلاب إدارتها. المعهد: طلاب معهده فقط.
 */
export function canManageGiftedItem(
  user: SessionUser,
  item: GiftedItem,
): boolean {
  if (user.role === "general") return true;

  if (user.role === "region" || user.role === "technical") {
    if (!user.regionId) return false;
    return String(item.region ?? "") === String(user.regionId);
  }

  if (user.role === "administration") {
    if (!user.administrationId) return false;
    return (
      String(item.administration ?? "") === String(user.administrationId)
    );
  }

  if (user.role === "institute") {
    if (!user.instituteId) return false;
    return String(item.institute ?? "") === String(user.instituteId);
  }

  return false;
}


/** فلتر المعاهد التي يخضع لها المستخدم (للتسجيل والمتابعة). */
export function buildInstituteFilter(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case "general":
      return {};
    case "region":
      return {};
    case "technical":
      return {};
    case "administration":
      return { administration: user.administrationId };
    case "institute":
      return { _id: user.instituteId };
    default:
      return { _id: null };
  }
}

export function canManageChildren(user: SessionUser): boolean {
  return (
    user.role === "general" ||
    user.role === "region" ||
    user.role === "administration"
  );
}

export function canCreateEvents(user: SessionUser): boolean {
  return user.role !== "institute";
}

/** هل يملك المستخدم إضافة/تعديل/حذف الأخبار والتعميمات؟ */
export function canManageNews(user: SessionUser): boolean {
  return user.role !== "institute";
}

/**
 * هل يملك المستخدم إدارة هذا الخبر/التعميم؟
 * - الإدارة العامة: كل العناصر.
 * - المستويات الأخرى: عناصر نطاقها، ما عدا تصنيفات الإدارة العامة
 *   (دليل العمل / الضوابط والتعليمات) فهي للإدارة العامة وحدها.
 */
export function canManageNewsItem(
  user: SessionUser,
  item: { category?: string; scope: ScopedItem["scope"] } & ScopedItem,
): boolean {
  if (isGeneralOnlyCategory(item.category ?? "")) {
    return user.role === "general";
  }
  return canManageScopedItem(user, item);
}

/** أنواع العناصر المقيّدة بنطاق إداري (فعاليات، أخبار، ...). */
export type ScopeKind = "general" | "region" | "administration";

/** عنصر مقيّد بنطاق إداري (فعالية أو خبر) بصيغة موحّدة. */
export interface ScopedItem {
  scope: ScopeKind;
  region?: unknown;
  administration?: unknown;
}

/**
 * النطاق الذي يمتلك فيه المستخدم الإضافة حسب مستواه الهرمي،
 * وتُنسخ منه الفعاليات والأخبار عند الإنشاء.
 */
export function scopedOwnershipForRole(user: SessionUser): {
  scope: ScopeKind;
  region: string | null;
  administration: string | null;
} {
  if (user.role === "general") {
    return { scope: "general", region: null, administration: null };
  }
  if (user.role === "region" || user.role === "technical") {
    return { scope: "region", region: user.regionId, administration: null };
  }
  return {
    scope: "administration",
    region: user.regionId,
    administration: user.administrationId,
  };
}

/**
 * هل يملك المستخدم تعديل/حذف هذا العنصر في نطاق صلاحياته؟
 * - الإدارة العامة: كل العناصر.
 * - المنطقة الأزهرية والعضو الفني بها: عناصر منطقتها فقط (ولا تتحكم في العناصر المركزية).
 * - الإدارة التعليمية: عناصر إدارتها التعليمية فقط.
 * - المعهد: لا يملك أي تحكم (متابعة فقط).
 */
export function canManageScopedItem(
  user: SessionUser,
  item: ScopedItem,
): boolean {
  if (user.role === "general") return true;

  if (user.role === "region" || user.role === "technical") {
    if (item.scope === "general") return false;
    return String(item.region ?? "") === String(user.regionId ?? "");
  }

  if (user.role === "administration") {
    // تصفية "جميع الإدارات" (administration فارغ) تديرها المنطقة فقط
    if (!user.administrationId) return false;
    return (
      item.scope === "administration" &&
      String(item.administration ?? "") === String(user.administrationId ?? "")
    );
  }

  return false;
}

