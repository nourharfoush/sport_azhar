"use client";

import type { RegionItem } from "./types";

interface RegionsTableProps {
  filteredRegions: RegionItem[];
  administrationsCountMap: Record<string, number>;
  onEdit: (region: RegionItem) => void;
  onDelete: (region: RegionItem, count: number) => void;
}

export function RegionsTable({
  filteredRegions,
  administrationsCountMap,
  onEdit,
  onDelete,
}: RegionsTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-900">
          قائمة المناطق الأزهرية ({filteredRegions.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-xs font-semibold">
              <th className="py-3 px-4">اسم المنطقة الأزهرية</th>
              <th className="py-3 px-4">الكود الرسمي</th>
              <th className="py-3 px-4">الإدارات التابعة</th>
              <th className="py-3 px-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRegions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  لا توجد مناطق تطابق معايير البحث.
                </td>
              </tr>
            ) : (
              filteredRegions.map((region) => {
                const count = administrationsCountMap[region._id] || 0;
                return (
                  <tr key={region._id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{region.name}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800">
                      {region.code}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                        {count} إدارة
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit(region)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => onDelete(region, count)}
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
