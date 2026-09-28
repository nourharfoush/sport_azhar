"use client";

import {
  GENDERS,
  GENDER_LABELS,
  ITEMS_BY_CATEGORY_AND_GENDER,
  SPORT_CATEGORIES,
  SPORT_CATEGORY_LABELS,
  STUDENT_GRADES,
} from "@/types";
import type { GiftedInstituteOption } from "./types";

export interface GiftedFilters {
  search: string;
  category: string;
  sport: string;
  gender: string;
  grade: string;
  institute: string;
}

interface Props {
  filters: GiftedFilters;
  onChange: (next: GiftedFilters) => void;
  onReset: () => void;
  institutes: GiftedInstituteOption[];
  hasFilters: boolean;
}

const selectCls = "px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white";

/** شريط البحث والفلاتر أعلى قائمة ركن الموهوبين. */
export function GiftedFiltersBar({
  filters,
  onChange,
  onReset,
  institutes,
  hasFilters,
}: Props) {
  const patch = (part: Partial<GiftedFilters>) => onChange({ ...filters, ...part });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={filters.search}
        onChange={(e) => patch({ search: e.target.value })}
        placeholder="بحث بالاسم أو الرقم القومي أو المعهد..."
        className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white min-w-64"
      />

      <select
        value={filters.gender}
        onChange={(e) => patch({ gender: e.target.value })}
        className={selectCls}
        aria-label="فلتر الفئة"
      >
        <option value="all">كل الفئات</option>
        {GENDERS.map((g) => (
          <option key={g} value={g}>
            {GENDER_LABELS[g]}
          </option>
        ))}
      </select>

      <select
        value={filters.grade}
        onChange={(e) => patch({ grade: e.target.value })}
        className={selectCls}
        aria-label="فلتر الصف"
      >
        <option value="all">كل الصفوف</option>
        {STUDENT_GRADES.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={(e) =>
          onChange({ ...filters, category: e.target.value, sport: "all" })
        }
        className={selectCls}
        aria-label="فلتر المسار"
      >
        <option value="all">كل المسارات</option>
        {SPORT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {SPORT_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>

      <select
        value={filters.sport}
        onChange={(e) => patch({ sport: e.target.value })}
        className={selectCls}
        aria-label="فلتر اللعبة أو البرنامج"
      >
        <option value="all">كل الألعاب والبرامج</option>
        {SPORT_CATEGORIES.filter(
          (c) => filters.category === "all" || filters.category === c,
        ).map((c) => {
          const items = new Set<string>([
            ...ITEMS_BY_CATEGORY_AND_GENDER[c].بنين,
            ...ITEMS_BY_CATEGORY_AND_GENDER[c].فتيات,
          ]);
          if (items.size === 0) return null;
          return (
            <optgroup
              key={c}
              label={SPORT_CATEGORY_LABELS[c]}
            >
              {[...items].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>

      {institutes.length > 1 && (
        <select
          value={filters.institute}
          onChange={(e) => patch({ institute: e.target.value })}
          className={selectCls}
          aria-label="فلتر المعهد"
        >
          <option value="all">كل المعاهد</option>
          {institutes.map((i) => (
            <option key={i._id} value={i._id}>
              {i.name}
            </option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-rose-600 hover:underline px-2 py-1 font-semibold"
        >
          إعادة ضبط
        </button>
      )}
    </div>
  );
}