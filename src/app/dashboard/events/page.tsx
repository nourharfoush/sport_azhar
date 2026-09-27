import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Administration } from "@/models/Administration";
import { Region } from "@/models/Region";
import { getVisibleEvents, refId, refName } from "@/lib/data";
import { EventList } from "./EventList";

export default async function EventsPage() {
  const session = (await getSession())!;
  const rawEvents = await getVisibleEvents(session);

  // الإدارة العامة تحتاج كل الإدارات والمناطق لإطلاق مسابقة بأي مستوى
  const isGeneral = session.role === "general";

  let administrations: { _id: string; name: string }[] = [];
  let regions: { _id: string; name: string }[] = [];
  if (isGeneral || session.role === "region") {
    await dbConnect();
    const adminFilter = isGeneral ? {} : { region: session.regionId };
    const [admins, regs] = await Promise.all([
      Administration.find(adminFilter).sort({ name: 1 }).lean(),
      isGeneral ? Region.find({}).sort({ name: 1 }).lean() : Promise.resolve([]),
    ]);
    administrations = admins.map((a) => ({ _id: String(a._id), name: a.name }));
    regions = regs.map((r) => ({ _id: String(r._id), name: r.name }));
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
        regions={regions}
      />
    </div>
  );
}
