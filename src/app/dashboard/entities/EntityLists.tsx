import type { IRegion } from "@/models/Region";
import type { IAdministration } from "@/models/Administration";
import type { IInstitute } from "@/models/Institute";

export function EntityLists({
  role,
  regions,
  administrations,
  institutes,
}: {
  role: string;
  regions: IRegion[];
  administrations: IAdministration[];
  institutes: IInstitute[];
}) {
  return (
    <div className="space-y-6">
      {role === "general" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-3">المناطق الأزهرية ({regions.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {regions.map((r) => (
              <div key={String(r._id)} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-semibold text-sm text-slate-900">{r.name}</div>
                <div className="text-xs text-slate-400 font-mono mt-1">الكود: {r.code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-3">الإدارات التعليمية ({administrations.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {administrations.map((a) => (
            <div key={String(a._id)} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-semibold text-sm text-slate-900">{a.name}</div>
              <div className="text-xs text-slate-500 mt-1">الكود: {a.code}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-bold text-slate-900 mb-3">المعاهد الأزهرية ({institutes.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {institutes.map((i) => (
            <div key={String(i._id)} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="font-semibold text-sm text-slate-900">{i.name}</div>
              <div className="text-xs text-slate-500 mt-1">
                المرحلة: {i.stage} • الكود: {i.code}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
