import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Administration } from "@/models/Administration";
import { getVisibleEvents, refId, refName } from "@/lib/data";
import { EventList } from "./EventList";

export default async function EventsPage() {
  const session = (await getSession())!;
  const rawEvents = await getVisibleEvents(session);

  // إدارات المنطقة الحالية (تُستخدم لدور المنطقة عند إنشاء تصفيات إدارية)
  let administrations: { _id: string; name: string }[] = [];
  if (session.role === "region" && session.regionId) {
    await dbConnect();
    const admins = await Administration.find({ region: session.regionId })
      .sort({ name: 1 })
      .lean();
    administrations = admins.map((a) => ({ _id: String(a._id), name: a.name }));
  }

  // تحويل البيانات لـ JSON safe props
  const events = rawEvents.map((e) => ({
    _id: String(e._id),
    title: e.title,
    sport: e.sport,
    season: e.season,
    description: e.description || "",
    scope: e.scope,
    region: refId(e.region),
    regionName: refName(e.region),
    administration: refId(e.administration),
    administrationName: refName(e.administration),
    startDate: e.startDate ? new Date(e.startDate).toISOString().slice(0, 10) : "",
    endDate: e.endDate ? new Date(e.endDate).toISOString().slice(0, 10) : "",
    status: e.status,
    targetCount: e.targetCount,
    respondedCount: e.respondedCount,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          الفعاليات والمسابقات الرياضية
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          إطلاق المسابقات ومتابعة جاهزية الفرق وإدارتها في النطاق الإداري المخصص.
        </p>
      </div>

      <EventList
        events={events}
        userRole={session.role}
        userRegionId={session.regionId}
        userAdminId={session.administrationId}
        administrations={administrations}
      />
    </div>
  );
}
