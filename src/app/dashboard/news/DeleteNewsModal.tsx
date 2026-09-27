import { NewsItem } from "./types";

interface Props {
  news: NewsItem | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
}

export function DeleteNewsModal({ news, onClose, onSubmit, loading, error }: Props) {
  if (!news) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">تأكيد حذف الخبر</h3>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <input type="hidden" name="id" value={news._id} />

          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-600 leading-relaxed">
            هل أنت متأكد من رغبتك في حذف الخبر{" "}
            <strong className="text-slate-900 font-bold">{news.title}</strong>؟
          </p>

          <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
            تنبيه: سيتم حذف الخبر نهائياً من كل المستويات التي يظهر لها.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              تراجع
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl transition shadow-sm"
            >
              {loading ? "جاري الحذف..." : "نعم، حذف الخبر"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
