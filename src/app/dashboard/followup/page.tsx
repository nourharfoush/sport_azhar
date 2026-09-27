import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { MonthlyVisit } from "@/models/MonthlyVisit";
import { DailyReport } from "@/models/DailyReport";
import { User } from "@/models/User";
import { Region } from "@/models/Region";
import { Administration } from "@/models/Administration";
import { Institute } from "@/models/Institute";
import { MonthlyPlanBuilder } from "./MonthlyPlanBuilder";
import { DailyReportCard, type VisitRow } from "./DailyReportCard";
import { MONTH_LABELS, type DailyReportStatus, type VisitType } from "@/types";
import { refName } from "@/lib/data";

/** الشهر الحالي بصيغة YYYY-MM. */
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function FollowUpPage() {
  const session = (await getSession())!;
  await dbConnect();

  const month = currentMonth();
  const isPlanManager = session.role === "region" || session.role === "administration";
  const isSupervisor = isPlanManager;

  // ── 1. الموجّهون ضمن نطاق المدير (لبناء الخطة) ──
  let supervisorOptions: Array<{
    _id: string;
    name: string;
    regionName: string;
    administrationName: string;
  }> = [];
  let instituteOptions: Array<{
    _id: string;
    name: string;
    stage: string;
    administrationName: string;
    regionName: string;
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
      role: { $in: ["region", "administration"] },
      ...(session.role === "region" && session.regionId
        ? { region: session.regionId }
        : session.role === "administration" && session.administrationId
          ? { administration: session.administrationId }
          : {}),
    }).lean();

    supervisorOptions = supervisors.map((s) => ({
      _id: String(s._id),
      name: s.name,
      regionName: s.region ? (regionName.get(String(s.region)) ?? "") : "",
      administrationName: s.administration
        ? (adminName.get(String(s.administration)) ?? "")
        : "",
    }));

    const insts = await Institute.find({
      administration: { $in: admins.map((a) => a._id) },
    }).lean();
    instituteOptions = insts.map((i) => ({
      _id: String(i._id),
      name: i.name,
      stage: i.stage,
      administrationName: adminName.get(String(i.administration)) ?? "",
      regionName: "",
    }));
  }

  // ── 2. مواعيد الشهر الحالي + تقاريرها ──
  const visitFilter: Record<string, unknown> = { month };
  if (session.role === "region" && session.regionId) {
    visitFilter.region = session.regionId;
  } else if (session.role === "administration" && session.administrationId) {
    visitFilter.administration = session.administrationId;
  } else if (session.role === "institute" && session.instituteId) {
    visitFilter.institute = session.instituteId;
  } else if (session.role !== "general") {
    // موجّه من مستوى область/الإدارة يرى مواعيده هو فقط
    visitFilter.supervisor = session.id;
  }
  // ملاحظة: region/administration موجودان أصلًا في scope المديرين
  if (session.role === "region" || session.role === "administration") {
    delete visitFilter.supervisor;
  }

  const visits = await MonthlyVisit.find(visitFilter)
    .populate("supervisor", "name")
    .populate("institute", "name")
    .populate("administration", "name")
    .populate("region", "name")
    .sort({ date: 1 })
    .lean();

  const visitIds = visits.map((v) => v._id);
  const reports = await DailyReport.find({ visit: { $in: visitIds } }).lean();
  const reportByVisit = new Map(reports.map((r) => [String(r.visit), r]));

  const rows: VisitRow[] = visits.map((v) => {
    const r = reportByVisit.get(String(v._id));
    return {
      _id: String(v._id),
      date: new Date(v.date).toISOString(),
      visitType: v.visitType as VisitType,
      supervisorName: refName(v.supervisor) ?? "—",
      instituteName: refName(v.institute) ?? "—",
      administrationName: refName(v.administration) ?? "—",
      regionName: refName(v.region) ?? "—",
      reportStatus: ((r?.status as DailyReportStatus | undefined) ?? "pending"),
      summary: r?.summary ?? "",
      recommendations: r?.recommendations ?? "",
    };
  });

  const monthTitle = `${MONTH_LABELS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
  const submitted = rows.filter((r) => r.reportStatus === "submitted").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          الخطة الشهرية والمتابعات اليومية
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {isPlanManager
            ? "ضع خطة الشهر لكل الموجّهين في نطاقك، وتابع تقاريرهم اليومية المرسلة."
            : "مواعيدك في الخطة الشهرية، ولكل يوم تقرير تكتبه ثم ترسله."}
        </p>
      </div>

      {isPlanManager && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">بناء خطة الشهر</h2>
          <MonthlyPlanBuilder
            supervisors={supervisorOptions}
            institutes={instituteOptions}
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
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            {isPlanManager
              ? "لا توجد مواعيد في خطة هذا الشهر بعد. ابدأ بإضافة موعد من النموذج أعلاه."
              : "لا توجد مواعيد في خطتك لهذا الشهر. راجع موجه المنطقة أو الإدارة التعليمية."}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((v) => (
              <DailyReportCard
                key={v._id}
                visit={v}
                isSupervisor={isSupervisor}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}


