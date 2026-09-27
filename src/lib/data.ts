import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Region } from "@/models/Region";
import { Administration } from "@/models/Administration";
import { Institute } from "@/models/Institute";
import { Event, type IEvent } from "@/models/Event";
import { FollowUp } from "@/models/FollowUp";
import { News } from "@/models/News";
import { buildNewsFilter, canManageNews } from "@/lib/rbac";

import { buildEventFilter } from "@/lib/rbac";
import type { SessionUser } from "@/types";

/** استخراج المعرف من قيمة قد تكون مُعمَّرة (populated) أو ObjectId نصي. */
export function refId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

/** استخراج الاسم من قيمة مُعمَّرة. */
export function refName(value: unknown): string | null {
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return name ? String(name) : null;
  }
  return null;
}

/** إرجاع معرفات الإدارات التي يراها المستخدم حسب مستواه (null = بلا قيد). */
export async function getScopedAdministrationIds(
  user: SessionUser,
): Promise<Types.ObjectId[] | null> {
  await dbConnect();
  switch (user.role) {
    case "general":
      return null;
    case "region": {
      const admins = await Administration.find({ region: user.regionId }).select("_id");
      return admins.map((a) => a._id as Types.ObjectId);
    }
    case "administration":
    case "institute":
      return [new Types.ObjectId(user.administrationId as string)];
    default:
      return [];
  }
}

/** المعاهد التي يراها/يخضع لها المستخدم. */
export async function getScopedInstitutes(user: SessionUser) {
  await dbConnect();
  if (user.role === "institute") {
    return Institute.find({ _id: user.instituteId }).lean();
  }
  const adminIds = await getScopedAdministrationIds(user);
  if (adminIds === null) return Institute.find({}).lean();
  if (adminIds.length === 0) return [];
  return Institute.find({ administration: { $in: adminIds } }).lean();
}

/** الفعاليات المرئية للمستخدم مع عدّادات المتابعة وأسماء النطاق. */
export async function getVisibleEvents(user: SessionUser) {
  await dbConnect();
  const events = await Event.find(buildEventFilter(user))
    .populate("region", "name")
    .populate("administration", "name")
    .sort({ createdAt: -1 })
    .lean();

  return Promise.all(
    events.map(async (e) => {
      const target = await resolveTargetInstituteIds(e as unknown as IEvent);
      const done = await FollowUp.countDocuments({
        event: e._id,
        status: { $in: ["ongoing", "completed", "registered"] },
      });
      return { ...e, targetCount: target.length, respondedCount: done };
    }),
  );
}

/**
 * الأخبار والتعميمات المرئية للمستخدم حسب نطاقه.
 * (المسودات تظهر لأصحاب الصلاحيات فقط، والمعهد يرى المنشور فقط.)
 */
export async function getVisibleNews(user: SessionUser) {
  await dbConnect();
  const filter: Record<string, unknown> = { ...buildNewsFilter(user) };
  if (!canManageNews(user)) {
    filter.published = true;
  }
  return News.find(filter)
    .populate("region", "name")
    .populate("administration", "name")
    .sort({ isPinned: -1, createdAt: -1 })
    .lean();
}


/** المعاهد المستهدفة بفعالية حسب نطاقها. */
export async function resolveTargetInstituteIds(event: IEvent) {
  await dbConnect();
  if (event.scope === "general") {
    const insts = await Institute.find({}).select("_id");
    return insts.map((i) => i._id as Types.ObjectId);
  }
  if (event.scope === "region" && event.region) {
    const admins = await Administration.find({ region: event.region }).select("_id");
    const insts = await Institute.find({
      administration: { $in: admins.map((a) => a._id) },
    }).select("_id");
    return insts.map((i) => i._id as Types.ObjectId);
  }
  if (event.scope === "administration" && event.administration) {
    const insts = await Institute.find({
      administration: event.administration,
    }).select("_id");
    return insts.map((i) => i._id as Types.ObjectId);
  }
  // تصفية "جميع الإدارات" للمنطقة: كل معاهد إدارات المنطقة
  if (event.scope === "administration" && event.region) {
    const admins = await Administration.find({ region: event.region }).select("_id");
    const insts = await Institute.find({
      administration: { $in: admins.map((a) => a._id) },
    }).select("_id");
    return insts.map((i) => i._id as Types.ObjectId);
  }
  return [];
}

