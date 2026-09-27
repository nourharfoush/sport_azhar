"use client";

import { ActionModal } from "./ActionModal";
import {
  createRegionAction,
  updateRegionAction,
  deleteRegionAction,
} from "./actions";
import type { RegionItem } from "./types";

interface RegionModalsProps {
  modalState: {
    type: "createRegion" | "editRegion" | "deleteRegion" | null;
    data?: any;
  };
  onClose: () => void;
}

export function RegionModals({ modalState, onClose }: RegionModalsProps) {
  return (
    <>
      <ActionModal
        isOpen={modalState.type === "createRegion"}
        onClose={onClose}
        title="إضافة منطقة أزهرية جديدة"
        action={createRegionAction}
        submitLabel="حفظ المنطقة"
      >
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            اسم المنطقة الأزهرية
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="مثال: منطقة مطروح الأزهرية"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            كود المنطقة (رمزي ومميز)
          </label>
          <input
            type="text"
            name="code"
            required
            placeholder="مثال: MAT"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase font-mono focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
      </ActionModal>

      <ActionModal
        isOpen={modalState.type === "editRegion"}
        onClose={onClose}
        title="تعديل بيانات المنطقة الأزهرية"
        action={updateRegionAction}
        submitLabel="حفظ التعديلات"
      >
        <input type="hidden" name="id" value={modalState.data?._id || ""} />
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            اسم المنطقة الأزهرية
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
          <label className="block text-xs font-bold text-slate-700 mb-1.5">كود المنطقة</label>
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
        isOpen={modalState.type === "deleteRegion"}
        onClose={onClose}
        title="تأكيد حذف المنطقة الأزهرية"
        action={deleteRegionAction}
        submitLabel="تأكيد الحذف النهائي"
        submitVariant="rose"
      >
        <input type="hidden" name="id" value={modalState.data?._id || ""} />
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm space-y-2">
          <p className="font-bold">هل أنت متأكد من حذف &ldquo;{modalState.data?.name}&rdquo;؟</p>
          <p className="text-xs text-rose-700 leading-relaxed">
            تحذير: سيؤدي هذا الإجراء لحذف جميع الإدارات والمعاهد والمستخدمين التابعين للمنطقة!
          </p>
        </div>
      </ActionModal>
    </>
  );
}
