"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Event } from "@/models/Event";
import { FollowUp } from "@/models/FollowUp";
import { ensureFollowUpsForEvent } from "@/lib/data";
import { SPORTS, FOLLOWUP_STATUSES, type FollowupStatus } from "@/types";

/** إنشاء فعالية/مسابقة حسب مستوى المستخدم. */
export async function createEventAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role === "institute") return;

  const title = String(formData.get("title") ?? "").trim();
  const sport = String(formData.get("sport") ?? "");
  const season = String(formData.get("season") ?? "2025/2026").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  if (!title || !sport) return;
  if (!SPORTS.includes(sport as (typeof SPORTS)[number])) return;

  let scope: "general" | "region" | "administration";
  let region: string | null = null;
  let administration: string | null = null;

  if (session.role === "general") {
    scope = "general";
  } else if (session.role === "region") {
    scope = "region";
    region = session.regionId;
  } else {
    scope = "administration";
    administration = session.administrationId;
    region = session.regionId;
  }

  await dbConnect();
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
}

/** نشر فعالية (يُفعّل المتابعات للمعاهد المستهدفة). */
export async function publishEventAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role === "institute") return;

  const id = String(formData.get("id") ?? "");
  await dbConnect();
  const event = await Event.findById(id);
  if (!event) return;

  event.status = "published";
  await event.save();
  await ensureFollowUpsForEvent(id);

  revalidatePath("/dashboard/events");
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