async function instituteFilterForEvent(event: IEvent) {
  if (event.scope === "general") return {};
  if (event.scope === "region" && event.region) {
    const admins = await Administration.find({ region: event.region }).select("_id");
    return { administration: { $in: admins.map((a) => a._id) } };
  }
  if (event.scope === "administration" && event.administration) {
    return { administration: event.administration };
  }
  // تصفية "جميع الإدارات" للمنطقة: معاهد كل إدارات المنطقة
  if (event.scope === "administration" && event.region) {
    const admins = await Administration.find({ region: event.region }).select("_id");
    return { administration: { $in: admins.map((a) => a._id) } };
  }
  return { _id: null };
}


/** إنشاء سجلات متابعة فارغة لكل معهد مستهدف عند نشر فعالية (idempotent). */
export async function ensureFollowUpsForEvent(eventId: string) {
  await dbConnect();
  const event = (await Event.findById(eventId).lean()) as unknown as IEvent | null;
  if (!event) return;

  const institutes = await Institute.find(
    await instituteFilterForEvent(event),
  ).lean();

  const admins = await Administration.find({}).select("_id region").lean();
  const adminRegion = new Map(admins.map((a) => [String(a._id), a.region]));

  const existing = await FollowUp.find({ event: eventId }).select("institute").lean();
  const existingIds = new Set(existing.map((f) => String(f.institute)));

  const docs = institutes
    .filter((i) => !existingIds.has(String(i._id)))
    .map((i) => ({
      event: eventId,
      institute: i._id,
      administration: i.administration,
      region: adminRegion.get(String(i.administration)),
      status: "not_started",
      teamSize: 0,
      updatedBy: (event as { createdBy: Types.ObjectId }).createdBy,
    }))
    .filter((d) => !!d.region);

  if (docs.length) {
    await FollowUp.insertMany(docs, { ordered: false }).catch(() => {});
  }
}

export interface DashboardStats {
  regions: number;
  administrations: number;
  institutes: number;
  events: number;
  publishedEvents: number;
  followupsTotal: number;
  followupsCompleted: number;
  completionRate: number;
}

/** إحصاءات لوحة التحكم مقيّدة بنطاق المستخدم. */
export async function getDashboardStats(
  user: SessionUser,
): Promise<DashboardStats> {
  await dbConnect();
  const adminIds = await getScopedAdministrationIds(user);
  const adminFilter = adminIds === null ? {} : { _id: { $in: adminIds } };

  const regionFilter =
    user.role === "general"
      ? {}
      : user.role === "region"
        ? { _id: user.regionId }
        : { _id: null };

  const institutes = await getScopedInstitutes(user);
  const instIds = institutes.map((i) => i._id);

  const [regions, administrations, events, publishedEvents] = await Promise.all([
    Region.countDocuments(regionFilter),
    Administration.countDocuments(adminFilter),
    Event.countDocuments(buildEventFilter(user)),
    Event.countDocuments({
      ...buildEventFilter(user),
      status: { $in: ["published", "active"] },
    }),
  ]);

  const [followupsTotal, followupsCompleted] = await Promise.all([
    FollowUp.countDocuments({ institute: { $in: instIds } }),
    FollowUp.countDocuments({
      institute: { $in: instIds },
      status: { $in: ["ongoing", "completed"] },
    }),
  ]);

  return {
    regions,
    administrations,
    institutes: institutes.length,
    events,
    publishedEvents,
    followupsTotal,
    followupsCompleted,
    completionRate: followupsTotal
      ? Math.round((followupsCompleted / followupsTotal) * 100)
      : 0,
  };
}
