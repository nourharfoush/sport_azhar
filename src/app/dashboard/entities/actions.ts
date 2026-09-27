"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Region } from "@/models/Region";
import { Administration } from "@/models/Administration";
import { Institute, STAGES } from "@/models/Institute";

/** الإدارة العامة تنشئ منطقة أزهرية. */
export async function createRegionAction(formData: FormData): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "general") return;

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!name || !code) return;

  await dbConnect();
  try {
    await Region.create({ name, code });
  } catch {
    return;
  }
  revalidatePath("/dashboard/entities");
}

/** المنطقة تنشئ إدارة تعليمية داخلها. */
export async function createAdministrationAction(
  formData: FormData,
): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "region" || !session.regionId) return;

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  if (!name || !code) return;

  await dbConnect();
  try {
    await Administration.create({ name, code, region: session.regionId });
  } catch {
    return;
  }
  revalidatePath("/dashboard/entities");
}

/** الإدارة التعليمية تنشئ معهدًا داخلها. */
export async function createInstituteAction(
  formData: FormData,
): Promise<void> {
  const session = await getSession();
  if (!session || session.role !== "administration" || !session.administrationId)
    return;

  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim();
  const stage = String(formData.get("stage") ?? "الإعدادي");
  if (!name || !code) return;
  if (!STAGES.includes(stage as (typeof STAGES)[number])) return;

  await dbConnect();
  try {
    await Institute.create({
      name,
      code,
      stage,
      administration: session.administrationId,
    });
  } catch {
    return;
  }
  revalidatePath("/dashboard/entities");
}

