"use client";

import type { AdministrationItem, RegionItem } from "./types";

interface AdminsTableProps {
  filteredAdmins: AdministrationItem[];
  regions: RegionItem[];
  institutesCountMap: Record<string, number>;
  onEdit: (admin: AdministrationItem) => void;
  onDelete: (admin: AdministrationItem, count: number) => void;
}

export function AdminsTable({
  filteredAdmins,
  regions,
  institutesCountMap,
  onEdit,
  onDelete,
}: AdminsTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900">
          قائمة الإدارات التعليمية ({filteredAdmins.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-xs font-semibold">
              <th className="py-3 px-4">اسم الإدارة التعليمية</th>
              <th className="py-3 px-4">الكود</th>
              <th className="py-3 px-4">المنطقة التابعة لها</th>
              <th className="py-3 px-4">المعاهد التابعة</th>
              <th className="py-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  لا توجد إدارات تعليمية مطابقة للبحث.
                </td>
              </tr>
            ) : (
              filteredAdmins.map((admin) => {
                const regionName =
                  typeof admin.region === "object"
                    ? admin.region?.name
                    : regions.find((r) => r._id === admin.region)?.name || "غير محدد";

                const count = institutesCountMap[admin._id] || 0;

                return (
                  <tr key={admin._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{admin.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800">
                      {admin.code}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{regionName}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                        {count} معهد
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(admin)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => onDelete(admin, count)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
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
