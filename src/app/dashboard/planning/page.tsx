import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import {
  getGiftedInstituteOptions,
  getPlanningRecords,
  refId,
  refName,
} from "@/lib/data";
import { MonthlyVisit } from "@/models/MonthlyVisit";
import { DailyReport } from "@/models/DailyReport";
import { User } from "@/models/User";
import { Region } from "@/models/Region";
import { Administration } from "@/models/Administration";
import { Institute } from "@/models/Institute";
import { MonthlyPlanBuilder } from "../followup/MonthlyPlanBuilder";
import { DailyReportCard, type VisitRow } from "../followup/DailyReportCard";
import { supervisedRolesFor } from "../followup/planScope";
import {
  MONTH_LABELS,
  displayName,
  type DailyReportStatus,
  type VisitType,
} from "@/types";
import { PlanningTabs } from "./PlanningTabs";
import type { PlanningRecordItem } from "./types";

/** الشهر الحالي بصيغة YYYY-MM. */
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function PlanningPage() {
  const session = (await getSession())!;
  await dbConnect();

  const month = currentMonth();
  const isPlanManager =
    session.role === "general" ||
    session.role === "region" ||
    session.role === "administration";
  const isGeneral = session.role === "general";

  // ── 1. سجلات التخطيط مجمّعة حسب القسم ──
  const rawRecords = await getPlanningRecords(session);
  const recordsBySection: Record<string, PlanningRecordItem[]> = {};

  for (const r of rawRecords) {
    const list = recordsBySection[r.section] ?? [];
    list.push({
      _id: String(r._id),
      section: r.section,
      title: r.title,
      academicYear: r.academicYear ?? "",
      content: r.content ?? "",
      items: r.items ?? "",
      links: r.links ?? "",
      status: r.status ?? "",
      region: refId(r.region),
      regionName: refName(r.region),
      administration: refId(r.administration),
      administrationName: refName(r.administration),
      institute: refId(r.institute),
      instituteName: refName(r.institute),
      createdAt: r.createdAt
        ? new Date(r.createdAt).toISOString().slice(0, 10)
        : "",
    });
    recordsBySection[r.section] = list;
  }

  // ── 2. خيارات المعاهد (لتسجيل السجلات وبناء خطة الشهر) ──
  const fullInstituteOptions = await getGiftedInstituteOptions(session);
  const instituteOptions = fullInstituteOptions.map((i) => ({
    _id: i._id,
    name: i.name,
    administrationName: i.administrationName,
  }));

  // ── 3. الموجّهون (لبناء خطة الشهر) ──
  let supervisorOptions: Array<{
    _id: string;
    name: string;
    regionName: string;
    administrationName: string;
  }> = [];

  if (isPlanManager) {
    const [regions, admins] = await Promise.all([
      Region.find(
        session.role === "region" && session.regionId
          ? { _id: session.regionId }
          : {},
      ).lean(),
      Administration.find(
        session.role === "administration" && session.administrationId
          ? { _id: session.administrationId }
          : session.role === "region" && session.regionId
            ? { region: session.regionId }
            : {},
      ).lean(),
    ]);
    const regionName = new Map(regions.map((r) => [String(r._id), r.name]));
    const adminName = new Map(admins.map((a) => [String(a._id), a.name]));

    const supervisors = await User.find({
      role: { $in: supervisedRolesFor(session) },
      ...(session.role === "region" && session.regionId
        ? { region: session.regionId }
        : session.role === "administration" && session.administrationId
          ? { administration: session.administrationId }
          : {}),
    }).lean();

    supervisorOptions = supervisors.map((s) => ({
      _id: String(s._id),
      name: displayName(s.name),
      regionName: s.region ? (regionName.get(String(s.region)) ?? "") : "",
      administrationName: s.administration
        ? (adminName.get(String(s.administration)) ?? "")
        : "",
    }));
  }

  // ── 4. مواعيد الشهر الحالي + تقاريرها ──
  const visitFilter: Record<string, unknown> = { month };
  if (session.role === "region" && session.regionId) {
    visitFilter.region = session.regionId;
  } else if (session.role === "administration" && session.administrationId) {
    visitFilter.administration = session.administrationId;
  } else if (session.role === "institute" && session.instituteId) {
    visitFilter.institute = session.instituteId;
  } else if (!isGeneral) {
    visitFilter.supervisor = session.id;
  }

  const visits = await MonthlyVisit.find(visitFilter).sort({ date: 1 }).lean();
  const reports = await DailyReport.find({
    visit: { $in: visits.map((v) => v._id) },
  }).lean();
  const reportByVisit = new Map(reports.map((r) => [String(r.visit), r]));
  const institutesById = new Map(
    (await Institute.find({}).select("name type").lean()).map((i) => [
      String(i._id),
      i,
    ]),
  );

  const rows: VisitRow[] = visits.map((v) => {
    const r = reportByVisit.get(String(v._id));
    const inst = institutesById.get(String(v.institute));
    return {
      _id: String(v._id),
      date: new Date(v.date).toISOString(),
      visitType: v.visitType as VisitType,
      supervisorId: refId(v.supervisor) ?? "",
      supervisorName: refName(v.supervisor) ?? "—",
      instituteName: inst?.name ?? "—",
      instituteType: inst?.type || "مشترك",
      administrationName: refName(v.administration) ?? "—",
      regionName: refName(v.region) ?? "—",
      reportStatus: (r?.status as DailyReportStatus | undefined) ?? "pending",
      body: {},
    };
  });

  const monthTitle = `${MONTH_LABELS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
  const submitted = rows.filter((r) => r.reportStatus === "submitted").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          التخطيط والمتابعة
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          خطط العمل والمتابعة والتقارير على كل المستويات.
        </p>
      </div>

      <PlanningTabs
        recordsBySection={recordsBySection}
        institutes={instituteOptions}
        userRole={session.role}
        userRegionId={session.regionId}
        userAdminId={session.administrationId}
        userInstituteId={session.instituteId}
        allowCentral={isGeneral}
        monthlyFollowupTab={
          <div className="space-y-6">
            {isPlanManager && (
              <section className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900">بناء خطة الشهر</h2>
                <MonthlyPlanBuilder
                  supervisors={supervisorOptions}
                  institutes={fullInstituteOptions}
                  defaultMonth={month}
                />
              </section>
            )}

            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  مواعيد {monthTitle}
                </h2>
                <span className="text-xs text-slate-600 bg-slate-100 rounded-full px-3 py-1">
                  {rows.length} موعد • {submitted} تقرير مُرسل
                </span>
              </div>

              {rows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm space-y-2">
                  <p className="font-semibold text-slate-700">
                    لا توجد مواعيد في خطة {monthTitle} بعد.
                  </p>
                  {isPlanManager ? (
                    <p>ابدأ بإضافة موعد من نموذج «بناء خطة الشهر» أعلاه.</p>
                  ) : (
                    <p>لم يضع مديرك خطة لهذا الشهر بعد.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {rows.map((v) => (
                    <DailyReportCard
                      key={v._id}
                      visit={v}
                      isSupervisor={v.supervisorId === session.id}
                      canManage={isPlanManager}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        }
      />
    </div>
  );
}