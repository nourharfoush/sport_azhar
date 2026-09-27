import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { Region } from "@/models/Region";
import { Administration } from "@/models/Administration";
import { Institute } from "@/models/Institute";
import { redirect } from "next/navigation";
import { UsersClient } from "./UsersClient";
import type {
  UserRow,
  RegionOption,
  AdministrationOption,
  InstituteOption,
} from "./types";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "institute") redirect("/dashboard");

  await dbConnect();

  // 1) معرفات الإدارات/المعاهد داخل نطاق المدير الحالي
  let adminIds: string[] = [];
  let instituteIds: string[] = [];
  if (session.role === "general") {
    const [allAdmins, allInsts] = await Promise.all([
      Administration.find({}).select("_id").lean(),
      Institute.find({}).select("_id").lean(),
    ]);
    adminIds = allAdmins.map((a) => String(a._id));
    instituteIds = allInsts.map((i) => String(i._id));
  } else if (session.role === "region" && session.regionId) {
    const admins = await Administration.find({ region: session.regionId })
      .select("_id")
      .lean();
    adminIds = admins.map((a) => String(a._id));
    if (adminIds.length) {
      const insts = await Institute.find({ administration: { $in: adminIds } })
        .select("_id")
        .lean();
      instituteIds = insts.map((i) => String(i._id));
    }
  } else if (session.role === "administration" && session.administrationId) {
    adminIds = [session.administrationId];
    const insts = await Institute.find({ administration: session.administrationId })
      .select("_id")
      .lean();
    instituteIds = insts.map((i) => String(i._id));
  }

  // 2) المراجع (مناطق/إدارات/معاهد) لخيارات النماذج
  const [regionsRaw, adminsRaw, instsRaw] = await Promise.all([
    session.role === "general"
      ? Region.find({}).sort({ name: 1 }).lean()
      : session.regionId
        ? Region.find({ _id: session.regionId }).lean()
        : [],
    session.role === "general"
      ? Administration.find({})
          .populate("region", "name")
          .sort({ name: 1 })
          .lean()
      : adminIds.length
        ? Administration.find({ _id: { $in: adminIds } })
            .populate("region", "name")
            .sort({ name: 1 })
            .lean()
        : [],
    session.role === "general"
      ? Institute.find({})
          .populate("administration", "name")
          .sort({ name: 1 })
          .limit(2000)
          .lean()
      : instituteIds.length
        ? Institute.find({ _id: { $in: instituteIds } })
            .populate("administration", "name")
            .sort({ name: 1 })
            .limit(2000)
            .lean()
        : [],
  ]);

  // 3) المستخدمون المرئيون للمدير الحالي
  const userFilter: Record<string, unknown> =
    session.role === "general"
      ? {}
      : session.role === "region"
        ? {
            $or: [
              { role: "region", region: session.regionId },
              { role: "administration", administration: { $in: adminIds } },
              { role: "institute", institute: { $in: instituteIds } },
            ],
          }
        : {
            $or: [
              { role: "administration", administration: session.administrationId },
              { role: "institute", institute: { $in: instituteIds } },
            ],
          };

  const rawUsers = await User.find(userFilter).sort({ name: 1 }).limit(2000).lean();


  // 4) خرائط الأسماء لمكان العمل المعروض في الجدول
  const regionNameById = new Map<string, string>();
  const allRegionsForNames =
    session.role === "general"
      ? (regionsRaw as Array<{ _id: unknown; name: string }>)
      : ((await Region.find({}).select("_id name").lean()) as Array<{
          _id: unknown;
          name: string;
        }>);
  for (const r of allRegionsForNames) regionNameById.set(String(r._id), r.name);

  const adminById = new Map<string, { name: string; regionName: string }>();
  for (const a of adminsRaw as Array<{
    _id: unknown;
    name: string;
    region?: { name?: string } | unknown;
  }>) {
    const robj =
      a.region && typeof a.region === "object"
        ? (a.region as { name?: string })
        : null;
    adminById.set(String(a._id), { name: a.name, regionName: robj?.name ?? "" });
  }
  const instituteById = new Map<string, { name: string; administrationId: string }>();
  for (const i of instsRaw as Array<{
    _id: unknown;
    name: string;
    administration?: { _id?: unknown } | unknown;
  }>) {
    const aobj =
      i.administration && typeof i.administration === "object"
        ? (i.administration as { _id?: unknown })
        : null;
    instituteById.set(String(i._id), {
      name: i.name,
      administrationId: aobj?._id ? String(aobj._id) : "",
    });
  }

  const users: UserRow[] = rawUsers.map((u) => {
    const regionId = u.region ? String(u.region) : null;
    const administrationId = u.administration ? String(u.administration) : null;
    const instituteId = u.institute ? String(u.institute) : null;

    let workplace = "—";
    if (u.role === "general") {
      workplace = "الإدارة العامة للرعاية الرياضية";
    } else if (u.role === "region") {
      workplace = regionId ? (regionNameById.get(regionId) ?? "منطقة أزهرية") : "منطقة أزهرية";
    } else if (u.role === "administration") {
      const a = administrationId ? adminById.get(administrationId) : undefined;
      workplace = a
        ? `${a.name}${a.regionName ? ` — ${a.regionName}` : ""}`
        : "إدارة تعليمية";
    } else if (u.role === "institute") {
      const inst = instituteId ? instituteById.get(instituteId) : undefined;
      const a = inst ? adminById.get(inst.administrationId) : undefined;
      workplace = inst ? `${inst.name}${a?.name ? ` — ${a.name}` : ""}` : "معهد أزهري";
    }

    return {
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      regionId,
      administrationId,
      instituteId,
      workplace,
    };
  });


  const regionOptions: RegionOption[] = (
    regionsRaw as Array<{ _id: unknown; name: string; code: string }>
  ).map((r) => ({ _id: String(r._id), name: r.name, code: r.code }));

  const administrationOptions: AdministrationOption[] = (
    adminsRaw as Array<{
      _id: unknown;
      name: string;
      code: string;
      region?: { _id?: unknown; name?: string } | unknown;
    }>
  ).map((a) => {
    const robj =
      a.region && typeof a.region === "object"
        ? (a.region as { _id?: unknown; name?: string })
        : null;
    const regionId = robj?._id ? String(robj._id) : "";
    return {
      _id: String(a._id),
      name: a.name,
      code: a.code,
      regionId,
      regionName: robj?.name ?? regionNameById.get(regionId) ?? "",
    };
  });

  const instituteOptions: InstituteOption[] = (
    instsRaw as Array<{
      _id: unknown;
      name: string;
      code: string;
      stage: string;
      administration?: { _id?: unknown; name?: string } | unknown;
    }>
  ).map((i) => {
    const aobj =
      i.administration && typeof i.administration === "object"
        ? (i.administration as { _id?: unknown; name?: string })
        : null;
    return {
      _id: String(i._id),
      name: i.name,
      code: i.code,
      stage: i.stage,
      administrationId: aobj?._id ? String(aobj._id) : "",
      administrationName: aobj?.name ?? "",
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          إدارة المستخدمين والصلاحيات
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {session.role === "general" &&
            "الإدارة العامة: إضافة وتعديل وحذف مستخدمي كل المستويات (المناطق، الإدارات، المعاهد)."}
          {session.role === "region" &&
            "المنطقة الأزهرية: إضافة وتعديل وحذف مستخدمي منطقتك (مستخدم المنطقة، الإدارات، المعاهد)."}
          {session.role === "administration" &&
            "الإدارة التعليمية: إضافة وتعديل وحذف مستخدمي إدارتك (مستخدم الإدارة ومعاهدها)."}
        </p>
      </div>

      <UsersClient
        currentUserId={session.id}
        managerRole={session.role}
        managerRegionId={session.regionId}
        managerAdminId={session.administrationId}
        users={users}
        regions={regionOptions}
        administrations={administrationOptions}
        institutes={instituteOptions}
      />
    </div>
  );
}
