"use client";

import { useState } from "react";
import type { GiftedInstituteOption } from "./types";

interface Props {
  institutes: GiftedInstituteOption[];
  /** المعهد المحدد مسبقًا (وضع التعديل). */
  initialInstituteId?: string | null;
  className?: string;
  error?: string | null;
}

/**
 * اختيار النطاق المترابط: المنطقة ← الإدارة التعليمية ← المعهد.
 *
 * كل مستوى يُصفّي الذي يليه، فلا يمكن اختيار معهد
 * لا ينتمي للمنطقة/الإدارة المختارتين. الحقول تحمل أسماءها
 * فتُرسَل تلقائيًا، ويبقى السيرفر هو المصدر الموثوق للنطاق.
 */
export function ScopeSelects({
  institutes,
  initialInstituteId,
  className = "",
  error,
}: Props) {
  // القيم الابتدائية عند وضع التعديل
  const initial = institutes.find((i) => i._id === initialInstituteId);

  const [regionId, setRegionId] = useState(initial?.regionId ?? "");
  const [administrationId, setAdministrationId] = useState(
    initial?.administrationId ?? "",
  );
  const [instituteId, setInstituteId] = useState(initial?._id ?? "");

  // المناطق المتاحة (من المعاهد المسموح بها فقط)
  const regions = [
    ...new Map(
      institutes
        .filter((i) => i.regionId)
        .map((i) => [i.regionId, { id: i.regionId, name: i.regionName }]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "ar"));

  // الإدارات التابعة للمنطقة المختارة
  const administrations = [
    ...new Map(
      institutes
        .filter((i) => i.regionId === regionId)
        .map((i) => [
          i.administrationId,
          { id: i.administrationId, name: i.administrationName },
        ]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "ar"));

  // المعاهد التابعة للإدارة المختارة
  const scopedInstitutes = institutes
    .filter((i) => i.administrationId === administrationId)
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));

  // كل الخيارات ظاهرة عند فتح نافذة المعهد (لتسهيل التعديل)
  const showAllInstitutes = regionId === "" && administrationId === "";

  return (
    <div className="space-y-3">
      {/* المنطقة الأزهرية */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          المنطقة الأزهرية *
        </label>
        <select
          name="regionId"
          value={regionId}
          onChange={(e) => {
            const value = e.target.value;
            setRegionId(value);
            setAdministrationId("");
            setInstituteId("");
          }}
          className={className}
          required={!showAllInstitutes || !instituteId}
        >
          <option value="">-- اختر المنطقة --</option>
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* الإدارة التعليمية */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          الإدارة التعليمية *
        </label>
        <select
          name="administrationId"
          value={administrationId}
          onChange={(e) => {
            const value = e.target.value;
            setAdministrationId(value);
            setInstituteId("");
          }}
          disabled={!regionId}
          className={`${className} ${!regionId ? "opacity-50 cursor-not-allowed" : ""}`}
          required={!instituteId}
        >
          <option value="">
            {regionId ? "-- اختر الإدارة التعليمية --" : "اختر المنطقة أولًا"}
          </option>
          {administrations.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      {/* المعهد */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          المعهد *
        </label>
        <select
          name="instituteId"
          value={instituteId}
          onChange={(e) => setInstituteId(e.target.value)}
          disabled={!administrationId && !showAllInstitutes}
          className={`${className} ${!administrationId && !showAllInstitutes ? "opacity-50 cursor-not-allowed" : ""}`}
          required
        >
          <option value="">
            {administrations.length > 0
              ? "-- اختر المعهد --"
              : institutes.length === 0
                ? "لا توجد معاهد متاحة"
                : "اختر المنطقة والإدارة أولًا"}
          </option>
          {(showAllInstitutes ? institutes : scopedInstitutes).map((i) => (
            <option key={i._id} value={i._id}>
              {i.name}
              {showAllInstitutes && i.administrationName
                ? ` — ${i.administrationName}`
                : ""}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500 mt-1">
          تُختار المنطقة والإدارة ثم المعهد تلقائيًا. يتحقق السيرفر من صحة
          النطاق عند الحفظ.
        </p>
        {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
      </div>
    </div>
  );
}
