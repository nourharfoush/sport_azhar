"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Event } from "@/models/Event";
import { FollowUp } from "@/models/FollowUp";
import { ensureFollowUpsForEvent } from "@/lib/data";
import { canManageScopedItem, scopedOwnershipForRole } from "@/lib/rbac";
import { SPORTS, FOLLOWUP_STATUSES, EVENT_STATUSES, type EventStatus, type FollowupStatus } from "@/types";

/** إنشاء فعالية/مسابقة حسب مستوى المستخدم. */
export async function createEventAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role === "institute") {
    return { success: false, error: "غير مصرح لك بإنشاء فعاليات." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const sport = String(formData.get("sport") ?? "");
  const season = String(formData.get("season") ?? "2025/2026").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!title || !sport) {
    return { success: false, error: "يرجى كتابة اسم المسابقة واختيار اللعبة." };
  }
  if (!SPORTS.includes(sport as (typeof SPORTS)[number])) {
    return { success: false, error: "اللعبة الرياضية غير صالحة." };
  }

  // النطاق يُستنتج من مستوى المستخدم (منطق موحّد مع الأخبار)
  const { scope, region, administration } = scopedOwnershipForRole(session);

  await dbConnect();
  try {
    await Event.create({
      title,
      sport,
      season,
      description,
      scope,
      region,
      administration,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: "draft",
      createdBy: session.id,
    });

    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حفظ الفعالية." };
  }
}

/** نشر فعالية (يُفعّل المتابعات للمعاهد المستهدفة). */
export async function publishEventAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role === "institute") return;

  const id = String(formData.get("id") ?? "");
  await dbConnect();
  const event = await Event.findById(id);
  if (!event) return;

  // الصلاحية: لا يُنشر إلا ما يقع داخل نطاق المستخدم
  if (!canManageScopedItem(session, event)) return;

  event.status = "published";
  await event.save();
  await ensureFollowUpsForEvent(id);

  revalidatePath("/dashboard/events");
  revalidatePath("/dashboard");
}

/** تحديث فعالية/مسابقة مع التحقق من الصلاحيات. */
export async function updateEventAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role === "institute") {
    return { success: false, error: "غير مصرح لك بتعديل الفعاليات." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const sport = String(formData.get("sport") ?? "");
  const season = String(formData.get("season") ?? "2025/2026").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!id || !title || !sport) {
    return { success: false, error: "يرجى استيفاء الحقول الإلزامية." };
  }
  if (!SPORTS.includes(sport as (typeof SPORTS)[number])) {
    return { success: false, error: "الرياضة المختارة غير صالحة." };
  }

  await dbConnect();
  try {
    const event = await Event.findById(id);
    if (!event) return { success: false, error: "الفعالية غير موجودة." };

    // التحقق من الصلاحيات (منطق موحّد في lib/rbac)
    if (!canManageScopedItem(session, event)) {
      return {
        success: false,
        error: "لا تملك صلاحية تعديل فعالية خارج نطاقك الإداري.",
      };
    }

    event.title = title;
    event.sport = sport;
    event.season = season;
    event.description = description;
    event.startDate = startDate ? new Date(startDate) : null;
    event.endDate = endDate ? new Date(endDate) : null;
    if (status && EVENT_STATUSES.includes(status as EventStatus)) {
      const oldStatus = event.status;
      event.status = status as EventStatus;
      if (oldStatus === "draft" && status !== "draft") {
        await ensureFollowUpsForEvent(id);
      }
    }

    await event.save();
    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء تعديل الفعالية." };
  }
}

/** حذف فعالية/مسابقة مع ارتباطاتها ومتابعاتها. */
export async function deleteEventAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || session.role === "institute") {
    return { success: false, error: "غير مصرح لك بحذف الفعاليات." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { success: false, error: "معرف الفعالية مفقود." };

  await dbConnect();
  try {
    const event = await Event.findById(id);
    if (!event) return { success: false, error: "الفعالية غير موجودة." };

    // التحقق من الصلاحيات (منطق موحّد في lib/rbac)
    if (!canManageScopedItem(session, event)) {
      return {
        success: false,
        error: "لا تملك صلاحية حذف فعالية خارج نطاقك الإداري.",
      };
    }

    // حذف سجلات المتابعة المرتبطة بهذه الفعالية
    await FollowUp.deleteMany({ event: id });
    await Event.findByIdAndDelete(id);

    revalidatePath("/dashboard/events");
    revalidatePath("/dashboard/followup");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حذف الفعالية." };
  }
}

/** تحديث متابعة/نتيجة معهد (يُحدّث المعهد معاهده فقط). */
export async function updateFollowUpAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as FollowupStatus;
  const teamSize = Number(formData.get("teamSize") ?? 0);
  const score = String(formData.get("score") ?? "").trim();
  const rankRaw = String(formData.get("rank") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!FOLLOWUP_STATUSES.includes(status)) return;

  await dbConnect();
  const fu = await FollowUp.findById(id);
  if (!fu) return;

  if (
    session.role === "institute" &&
    String(fu.institute) !== session.instituteId
  ) {
    return;
  }

  fu.status = status;
  fu.teamSize = Number.isFinite(teamSize) ? teamSize : 0;
  fu.score = score;
  fu.rank = rankRaw ? Number(rankRaw) : null;
  fu.notes = notes;
  fu.updatedBy = session.id as never;
  await fu.save();

  revalidatePath("/dashboard/followup");
}

