"use client";

import { ActionModal } from "./ActionModal";
import {
  createInstituteAction,
  updateInstituteAction,
  deleteInstituteAction,
} from "./actions";
import type { AdministrationItem } from "./types";

interface InstituteModalsProps {
  role: string;
  userAdminId?: string;
  administrations: AdministrationItem[];
  modalState: {
    type: "createInstitute" | "editInstitute" | "deleteInstitute" | null;
    data?: any;
  };
  onClose: () => void;
}

export function InstituteModals({
  role,
  userAdminId,
  administrations,
  modalState,
  onClose,
}: InstituteModalsProps) {
  return (
    <>
      <ActionModal
        isOpen={modalState.type === "createInstitute"}
        onClose={onClose}
        title="إضافة معهد أزهري جديد"
        action={createInstituteAction}
        submitLabel="حفظ المعهد"
      >
        {role !== "administration" ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الإدارة التعليمية التابع لها
            </label>
            <select
              name="administrationId"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="">-- اختر الإدارة التعليمية --</option>
              {administrations.map((a) => {
                const regName =
                  typeof a.region === "object" ? a.region?.name : "";
                return (
                  <option key={a._id} value={a._id}>
                    {a.name} {regName ? `(${regName})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        ) : (
          <input type="hidden" name="administrationId" value={userAdminId || ""} />
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المعهد</label>
          <input
            type="text"
            name="name"
            required
            placeholder="مثال: معهد دمنهور النموذجي بنين"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">كود المعهد</label>
            <input
              type="text"
              name="code"
              required
              placeholder="مثال: INST-101"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase font-mono focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">المرحلة التعليمية</label>
            <select
              name="stage"
              defaultValue="الإعدادي"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="الابتدائي">الابتدائي</option>
              <option value="الإعدادي">الإعدادي</option>
              <option value="الثانوي">الثانوي</option>
            </select>
          </div>
        </div>
      </ActionModal>

      <ActionModal
        isOpen={modalState.type === "editInstitute"}
        onClose={onClose}
        title="تعديل بيانات المعهد الأزهري"
        action={updateInstituteAction}
        submitLabel="حفظ التعديلات"
      >
        <input type="hidden" name="id" value={modalState.data?._id || ""} />

        {role !== "administration" && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              الإدارة التعليمية التابع لها
            </label>
            <select
              name="administrationId"
              defaultValue={
                typeof modalState.data?.administration === "object"
                  ? modalState.data?.administration?._id
                  : modalState.data?.administration || ""
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
            >
              {administrations.map((a) => {
                const regName =
                  typeof a.region === "object" ? a.region?.name : "";
                return (
                  <option key={a._id} value={a._id}>
                    {a.name} {regName ? `(${regName})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المعهد</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={modalState.data?.name || ""}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">كود المعهد</label>
            <input
              type="text"
              name="code"
              required
              defaultValue={modalState.data?.code || ""}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase font-mono focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">المرحلة التعليمية</label>
            <select
              name="stage"
              defaultValue={modalState.data?.stage || "الإعدادي"}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="الابتدائي">الابتدائي</option>
              <option value="الإعدادي">الإعدادي</option>
              <option value="الثانوي">الثانوي</option>
            </select>
          </div>
        </div>
      </ActionModal>

      <ActionModal
        isOpen={modalState.type === "deleteInstitute"}
        onClose={onClose}
        title="تأكيد حذف المعهد الأزهري"
        action={deleteInstituteAction}
        submitLabel="تأكيد الحذف"
        submitVariant="rose"
      >
        <input type="hidden" name="id" value={modalState.data?._id || ""} />
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm space-y-2">
          <p className="font-bold">هل تريد بالتأكيد حذف &ldquo;{modalState.data?.name}&rdquo;؟</p>
          <p className="text-xs text-rose-700 leading-relaxed">
            سيؤدي هذا الإجراء إلى حذف جميع سجلات المتابعة والتقارير المرتبطة بهذا المعهد نهائياً.
          </p>
        </div>
      </ActionModal>
    </>
  );
}

