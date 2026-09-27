import type { Role, SessionUser } from "@/types";

/**
 * التسلسل الهرمي: كل مستوى يدير المستوى الذي يليه مباشرة.
 *
 *   الإدارة العامة     → خطط موجّهي المناطق والإدارات التعليمية
 *   المنطقة الأزهرية   → خطط موجّهي الإدارات التعليمية属下ارتها
 *   الإدارة التعليمية  → خطط مشرفي المعاهد属下ارتها
 *   المعهد             → لا يضع خططًا (يستلم الخطة ويكتب تقريره فقط)
 *
 * ملاحظة: مستخدمو دور "region" هم موجّهو المناطق، ودور "administration"
 * هم موجّهو الإدارات التعليمية — لذلك تُدار الإدارات من المنطق��،
 * والإدارة العامة تدير المستويين معًا.
 */
export const SUPERVISED_ROLES: Record<string, Role[]> = {
  general: ["region", "administration"],
  region: ["administration"],
  administration: ["institute"],
  institute: [],
};

/** الأدوار التي تملك صلاحية بناء/تعديل/حذف الخطط. */
export function isPlanManager(role: string | undefined): boolean {
  return role === "general" || role === "region" || role === "administration";
}

/** الأدوار التي يشرف عليها هذا المدير (المستوى الذي يوضع له خطة). */
export function supervisedRolesFor(session: SessionUser): Role[] {
  return SUPERVISED_ROLES[session.role] ?? [];
}
