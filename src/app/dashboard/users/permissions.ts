import { dbConnect } from "@/lib/db";
import { Region } from "@/models/Region";
import { Administration } from "@/models/Administration";
import { Institute } from "@/models/Institute";
import type { Role } from "@/types";

export interface ManagerSession {
  id: string;
  role: Role;
  regionId: string | null;
  administrationId: string | null;
  instituteId: string | null;
}

export interface TargetUser {
  role: Role;
  region?: unknown;
  administration?: unknown;
  institute?: unknown;
}

export interface WorkplaceResult {
  region: string | null;
  administration: string | null;
  institute: string | null;
}

/**
 * حل مكان عمل المستخدم (المنطقة/الإدارة/المعهد) والتحقق أنه داخل نطاق المنشئ.
 * - general: أي مكان في الجمهورية.
 * - region: داخل منطقته فقط (المنطقة نفسها، إداراتها، معاهدها، أعضائها الفنيين).
 * - administration: داخل إدارته فقط (الإدارة نفسها أو أحد معاهدها).
 * - technical: غير مصرح (مكان عمله محسوم بالمنطقة所属ها المنطقتين).
 * ملاحظة: «عضو فني» مكان عمله المنطقة حصرًا (لا إدارة ولا معهد).
 * يعيد المعرّفات المحلولة أو رسالة خطأ.
 */
export async function resolveWorkplace(params: {
  session: ManagerSession;
  role: Exclude<Role, "general">;
  regionId: string;
  administrationId: string;
  instituteId: string;
}): Promise<WorkplaceResult | { error: string }> {
  const { session, role, regionId, administrationId, instituteId } = params;

  await dbConnect();

  // الإدارة العامة تختار أي مكان — دون قيود
  if (session.role === "general") {
    if (role === "region") {
      if (!regionId) return { error: "حدّد المنطقة التابع لها المستخدم." };
      const r = await Region.findById(regionId).select("_id");
      if (!r) return { error: "المنطقة المحددة غير موجودة." };
      return { region: String(r._id), administration: null, institute: null };
    }
    if (role === "technical") {
      if (!regionId) return { error: "حدّد المنطقة التي يعمل بها العضو الفني." };
      const r = await Region.findById(regionId).select("_id");
      if (!r) return { error: "المنطقة المحددة غير موجودة." };
      return { region: String(r._id), administration: null, institute: null };
    }
    if (role === "administration") {
      if (!administrationId) return { error: "حدّد الإدارة التابع لها المستخدم." };
      const a = await Administration.findById(administrationId).select("_id");
      if (!a) return { error: "الإدارة المحددة غير موجودة." };
      return { region: null, administration: String(a._id), institute: null };
    }
    if (role === "institute") {
      if (!instituteId) return { error: "حدّد المعهد التابع له المستخدم." };
      const i = await Institute.findById(instituteId).select("_id");
      if (!i) return { error: "المعهد المحدد غير موجود." };
      return { region: null, administration: null, institute: String(i._id) };
    }
    return { error: "الدور غير صالح." };
  }

  // حساب المنطقة: المنطقة نفسها، أو إداراتها/معاهدها
  if (session.role === "region") {
    if (!session.regionId) return { error: "حسابك غير مرتبط بمنطقة." };
    if (role === "region") {
      return { region: session.regionId, administration: null, institute: null };
    }
    if (role === "technical") {
      // العضو الفني مكان عمله منطقته حصرًا
      return { region: session.regionId, administration: null, institute: null };
    }
    if (role === "administration") {
      if (!administrationId) return { error: "حدّد الإدارة التابع لها المستخدم." };
      const a = await Administration.findById(administrationId).select("_id region");
      if (!a) return { error: "الإدارة المحددة غير موجودة." };
      if (String(a.region) !== String(session.regionId)) {
        return { error: "لا يمكنك إنشاء مستخدم لإدارة خارج منطقتك." };
      }
      return { region: session.regionId, administration: String(a._id), institute: null };
    }
    if (role === "institute") {
      if (!instituteId) return { error: "حدّد المعهد التابع له المستخدم." };
      const i = await Institute.findById(instituteId).populate<{
        administration: { _id: unknown; region: unknown };
      }>("administration");
      if (!i) return { error: "المعهد المحدد غير موجود." };
      if (String(i.administration?.region) !== String(session.regionId)) {
        return { error: "لا يمكنك إنشاء مستخدم لمعهد خارج منطقتك." };
      }
      return {
        region: session.regionId,
        administration: String(i.administration?._id),
        institute: String(i._id),
      };
    }
    return { error: "الدور غير صالح." };
  }

  // حساب الإدارة: إدارته أو أحد معاهدها
  if (session.role === "administration") {
    if (!session.administrationId) return { error: "حسابك غير مرتبط بإدارة." };
    if (role === "region" || role === "technical") {
      return { error: "لا تملك صلاحية إنشاء مستخدم للمنطقة أو عضو فني من مستوى الإدارة." };
    }
    if (role === "administration") {
      return {
        region: session.regionId,
        administration: session.administrationId,
        institute: null,
      };
    }
    if (role === "institute") {
      if (!instituteId) return { error: "حدّد المعهد التابع له المستخدم." };
      const i = await Institute.findById(instituteId).select("_id administration");
      if (!i) return { error: "المعهد المحدد غير موجود." };
      if (String(i.administration) !== String(session.administrationId)) {
        return { error: "لا يمكنك إنشاء مستخدم لمعهد خارج إدارتك." };
      }
      return {
        region: session.regionId,
        administration: session.administrationId,
        institute: String(i._id),
      };
    }
    return { error: "الدور غير صالح." };
  }

  return { error: "غير مصرح لك بإضافة مستخدمين." };
}



/**
 * التأكد أن المستخدم المستهدف داخل نطاق المُدير الحالي
 * (يُستخدم قبل التعديل/الحذف/تغيير كلمة المرور).
 */
export async function isInManagerScope(
  session: ManagerSession,
  target: TargetUser,
): Promise<boolean> {
  if (session.role === "general") return true;

  if (session.role === "region") {
    if (target.role === "general") return false;
    if (target.role === "region" || target.role === "technical") {
      return String(target.region ?? "") === String(session.regionId ?? "");
    }
    if (target.role === "administration") {
      if (!target.administration) return false;
      const a = await Administration.findById(target.administration as string).select("region");
      return !!a && String(a.region) === String(session.regionId);
    }
    if (target.role === "institute") {
      if (!target.institute) return false;
      const i = await Institute.findById(target.institute as string).populate<{
        administration: { _id: unknown; region: unknown };
      }>("administration");
      return !!i && String(i.administration?.region) === String(session.regionId);
    }
    return false;
  }

  if (session.role === "administration") {
    if (
      target.role === "general" ||
      target.role === "region" ||
      target.role === "technical"
    )
      return false;
    if (target.role === "administration") {
      return String(target.administration ?? "") === String(session.administrationId ?? "");
    }
    if (target.role === "institute") {
      if (!target.institute) return false;
      const i = await Institute.findById(target.institute as string).select("administration");
      return !!i && String(i.administration) === String(session.administrationId);
    }
    return false;
  }

  return false;
}

/**
 * الأدوار المسموح للمدير الحالي منحها عند الإنشاء/التعديل
 * (تمنع التصعيد: لا يمنح دورًا أعلى من مستواه).
 */
export function allowedTargetRoles(session: ManagerSession): Role[] {
  if (session.role === "general")
    return ["region", "technical", "administration", "institute"];
  if (session.role === "region")
    return ["region", "technical", "administration", "institute"];
  if (session.role === "administration") return ["administration", "institute"];
  return [];
}
