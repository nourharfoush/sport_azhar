"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { User } from "@/models/User";
import { ROLES, type Role } from "@/types";
import {
  resolveWorkplace,
  isInManagerScope,
  allowedTargetRoles,
} from "./permissions";

type ActionResult = { success: boolean; error?: string };

/** هل الدور الحالي مخوّل بإدارة المستخدمين؟ */
function canManageUsers(role: Role | undefined): boolean {
  return role === "general" || role === "region" || role === "administration";
}

/** إضافة مستخدم جديد (الاسم، البريد، كلمة المرور، الدور، مكان العمل). */
export async function createUserAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return { success: false, error: "غير مصرح لك بإضافة مستخدمين." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "").trim() as Role;
  const regionId = String(formData.get("regionId") ?? "").trim();
  const administrationId = String(formData.get("administrationId") ?? "").trim();
  const instituteId = String(formData.get("instituteId") ?? "").trim();

  if (!name || !email || !password || !role) {
    return { success: false, error: "الاسم والبريد وكلمة المرور والدور كلها مطلوبة." };
  }
  if (!ROLES.includes(role)) {
    return { success: false, error: "الدور (الوظيفة) غير صالح." };
  }
  if (role === "general") {
    return { success: false, error: "لا يمكن إنشاء حساب إدارة عامة من هذه الصفحة." };
  }
  if (!allowedTargetRoles(session).includes(role)) {
    return { success: false, error: "لا تملك صلاحية منح هذا المستوى." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "صيغة البريد الإلكتروني غير صحيحة." };
  }
  if (password.length < 6) {
    return { success: false, error: "كلمة المرور قصيرة (6 أحرف على الأقل)." };
  }

  await dbConnect();
  const existing = await User.findOne({ email });
  if (existing) {
    return { success: false, error: "هذا البريد مسجّل لمستخدم آخر بالفعل." };
  }

  // تحديد مكان العمل حسب الدور مع التحقق من النطاق
  const workplace = await resolveWorkplace({
    session,
    role: role as Exclude<Role, "general">,
    regionId,
    administrationId,
    instituteId,
  });
  if ("error" in workplace) {
    return { success: false, error: workplace.error };
  }

  try {
    await User.create({
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      region: workplace.region,
      administration: workplace.administration,
      institute: workplace.institute,
    });
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return { success: false, error: "هذا البريد مسجّل لمستخدم آخر بالفعل." };
    }
    return { success: false, error: "حدث خطأ أثناء حفظ المستخدم." };
  }
}

/** تعديل بيانات مستخدم موجود (الاسم/البريد/الدور/مكان العمل). */

/** تعديل بيانات مستخدم موجود (الاسم/البريد/الدور/مكان العمل). */
export async function updateUserAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return { success: false, error: "غير مصرح لك بتعديل المستخدمين." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "المستخدم غير محدد." };

  await dbConnect();
  const target = await User.findById(id);
  if (!target) return { success: false, error: "المستخدم غير موجود." };
  if (String(target._id) === String(session.id)) {
    return { success: false, error: "لا يمكنك تعديل حسابك من هنا." };
  }
  if (!(await isInManagerScope(session, target))) {
    return { success: false, error: "هذا المستخدم خارج نطاق صلاحياتك." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim() as Role;

  if (!name || !email || !role) {
    return { success: false, error: "الاسم والبريد والدور كلها مطلوبة." };
  }
  if (!ROLES.includes(role)) return { success: false, error: "الدور غير صالح." };
  if (role === "general") {
    return { success: false, error: "لا يمكن الترقية إلى الإدارة العامة من هنا." };
  }
  if (!allowedTargetRoles(session).includes(role)) {
    return { success: false, error: "لا تملك صلاحية منح هذا المستوى." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "صيغة البريد الإلكتروني غير صحيحة." };
  }

  const duplicate = await User.findOne({ email, _id: { $ne: target._id } });
  if (duplicate) {
    return { success: false, error: "هذا البريد مسجّل لمستخدم آخر بالفعل." };
  }

  const workplace = await resolveWorkplace({
    session,
    role: role as Exclude<Role, "general">,
    regionId: String(formData.get("regionId") ?? "").trim(),
    administrationId: String(formData.get("administrationId") ?? "").trim(),
    instituteId: String(formData.get("instituteId") ?? "").trim(),
  });
  if ("error" in workplace) {
    return { success: false, error: workplace.error };
  }

  try {
    target.name = name;
    target.email = email;
    target.role = role;
    target.set({
      region: workplace.region ?? null,
      administration: workplace.administration ?? null,
      institute: workplace.institute ?? null,
    });
    await target.save();
    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      return { success: false, error: "هذا البريد مسجّل لمستخدم آخر بالفعل." };
    }
    return { success: false, error: "حدث خطأ أثناء حفظ التعديلات." };
  }
}

/** حذف مستخدم من نطاق المدير الحالي. */
export async function deleteUserAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return { success: false, error: "غير مصرح لك بحذف المستخدمين." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "المستخدم غير محدد." };
  if (id === String(session.id)) {
    return { success: false, error: "لا يمكنك حذف حسابك." };
  }

  await dbConnect();
  const target = await User.findById(id);
  if (!target) return { success: false, error: "المستخدم غير موجود." };
  if (!(await isInManagerScope(session, target))) {
    return { success: false, error: "هذا المستخدم خارج نطاق صلاحياتك." };
  }

  await target.deleteOne();
  revalidatePath("/dashboard/users");
  return { success: true };
}

/** تعيين كلمة مرور جديدة لمستخدم داخل النطاق. */
export async function resetUserPasswordAction(
  prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
    return { success: false, error: "غير مصرح لك بتغيير كلمات المرور." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!id) return { success: false, error: "المستخدم غير محدد." };
  if (password.length < 6) {
    return { success: false, error: "كلمة المرور قصيرة (6 أحرف على الأقل)." };
  }

  await dbConnect();
  const target = await User.findById(id);
  if (!target) return { success: false, error: "المستخدم غير موجود." };
  if (!(await isInManagerScope(session, target))) {
    return { success: false, error: "هذا المستخدم خارج نطاق صلاحياتك." };
  }

  target.passwordHash = await hashPassword(password);
  await target.save();
  revalidatePath("/dashboard/users");
  return { success: true };
}
