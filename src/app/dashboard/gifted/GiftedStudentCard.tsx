import {
  GENDER_LABELS,
  SPORT_CATEGORY_LABELS,
} from "@/types";
import type { GiftedStudentItem } from "./types";

/** ألوان شارة المسار (برامج / مسابقات). */
const CATEGORY_STYLES: Record<string, string> = {
  programs: "bg-amber-50 text-amber-800 border-amber-200",
  competitions: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

interface Props {
  students: GiftedStudentItem[];
  canManageItem: (s: GiftedStudentItem) => boolean;
  onEdit: (s: GiftedStudentItem) => void;
  onDelete: (s: GiftedStudentItem) => void;
}

/** بطاقة عرض الطالب الموهوب: الصورة + البيانات الأساسية + أزرار العمليات. */
export function GiftedStudentCard({ students, canManageItem, onEdit, onDelete }: Props) {
  if (students.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm space-y-2">
        <p className="font-semibold text-slate-700">
          لا يوجد طلاب موهوبون مسجَّلون في نطاقك.
        </p>
        <p>ابدأ بإضافة أول طالب موهوب من الزر أعلى الصفحة.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
      {students.map((s) => {
        const canManage = canManageItem(s);

        return (
          <article
            key={s._id}
            className="flex gap-4 p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition"
          >
            {/* صورة الطالب */}
            <a
              href={s.photo}
              target="_blank"
              rel="noreferrer"
              title="عرض الصورة بالحجم الكامل"
              className="shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.photo}
                alt={`صورة ${s.fullName}`}
                className="w-24 h-28 object-cover rounded-2xl border border-slate-200"
              />
            </a>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{s.fullName}</h3>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
                    CATEGORY_STYLES[s.category] ?? CATEGORY_STYLES.competitions
                  }`}
                >
                  {SPORT_CATEGORY_LABELS[s.category]}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  {s.sport}
                </span>
              </div>

              <dl className="text-xs text-slate-600 space-y-1">
                <div className="flex gap-1.5">
                  <dt className="text-slate-400 shrink-0">الرقم القومي:</dt>
                  <dd className="font-semibold text-slate-800" dir="ltr">
                    {s.nationalId}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-slate-400 shrink-0">الصف:</dt>
                  <dd className="text-slate-800">
                    {s.grade} ({GENDER_LABELS[s.gender]})
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-slate-400 shrink-0">المعهد:</dt>
                  <dd className="text-slate-800">{s.instituteName ?? "—"}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-slate-400 shrink-0">الإدارة التعليمية:</dt>
                  <dd className="text-slate-800">{s.administrationName ?? "—"}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-slate-400 shrink-0">المنطقة الأزهرية:</dt>
                  <dd className="text-slate-800">{s.regionName ?? "—"}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt className="text-slate-400 shrink-0">تاريخ التسجيل:</dt>
                  <dd className="text-slate-800">{s.createdAt || "—"}</dd>
                </div>
              </dl>

              {s.notes && (
                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 whitespace-pre-line">
                  {s.notes}
                </p>
              )}

              {canManage && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onEdit(s)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition"
                  >
                    حذف
                  </button>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}