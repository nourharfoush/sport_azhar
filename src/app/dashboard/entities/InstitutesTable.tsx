"use client";

import type { InstituteItem } from "./types";

interface InstitutesTableProps {
  filteredInstitutes: InstituteItem[];
  canManageInstitutes: boolean;
  onEdit: (inst: InstituteItem) => void;
  onDelete: (inst: InstituteItem) => void;
}

export function InstitutesTable({
  filteredInstitutes,
  canManageInstitutes,
  onEdit,
  onDelete,
}: InstitutesTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900">
          قائمة المعاهد الأزهرية ({filteredInstitutes.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-xs font-semibold">
              <th className="py-3 px-4">اسم المعهد</th>
              <th className="py-3 px-4">الكود</th>
              <th className="py-3 px-4">المرحلة</th>
              <th className="py-3 px-4">النوع</th>
              <th className="py-3 px-4">الإدارة التعليمية</th>
              <th className="py-3 px-4">المنطقة الأزهرية</th>
              {canManageInstitutes && <th className="py-3 px-4 text-center">إجراءات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInstitutes.length === 0 ? (
              <tr>
                <td
                  colSpan={canManageInstitutes ? 7 : 6}
                  className="py-8 text-center text-slate-500"
                >
                  لا توجد معاهد أزهرية تطابق شروط البحث.
                </td>
              </tr>
            ) : (
              filteredInstitutes.map((inst) => {
                const adminObj =
                  typeof inst.administration === "object" ? inst.administration : null;
                const adminName = adminObj?.name || "غير محدد";
                const regionName =
                  typeof adminObj?.region === "object"
                    ? adminObj.region?.name
                    : "غير محدد";

                return (
                  <tr key={inst._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{inst.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800">
                      {inst.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          inst.stage === "الثانوي"
                            ? "bg-amber-100 text-amber-800"
                            : inst.stage === "الإعدادي"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {inst.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          inst.type === "بنين"
                            ? "bg-sky-50 text-sky-700 border-sky-200"
                            : inst.type === "فتيات"
                              ? "bg-pink-50 text-pink-700 border-pink-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {inst.type || "مشترك"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{adminName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{regionName}</td>
                    {canManageInstitutes && (
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEdit(inst)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => onDelete(inst)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
