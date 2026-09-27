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

