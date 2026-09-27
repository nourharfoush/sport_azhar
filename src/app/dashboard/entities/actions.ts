"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Region } from "@/models/Region";
import { Administration } from "@/models/Administration";
import { Institute, STAGES, INSTITUTE_TYPES, type InstituteType } from "@/models/Institute";
import { FollowUp } from "@/models/FollowUp";
import { User } from "@/models/User";
import { Event } from "@/models/Event";

/* ========================================================
   المناطق الأزهرية (Regions) - الإدارة العامة
   ======================================================== */

/** إضافة منطقة أزهرية جديدة */
export async function createRegionAction(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "general") {
    return { success: false, error: "غير مصرح لك بإضافة مناطق أزهرية." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!name || !code) {
    return { success: false, error: "يرجى كتابة اسم المنطقة والكود." };
  }

  await dbConnect();
  try {
    const existing = await Region.findOne({ code });
    if (existing) {
      return { success: false, error: "كود المنطقة مستخدم بالفعل." };
    }
    await Region.create({ name, code });
    revalidatePath("/dashboard/entities");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "حدث خطأ أثناء إضافة المنطقة." };
  }
}

/** تعديل منطقة أزهرية */
export async function updateRegionAction(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "general") {
    return { success: false, error: "غير مصرح لك بتعديل المناطق." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();

  if (!id || !name || !code) {
    return { success: false, error: "جميع الحقول مطلوبة." };
  }

  await dbConnect();
  try {
    const existing = await Region.findOne({ code, _id: { $ne: id } });
    if (existing) {
      return { success: false, error: "الكود مستخدم في منطقة أخرى." };
    }
    await Region.findByIdAndUpdate(id, { name, code });
    revalidatePath("/dashboard/entities");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل تعديل المنطقة." };
  }
}

/** حذف منطقة أزهرية وحذف ما يتبعها */
export async function deleteRegionAction(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role !== "general") {
    return { success: false, error: "غير مصرح لك بحذف المناطق." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "معرّف المنطقة غير محدد." };

  await dbConnect();
  try {
    const admins = await Administration.find({ region: id }).select("_id");
    const adminIds = admins.map((a) => a._id);

    await Institute.deleteMany({ administration: { $in: adminIds } });
    await FollowUp.deleteMany({ region: id });
    await Administration.deleteMany({ region: id });
    await Event.deleteMany({ region: id });
    await User.deleteMany({ region: id, role: { $ne: "general" } });
    await Region.findByIdAndDelete(id);

    revalidatePath("/dashboard/entities");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل حذف المنطقة." };
  }
}


/* ========================================================
   الإدارات التعليمية (Administrations) - الإدارة العامة والمنطقة
   ======================================================== */

/** إضافة إدارة تعليمية */
export async function createAdministrationAction(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || (session.role !== "general" && session.role !== "region")) {
    return { success: false, error: "غير مصرح لك بإضافة إدارات تعليمية." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const regionId =
    session.role === "general"
      ? String(formData.get("regionId") ?? "").trim()
      : session.regionId;

  if (!name || !code || !regionId) {
    return { success: false, error: "يرجى تحديد المنطقة واسم الإدارة والكود." };
  }

  await dbConnect();
  try {
    const existing = await Administration.findOne({ region: regionId, code });
    if (existing) {
      return { success: false, error: "الكود مستخدم في إدارة أخرى داخل هذه المنطقة." };
    }
    await Administration.create({ name, code, region: regionId });
    revalidatePath("/dashboard/entities");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل إضافة الإدارة." };
  }
}

/** تعديل إدارة تعليمية */
export async function updateAdministrationAction(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || (session.role !== "general" && session.role !== "region")) {
    return { success: false, error: "غير مصرح لك بتعديل الإدارات." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const regionId =
    session.role === "general"
      ? String(formData.get("regionId") ?? "").trim()
      : undefined;

  if (!id || !name || !code) {
    return { success: false, error: "جميع الحقول مطلوبة." };
  }

  await dbConnect();
  try {
    const admin = await Administration.findById(id);
    if (!admin) return { success: false, error: "الإدارة غير موجودة." };

    if (session.role === "region" && String(admin.region) !== session.regionId) {
      return { success: false, error: "لا تملك صلاحية تعديل إدارة خارج منطقتك." };
    }

    const targetRegion = regionId || admin.region;

    const duplicate = await Administration.findOne({
      region: targetRegion,
      code,
      _id: { $ne: id },
    });
    if (duplicate) {
      return { success: false, error: "الكود مستخدم في إدارة أخرى بنفس المنطقة." };
    }

    admin.name = name;
    admin.code = code;
    if (regionId) admin.region = targetRegion as any;
    await admin.save();

    revalidatePath("/dashboard/entities");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل تعديل الإدارة." };
  }
}

/** حذف إدارة تعليمية وما يتبعها */
export async function deleteAdministrationAction(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || (session.role !== "general" && session.role !== "region")) {
    return { success: false, error: "غير مصرح لك بحذف الإدارات." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "معرّف الإدارة مطلوب." };

  await dbConnect();
  try {
    const admin = await Administration.findById(id);
    if (!admin) return { success: false, error: "الإدارة غير موجودة." };

    if (session.role === "region" && String(admin.region) !== session.regionId) {
      return { success: false, error: "لا يمكنك حذف إدارة خارج منطقتك." };
    }

    await Institute.deleteMany({ administration: id });
    await FollowUp.deleteMany({ administration: id });
    await User.deleteMany({ administration: id });
    await Administration.findByIdAndDelete(id);

    revalidatePath("/dashboard/entities");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل حذف الإدارة." };
  }
}


/* ========================================================
   المعاهد الأزهرية (Institutes) - الإدارة العامة، المنطقة، والإدارة
   ======================================================== */

/** إضافة معهد أزهري */
export async function createInstituteAction(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "general" &&
      session.role !== "region" &&
      session.role !== "administration")
  ) {
    return { success: false, error: "غير مصرح لك بإضافة معاهد." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const stage = String(formData.get("stage") ?? "الإعدادي");
  const type = String(formData.get("type") ?? "مشترك").trim() as InstituteType;
  const administrationId =
    session.role === "administration"
      ? session.administrationId
      : String(formData.get("administrationId") ?? "").trim();

  if (!name || !code || !administrationId) {
    return { success: false, error: "يرجى تحديد الإدارة التعليمية واسم المعهد والكود." };
  }
  if (!STAGES.includes(stage as (typeof STAGES)[number])) {
    return { success: false, error: "المرحلة التعليمية غير صحيحة." };
  }
  if (!INSTITUTE_TYPES.includes(type as (typeof INSTITUTE_TYPES)[number])) {
    return { success: false, error: "نوع المعهد غير صحيح." };
  }

  await dbConnect();
  try {
    const admin = await Administration.findById(administrationId);
    if (!admin) return { success: false, error: "الإدارة التعليمية المحددة غير موجودة." };

    if (session.role === "region" && String(admin.region) !== session.regionId) {
      return { success: false, error: "لا يمكنك إضافة معهد لإدارة خارج منطقتك." };
    }

    const existing = await Institute.findOne({ administration: administrationId, code });
    if (existing) {
      return { success: false, error: "كود المعهد مستخدم مسبقاً في هذه الإدارة." };
    }

    await Institute.create({
      name,
      code,
      stage,
      type,
      administration: administrationId,
    });

    revalidatePath("/dashboard/entities");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل إضافة المعهد." };
  }
}

/** تعديل معهد أزهري */
export async function updateInstituteAction(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "general" &&
      session.role !== "region" &&
      session.role !== "administration")
  ) {
    return { success: false, error: "غير مصرح لك بتعديل المعاهد." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const stage = String(formData.get("stage") ?? "الإعدادي");
  const type = String(formData.get("type") ?? "مشترك").trim() as InstituteType;
  const administrationId = String(formData.get("administrationId") ?? "").trim();

  if (!id || !name || !code) {
    return { success: false, error: "جميع الحقول مطلوبة." };
  }
  if (!STAGES.includes(stage as (typeof STAGES)[number])) {
    return { success: false, error: "المرحلة التعليمية غير صحيحة." };
  }
  if (!INSTITUTE_TYPES.includes(type as (typeof INSTITUTE_TYPES)[number])) {
    return { success: false, error: "نوع المعهد غير صحيح." };
  }

  await dbConnect();
  try {
    const inst = await Institute.findById(id).populate<{ administration: { _id: any; region: any } }>("administration");
    if (!inst) return { success: false, error: "المعهد غير موجود." };

    const currentAdmin = inst.administration;
    if (session.role === "administration" && String(currentAdmin._id) !== session.administrationId) {
      return { success: false, error: "لا تملك صلاحية تعديل معهد خارج إدارتك." };
    }
    if (session.role === "region" && String(currentAdmin.region) !== session.regionId) {
      return { success: false, error: "لا تملك صلاحية تعديل معهد خارج منطقتك." };
    }

    let targetAdminId = currentAdmin._id;
    if (administrationId && administrationId !== String(currentAdmin._id)) {
      if (session.role === "general" || session.role === "region") {
        const newAdmin = await Administration.findById(administrationId);
        if (!newAdmin) return { success: false, error: "الإدارة الجديدة غير صالحة." };
        if (session.role === "region" && String(newAdmin.region) !== session.regionId) {
          return { success: false, error: "لا يمكنك نقل معهد لإدارة خارج منطقتك." };
        }
        targetAdminId = newAdmin._id;
      }
    }

    const duplicate = await Institute.findOne({
      administration: targetAdminId,
      code,
      _id: { $ne: id },
    });
    if (duplicate) {
      return { success: false, error: "الكود مستخدم في معهد آخر بنفس الإدارة." };
    }

    inst.name = name;
    inst.code = code;
    inst.stage = stage;
    inst.type = type;
    inst.administration = targetAdminId;
    await inst.save();

    revalidatePath("/dashboard/entities");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل تعديل بيانات المعهد." };
  }
}

/** حذف معهد أزهري */
export async function deleteInstituteAction(
  prevState: any,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "general" &&
      session.role !== "region" &&
      session.role !== "administration")
  ) {
    return { success: false, error: "غير مصرح لك بحذف المعاهد." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "معرّف المعهد مطلوب." };

  await dbConnect();
  try {
    const inst = await Institute.findById(id).populate<{ administration: { _id: any; region: any } }>("administration");
    if (!inst) return { success: false, error: "المعهد غير موجود." };

    const admin = inst.administration;
    if (session.role === "administration" && String(admin._id) !== session.administrationId) {
      return { success: false, error: "لا تملك صلاحية حذف معهد خارج إدارتك." };
    }
    if (session.role === "region" && String(admin.region) !== session.regionId) {
      return { success: false, error: "لا تملك صلاحية حذف معهد خارج منطقتك." };
    }

    await FollowUp.deleteMany({ institute: id });
    await User.deleteMany({ institute: id });
    await Institute.findByIdAndDelete(id);

    revalidatePath("/dashboard/entities");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "فشل حذف المعهد." };
  }
}



