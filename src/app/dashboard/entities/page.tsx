import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Region, type IRegion } from "@/models/Region";
import { Administration, type IAdministration } from "@/models/Administration";
import { type IInstitute } from "@/models/Institute";
import { getScopedInstitutes, getScopedAdministrationIds } from "@/lib/data";
import {
  createRegionAction,
  createAdministrationAction,
  createInstituteAction,
} from "./actions";
import { EntityLists } from "./EntityLists";

export default async function EntitiesPage() {
  const session = (await getSession())!;
  await dbConnect();

  const regions =
    session.role === "general"
      ? ((await Region.find({}).sort({ name: 1 }).lean()) as unknown as IRegion[])
      : [];

  const adminIds = await getScopedAdministrationIds(session);
  const adminFilter =
    adminIds === null
      ? {}
      : session.role === "region"
        ? { region: session.regionId }
        : { _id: { $in: adminIds } };

  const administrations = (await Administration.find(adminFilter)
    .sort({ name: 1 })
    .lean()) as unknown as IAdministration[];

  const institutes = (await getScopedInstitutes(session)) as unknown as IInstitute[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          الهيكل التنظيمي ومستويات المتابعة
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          إدارة المناطق والإدارات والمعاهد التابعة حسب صلاحياتك.
        </p>
      </div>

      {session.role === "general" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            إضافة منطقة أزهرية جديدة
          </h2>
          <form action={createRegionAction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              name="name"
              required
              placeholder="اسم المنطقة (مثل: منطقة القاهرة الأزهرية)"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <input
              type="text"
              name="code"
              required
              placeholder="الكود (مثل: CAI)"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition"
            >
              حفظ المنطقة
            </button>
          </form>
        </div>
      )}

      {session.role === "region" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            إضافة إدارة تعليمية تابعة
          </h2>
          <form action={createAdministrationAction} className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              name="name"
              required
              placeholder="اسم الإدارة التعليمية"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <input
              type="text"
              name="code"
              required
              placeholder="الكود (مثل: NSR)"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition"
            >
              حفظ الإدارة
            </button>
          </form>
        </div>
      )}

      {session.role === "administration" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-3">
            إضافة معهد أزهري تابع
          </h2>
          <form action={createInstituteAction} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              name="name"
              required
              placeholder="اسم المعهد الأزهري"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <input
              type="text"
              name="code"
              required
              placeholder="الكود"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <select
              name="stage"
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
            >
              <option value="الابتدائي">الابتدائي</option>
              <option value="الإعدادي">الإعدادي</option>
              <option value="الثانوي">الثانوي</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition"
            >
              حفظ المعهد
            </button>
          </form>
        </div>
      )}

      <EntityLists
        role={session.role}
        regions={regions}
        administrations={administrations}
        institutes={institutes}
      />
    </div>
  );
}
