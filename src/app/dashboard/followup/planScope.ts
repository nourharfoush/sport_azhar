import type { Role, SessionUser } from "@/types";

/**
 * التسلسل الهرمي: كل مستوى يدير المستوى الذي يليه مباشرة.
 *
 *   الإدارة العامة     → خطط موجّهي المناطق والأعضاء الفنيين والإدارات التعليمية
 *   المنطقة الأزهرية   → خطط الموجّهين (الأعضاء الفنيين والإدارات التعليمية)
 *   الإدارة التعليمية  → خطط مشرفي المعاهد属下ارتها
 *   المعهد             → لا يضع خططًا (يستلم الخطة ويكتب تقريره فقط)
 *
 * ملاحظة: مستخدمو دور "region" هم موجّهو المناطق، ودور "administration"
 * هم موجّهو الإدارات التعليمية، ودور "technical" (العضو الفني) موجّه
 * يشرف على الإدارات التعليمية فقط ولا يضع خطة لأحد.
 */
export const SUPERVISED_ROLES: Record<string, Role[]> = {
  general: ["region", "technical", "administration"],
  region: ["technical", "administration"],
  administration: ["institute"],
  technical: [],
  institute: [],
};

/** الأدوار التي تملك صلاحية بناء/تعديل/حذف الخطط. */
export function isPlanManager(role: string | undefined): boolean {
  return (
    role === "general" || role === "region" || role === "administration"
  );
}

/** الأدوار التي يشرف عليها هذا المدير (المستوى الذي يوضع له خطة). */
export function supervisedRolesFor(session: SessionUser): Role[] {
  return SUPERVISED_ROLES[session.role] ?? [];
}

/**
 * هل يتابع هذا الموعد «إدارة تعليمية» (وليس معهدًا)؟
 * متابعة الإدارات التعليمية حصرًا مهمة «العضو الفني» بالمنطقة.
 */
export function followsAdministrations(role: string | undefined): boolean {
  return role === "technical";
}
