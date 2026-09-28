import { NEWS_CATEGORY_LABELS } from "@/types";
import { NewsItem } from "./types";
import { toggleNewsPublishAction, toggleNewsPinAction } from "./actions";

interface Props {
  news: NewsItem[];
  canManageNewsItem: (n: NewsItem) => boolean;
  onEdit: (n: NewsItem) => void;
  onDelete: (n: NewsItem) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
  news: "bg-emerald-50 text-emerald-700 border-emerald-200",
  announcement: "bg-blue-50 text-blue-700 border-blue-200",
  decision: "bg-amber-50 text-amber-700 border-amber-200",
  sports_report: "bg-purple-50 text-purple-700 border-purple-200",
  work_manual: "bg-slate-100 text-slate-800 border-slate-300",
  regulations: "bg-rose-50 text-rose-700 border-rose-200",
};

export function NewsTable({ news, canManageNewsItem, onEdit, onDelete }: Props) {
  if (news.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        لا توجد أخبار أو تعميمات مطابقة للبحث أو النطاق المحدد.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {news.map((n) => {
        const canManageThis = canManageNewsItem(n);

        return (
          <div
            key={n._id}
            className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/60 transition"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {n.isPinned && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                    📌 مثبّت
                  </span>
                )}
                <span className="font-bold text-base text-slate-900">{n.title}</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                    CATEGORY_STYLES[n.category] ?? "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {NEWS_CATEGORY_LABELS[n.category]}
                </span>
                {!n.published && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    غير منشور
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>التاريخ: <strong>{n.createdAt}</strong></span>
                <span>•</span>
                <span>
                  النطاق:{" "}
                  <strong className="text-slate-700">
                    {n.scope === "general"
                      ? "مركزي عام (كافة المناطق)"
                      : n.scope === "region"
                        ? `منطقة ${n.regionName ?? "أزهرية"}`
                        : `إدارة ${n.administrationName ?? "تعليمية"}`}
                  </strong>
                </span>
              </div>

              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed whitespace-pre-line">
                {n.content}
              </p>

              {n.images.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {n.images.slice(0, 4).map((src) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      title="عرض الصورة بالحجم الكامل"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={n.title}
                        className="w-24 h-20 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition"
                      />
                    </a>
                  ))}
                  {n.images.length > 4 && (
                    <span className="text-[11px] text-slate-500">
                      +{n.images.length - 4} صورة
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* أزرار العمليات */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {canManageThis && (
                <>
                  <form action={toggleNewsPublishAction}>
                    <input type="hidden" name="id" value={n._id} />
                    <button
                      type="submit"
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition text-white ${
                        n.published
                          ? "bg-slate-500 hover:bg-slate-600"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {n.published ? "إلغاء النشر" : "نشر للجميع"}
                    </button>
                  </form>

                  <form action={toggleNewsPinAction}>
                    <input type="hidden" name="id" value={n._id} />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-xl border border-amber-200 hover:bg-amber-50 text-amber-700 text-xs font-semibold transition"
                    >
                      {n.isPinned ? "إلغاء التثبيت" : "تثبيت"}
                    </button>
                  </form>

                  <button
                    onClick={() => onEdit(n)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => onDelete(n)}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition"
                  >
                    حذف
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
