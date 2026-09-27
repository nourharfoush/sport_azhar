import type { SessionUser } from "@/types";

/**
 * يبني فلتر المونغو للفعاليات التي يرى/تخصّه المستخدم الحالي
 * حسب مستواه الهرمي.
 */
export function buildEventFilter(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case "general":
      return {};
    case "region":
      return {
        $or: [
          { scope: "general" },
          { scope: "region", region: user.regionId },
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
 */
export function buildNewsFilter(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case "general":
      return {};
    case "region":
      return {
        $or: [
          { scope: "general" },
          { scope: "region", region: user.regionId },
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
          ...(user.administrationId
            ? [{ scope: "administration", administration: user.administrationId }]
            : []),
        ],
      };
    default:
      return { _id: null };
  }
}


/** فلتر المعاهد التي يخضع لها المستخدم (للتسجيل والمتابعة). */
export function buildInstituteFilter(user: SessionUser): Record<string, unknown> {
  switch (user.role) {
    case "general":
      return {};
    case "region":
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
  if (user.role === "region") {
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
 * - المنطقة الأزهرية: عناصر منطقتها فقط (ولا تتحكم في العناصر المركزية).
 * - الإدارة التعليمية: عناصر إدارتها التعليمية فقط.
 * - المعهد: لا يملك أي تحكم (متابعة فقط).
 */
export function canManageScopedItem(
  user: SessionUser,
  item: ScopedItem,
): boolean {
  if (user.role === "general") return true;

  if (user.role === "region") {
    if (item.scope === "general") return false;
    return String(item.region ?? "") === String(user.regionId ?? "");
  }

  if (user.role === "administration") {
    return (
      item.scope === "administration" &&
      String(item.administration ?? "") === String(user.administrationId ?? "")
    );
  }

  return false;
}

