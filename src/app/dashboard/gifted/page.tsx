import { getSession } from "@/lib/auth";
import { getGiftedInstituteOptions, getVisibleGiftedStudents, refId, refName } from "@/lib/data";
import { canManageGifted } from "@/lib/rbac";
import { categoryOf } from "@/types";
import { GiftedStudentList } from "./GiftedStudentList";

export default async function GiftedPage() {
  const session = (await getSession())!;
  const [rawStudents, institutes] = await Promise.all([
    getVisibleGiftedStudents(session),
    getGiftedInstituteOptions(session),
  ]);

  // تحويل البيانات لـ JSON safe props
  const students = rawStudents.map((s) => ({
    _id: String(s._id),
    fullName: s.fullName,
    nationalId: s.nationalId,
    region: refId(s.region),
    regionName: refName(s.region),
    administration: refId(s.administration),
    administrationName: refName(s.administration),
    institute: refId(s.institute),
    instituteName: refName(s.institute),
    grade: s.grade,
    gender: s.gender,
    // السجلات القديمة لا تحمل المسار، فنستنتجه من اسم اللعبة
    category: s.category ?? categoryOf(s.sport),
    sport: s.sport,
    photo: s.photo,
    notes: s.notes ?? "",
    createdAt: s.createdAt
      ? new Date(s.createdAt).toISOString().slice(0, 10)
      : "",
  }));

  const programsCount = students.filter((s) => s.category === "programs").length;
  const competitionsCount = students.length - programsCount;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          ركن الموهوبين
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          سجل الطلاب الموهوبين رياضيًا في كل معاهد نطاقك الإداري، مقسَّمًا إلى
          البرامج والمشروعات والمسابقات الرياضية.
        </p>
      </div>

      {/* ملخص المسارين */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
          <div className="text-xs font-bold text-amber-800">
            البرامج والمشروعات
          </div>
          <div className="text-3xl font-extrabold text-amber-700 mt-2">
            {programsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            المشروع القومي للياقة البدنية • الزهرات والمرشدات • العروض الرياضية
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-sm">
          <div className="text-xs font-bold text-emerald-800">
            المسابقات الرياضية
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-2">
            {competitionsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            ألعاب القوى • الكاراتيه • تنس الطاولة • وبقية المسابقات
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-700">إجمالي الموهوبين</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {students.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">طالب في نطاقك</div>
        </div>
      </div>

      <GiftedStudentList
        students={students}
        institutes={institutes}
        userRole={session.role}
        userRegionId={session.regionId}
        userAdminId={session.administrationId}
        userInstituteId={session.instituteId}
        canCreate={canManageGifted(session)}
      />
    </div>
  );
}