"use server";

import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { SportsReference, type RefKind } from "@/models/SportsReference";
import { canManageSportsRefs } from "@/lib/rbac";

const DENIED = "هذا القسم من اختصاص الإدارة العامة وحدها.";

/** التحقق من صحة نوع السجل. */
function parseKind(value: string): RefKind | null {
  return value === "pitch" || value === "equipment" ? value : null;
}

/** قراءة الحقول المشتركة وتحويلها لنص منظَّف. */
function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

interface ParsedRef {
  kind: RefKind;
  name: string;
  sport: string;
  surfaceType: string;
  dimensions: string;
  quantity: string;
  specifications: string;
  diagramUrl: string;
  notes: string;
}

/** التحقق من صحة بيانات المرجع (إضافة/تعديل). */
function parseRef(formData: FormData): ParsedRef | { error: string } {
  const kind = parseKind(field(formData, "kind"));
  const name = field(formData, "name");
  const sport = field(formData, "sport");

  if (!kind) return { error: "نوع السجل غير صالح." };
  if (!name) return { error: "يرجى كتابة الاسم." };
  if (!sport) return { error: "يرجى اختيار اللعبة." };

  const diagramUrl = field(formData, "diagramUrl");
  if (diagramUrl && !/^https?:\/\/\S+$/i.test(diagramUrl)) {
    return { error: "رابط المخطط يجب أن يبدأ بـ http أو https." };
  }

  return {
    kind,
    name,
    sport,
    surfaceType: field(formData, "surfaceType"),
    dimensions: field(formData, "dimensions"),
    quantity: field(formData, "quantity"),
    specifications: field(formData, "specifications"),
    diagramUrl,
    notes: field(formData, "notes"),
  };
}

/** إضافة مقاس/مواصفة جديدة (الإدارة العامة فقط). */
export async function createSportsRefAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageSportsRefs(session)) {
    return { success: false, error: DENIED };
  }

  const parsed = parseRef(formData);
  if ("error" in parsed) return { success: false, error: parsed.error };

  await dbConnect();
  try {
    await SportsReference.create({
      ...parsed,
      authorRole: session.role,
      createdBy: session.id,
    });
    revalidatePath("/dashboard/specs");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حفظ السجل." };
  }
}

/** تعديل مقاس/مواصفة (الإدارة العامة فقط). */
export async function updateSportsRefAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageSportsRefs(session)) {
    return { success: false, error: DENIED };
  }

  const id = field(formData, "id");
  if (!id) return { success: false, error: "معرف السجل مفقود." };

  const parsed = parseRef(formData);
  if ("error" in parsed) return { success: false, error: parsed.error };

  await dbConnect();
  try {
    const doc = await SportsReference.findById(id);
    if (!doc) return { success: false, error: "السجل غير موجود." };

    Object.assign(doc, parsed);
    await doc.save();

    revalidatePath("/dashboard/specs");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء تعديل السجل." };
  }
}

/** حذف مقاس/مواصفة (الإدارة العامة فقط). */
export async function deleteSportsRefAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const session = await getSession();
  if (!session || !canManageSportsRefs(session)) {
    return { success: false, error: DENIED };
  }

  const id = field(formData, "id");
  if (!id) return { success: false, error: "معرف السجل مفقود." };

  await dbConnect();
  try {
    const doc = await SportsReference.findById(id);
    if (!doc) return { success: false, error: "السجل غير موجود." };
    await SportsReference.findByIdAndDelete(id);
    revalidatePath("/dashboard/specs");
    return { success: true };
  } catch {
    return { success: false, error: "حدث خطأ أثناء حذف السجل." };
  }
}