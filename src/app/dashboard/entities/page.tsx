import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Region, type IRegion } from "@/models/Region";
import { Administration, type IAdministration } from "@/models/Administration";
import { Institute, type IInstitute } from "@/models/Institute";
import { getScopedAdministrationIds } from "@/lib/data";
import { EntityLists } from "./EntityLists";

export default async function EntitiesPage() {
  const session = (await getSession())!;
  await dbConnect();

  // جلب المناطق حسب الدور
  let regions: IRegion[] = [];
  if (session.role === "general") {
    regions = (await Region.find({}).sort({ name: 1 }).lean()) as unknown as IRegion[];
  } else if (session.role === "region" && session.regionId) {
    const r = await Region.findById(session.regionId).lean();
    if (r) regions = [r as unknown as IRegion];
  } else if (session.role === "administration" && session.regionId) {
    const r = await Region.findById(session.regionId).lean();
    if (r) regions = [r as unknown as IRegion];
  }

  // جلب الإدارات
  const adminIds = await getScopedAdministrationIds(session);
  const adminFilter =
    adminIds === null
      ? {}
      : session.role === "region"
        ? { region: session.regionId }
        : { _id: { $in: adminIds } };

  const administrations = (await Administration.find(adminFilter)
    .populate<{ region: { _id: any; name: string; code: string } }>("region")
    .sort({ name: 1 })
    .lean()) as unknown as IAdministration[];

  // جلب المعاهد مع ربطها بالإدارة والمنطقة
  let instituteFilter: any = {};
  if (session.role === "institute") {
    instituteFilter = { _id: session.instituteId };
  } else if (adminIds !== null) {
    instituteFilter = { administration: { $in: adminIds } };
  }

  const institutes = (await Institute.find(instituteFilter)
    .populate({
      path: "administration",
      populate: { path: "region" },
    })
    .sort({ name: 1 })
    .lean()) as unknown as IInstitute[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          إدارة الهيكل التنظيمي والمستويات
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {session.role === "general" &&
            "لوحة الإدارة العامة: تحكم كامل بإضافة، تعديل، وحذف المناطق، الإدارات التعليمية، والمعاهد الأزهرية."}
          {session.role === "region" &&
            "لوحة المنطقة الأزهرية: تحكم بإضافة وتعديل وحذف الإدارات التعليمية والمعاهد التابعة لمنطقتك."}
          {session.role === "administration" &&
            "لوحة الإدارة التعليمية: تحكم بإضافة وتعديل وحذف المعاهد التابعة لإدارتك."}
        </p>
      </div>

      <EntityLists
        role={session.role}
        userRegionId={session.regionId}
        userAdminId={session.administrationId}
        regions={JSON.parse(JSON.stringify(regions))}
        administrations={JSON.parse(JSON.stringify(administrations))}
        institutes={JSON.parse(JSON.stringify(institutes))}
      />
    </div>
  );
}

