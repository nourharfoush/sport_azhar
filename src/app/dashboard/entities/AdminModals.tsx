"use client";

import { ActionModal } from "./ActionModal";
import {
  createAdministrationAction,
  updateAdministrationAction,
  deleteAdministrationAction,
} from "./actions";
import type { RegionItem } from "./types";

interface AdminModalsProps {
  role: string;
  userRegionId?: string;
  regions: RegionItem[];
  modalState: {
    type: "createAdmin" | "editAdmin" | "deleteAdmin" | null;
    data?: any;
  };
  onClose: () => void;
}

export function AdminModals({
  role,
  userRegionId,
  regions,
  modalState,
  onClose,
}: AdminModalsProps) {
  return (
    <>
      <ActionModal
        isOpen={modalState.type === "createAdmin"}
        onClose={onClose}
        title="إضافة إدارة تعليمية جديدة"
        action={createAdministrationAction}
        submitLabel="حفظ الإدارة"
      >
        {role === "general" ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              المنطقة الأزهرية التابعة لها
            </label>
            <select
              name="regionId"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="">-- اختر المنطقة الأزهرية --</option>
              {regions.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="regionId" value={userRegionId || ""} />
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            اسم الإدارة التعليمية
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="مثال: إدارة شرق التعليمية"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            كود الإدارة (رمزي ومميز داخل المنطقة)
          </label>
          <input
            type="text"
            name="code"
            required
            placeholder="مثال: EAST"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase font-mono focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
      </ActionModal>

      <ActionModal
        isOpen={modalState.type === "editAdmin"}
        onClose={onClose}
        title="تعديل بيانات الإدارة التعليمية"
        action={updateAdministrationAction}
        submitLabel="حفظ التعديلات"
      >
        <input type="hidden" name="id" value={modalState.data?._id || ""} />

        {role === "general" && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              المنطقة الأزهرية التابعة لها
            </label>
            <select
              name="regionId"
              defaultValue={
                typeof modalState.data?.region === "object"
                  ? modalState.data?.region?._id
                  : modalState.data?.region || ""
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
            >
              {regions.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.code})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            اسم الإدارة التعليمية
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={modalState.data?.name || ""}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">كود الإدارة</label>
          <input
            type="text"
            name="code"
            required
            defaultValue={modalState.data?.code || ""}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase font-mono focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
      </ActionModal>

      <ActionModal
        isOpen={modalState.type === "deleteAdmin"}
        onClose={onClose}
        title="تأكيد حذف الإدارة التعليمية"
        action={deleteAdministrationAction}
        submitLabel="تأكيد الحذف"
        submitVariant="rose"
      >
        <input type="hidden" name="id" value={modalState.data?._id || ""} />
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm space-y-2">
          <p className="font-bold">هل تريد بالتأكيد حذف &ldquo;{modalState.data?.name}&rdquo;؟</p>
          <p className="text-xs text-rose-700 leading-relaxed">
            سيتم حذف جميع المعاهد التابعة لهذه الإدارة ({modalState.data?.institutesCount || 0} معهد) وسجلات المتابعات التابعة لها.
          </p>
        </div>
      </ActionModal>
    </>
  );
}
