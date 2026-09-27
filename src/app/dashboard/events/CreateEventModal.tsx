import { useState } from "react";
import { SPORTS, EVENT_SCOPE_LABELS, type EventScope, type Role } from "@/types";

interface AdministrationOption {
  _id: string;
  name: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  /** دور المستخدم الحالي لتحديد مستويات المسابقة المتاحة */
  userRole: Role;
  /** إدارات وخيارات المنطقة (للإدارة العامة تُمرَّر كل الإدارات) */
  administrations?: AdministrationOption[];
  /** المناطق المتاحة للاختيار (للإدارة العامة فقط) */
  regions?: AdministrationOption[];
}

export function CreateEventModal({
  open,
  onClose,
  onSubmit,
  loading,
  error,
  userRole,
  administrations = [],
  regions = [],
}: Props) {
  // مستوى المسابقة الافتراضي حسب الدور
  const defaultScope: EventScope =
    userRole === "general" ? "general" : userRole === "region" ? "region" : "administration";
  const [scope, setScope] = useState<EventScope>(defaultScope);

  if (!open) return null;

  /** المنطقة والإدارة العامة تختاران بين كل المستويات */
  const canChooseScope = userRole === "region" || userRole === "general";

  /** عند اختيار إدارة من الإدارة العامة نحتاج كل الإدارات وكل المناطق */
  const canPickRegion = userRole === "general" && scope === "region";
  const canPickAdministration =
    canChooseScope &&
    scope === "administration" &&
    (userRole === "general" || administrations.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">إطلاق مسابقة أو فعالية جديدة</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          {/* مستوى المسابقة */}
          {canChooseScope ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                مستوى المسابقة *
              </label>
              <select
                name="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value as EventScope)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              >
                {userRole === "general" && (
                  <option value="general">{EVENT_SCOPE_LABELS.general}</option>
                )}
                <option value="region">{EVENT_SCOPE_LABELS.region}</option>
                <option value="administration">{EVENT_SCOPE_LABELS.administration}</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {userRole === "general" && scope === "general"
                  ? "نهائيات على مستوى الجمهورية تظهر لكل المناطق الـ 27."
                  : scope === "region"
                    ? "تُقام النهائيات بين المعاهد الفائزة من إدارات منطقتها وتظهر لكل المعاهد التابعة لها."
                    : "تصفيات داخل إدارة تعليمية واحدة بمعهداتها."}
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                مستوى المسابقة
              </label>
              <input
                type="hidden"
                name="scope"
                value={defaultScope}
              />
              <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800">
                {EVENT_SCOPE_LABELS[defaultScope]}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                تُنشأ مسابقاتك على مستوى إدارتك التعليمية.
              </p>
            </div>
          )}

          {/* اختيار المنطقة عند إطلاق نهائيات منطقة من الإدارة العامة */}
          {canPickRegion && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                المنطقة الأزهرية المستضيفة *
              </label>
              <select
                name="regionId"
                required
                defaultValue=""
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              >
                <option value="">-- اختر المنطقة --</option>
                {regions.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                النهائي يُعقد بين معاهد المنطقة المختارة فقط.
              </p>
            </div>
          )}

          {/* اختيار الإدارة عند تصفيات إدارية */}
          {canPickAdministration && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الإدارة التعليمية المستضيفة *
              </label>
              <select
                name="administrationId"
                required
                defaultValue="all"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
              >
                <option value="all">
                  {userRole === "general" ? "جميع الإدارات التعليمية" : "جميع الإدارات التعليمية بالمنطقة"}
                </option>
                {administrations.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                {userRole === "general"
                  ? "اختر إدارة واحدة لإقامة التصفيات داخلها، أو «جميع الإدارات» لتعميمها على كل الإدارات."
                  : "اختر «جميع الإدارات» لتعميم التصفيات على كل معاهد منطقتك، أو إدارة واحدة فقط. لا يمكن اختيار إدارة خارج منطقتك."}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              اسم المسابقة / البطولة *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="مثال: دوري كرة القدم للمرحلة الثانوية"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اللعبة الرياضية *</label>
              <select
                name="sport"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
              >
                <option value="">اختر اللعبة...</option>
                {SPORTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الموسم الرياضي</label>
              <input
                type="text"
                name="season"
                defaultValue="2025/2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ البداية</label>
              <input
                type="date"
                name="startDate"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تاريخ النهاية</label>
              <input
                type="date"
                name="endDate"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">الشروط والتفاصيل</label>
            <textarea
              name="description"
              rows={3}
              placeholder="شروط ولوائح المسابقة، الفئات العمرية..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl transition shadow-sm"
            >
              {loading ? "جاري الحفظ..." : "حفظ المسابقة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
