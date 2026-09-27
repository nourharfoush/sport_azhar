import { FOLLOWUP_LABELS, FOLLOWUP_STATUSES, type FollowupStatus } from "@/types";
import { updateFollowUpAction } from "@/app/dashboard/events/actions";

export interface FollowUpItem {
  _id: string;
  status: FollowupStatus;
  teamSize: number;
  score?: string;
  rank?: number | null;
  notes?: string;
  event?: { title?: string; sport?: string };
  institute?: { name?: string; stage?: string };
  region?: { name?: string };
  administration?: { name?: string };
}

export function FollowUpCard({
  fu,
  isInstitute,
}: {
  fu: FollowUpItem;
  isInstitute: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900">
              {fu.event?.title ?? "مسابقة رياضية"}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              {fu.event?.sport}
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            المعهد: <span className="font-medium text-slate-800">{fu.institute?.name}</span> ({fu.institute?.stage}) •
            الإدارة: {fu.administration?.name ?? "-"} • المنطقة: {fu.region?.name ?? "-"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1 rounded-full bg-slate-100 font-semibold text-slate-700">
            {FOLLOWUP_LABELS[fu.status]}
          </span>
          {fu.rank && (
            <span className="text-xs px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold">
              المركز {fu.rank}
            </span>
          )}
        </div>
      </div>

      {isInstitute ? (
        <form action={updateFollowUpAction} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input type="hidden" name="id" value={String(fu._id)} />
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">الحالة</label>
            <select name="status" defaultValue={fu.status} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white">
              {FOLLOWUP_STATUSES.map((st) => (
                <option key={st} value={st}>{FOLLOWUP_LABELS[st]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">اللاعبين</label>
            <input type="number" name="teamSize" min="0" defaultValue={fu.teamSize ?? 0} className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">النتيجة</label>
            <input type="text" name="score" defaultValue={fu.score ?? ""} placeholder="فوز 2-0" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">المركز</label>
            <input type="number" name="rank" min="1" defaultValue={fu.rank ?? ""} placeholder="1" className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition">
              تحديث
            </button>
          </div>
          <div className="sm:col-span-5">
            <input type="text" name="notes" defaultValue={fu.notes ?? ""} placeholder="ملاحظات المعهد..." className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs" />
          </div>
        </form>
      ) : (
        <div className="text-xs text-slate-600 grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>قوام الفريق: <span className="font-semibold text-slate-900">{fu.teamSize}</span></div>
          <div>النتيجة: <span className="font-semibold text-slate-900">{fu.score || "-"}</span></div>
          <div>المركز: <span className="font-semibold text-slate-900">{fu.rank ? `المركز ${fu.rank}` : "-"}</span></div>
          <div>ملاحظات: <span className="text-slate-700">{fu.notes || "لا توجد"}</span></div>
        </div>
      )}
    </div>
  );
}
