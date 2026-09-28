"use client";

import {
  ITEMS_BY_CATEGORY_AND_GENDER,
  SPORT_CATEGORIES,
  SPORT_CATEGORY_LABELS,
  type Gender,
  type SportCategory,
} from "@/types";

interface Props {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  gender: Gender;
  category: SportCategory;
  /** قوائم مُجمَّعة (مساران) بدل قائمة واحدة مسطحة. */
  grouped?: boolean;
  className?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
}

const labelCls = "block text-xs font-semibold text-slate-700 mb-1";

/**
 * قائمة اختيار المسار (برامج ومشروعات | مسابقات رياضية).
 * تغيير المسار يُبطل الاختيار الحالي إن لم يكن ضمنه.
 */
export function CategorySelect({
  value,
  onChange,
  className = "",
  id,
}: {
  value: SportCategory;
  onChange: (v: SportCategory) => void;
  className?: string;
  id?: string;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={id}>
        المسار *
      </label>
      <select
        id={id}
        name="category"
        value={value}
        onChange={(e) => onChange(e.target.value as SportCategory)}
        className={className}
        required
      >
        {SPORT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {SPORT_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * قائمة اختيار اللعبة/البرنامج.
 * - `grouped`: تعرض المسارين في optgroup منفصلين (لركن الموهوبين).
 * - غير مُجمَّعة: عنصران متتاليان (لصفحة الفعاليات).
 */
export function ActivitySelect({
  name = "sport",
  value,
  onChange,
  gender,
  category,
  grouped = false,
  className = "",
  required = true,
  placeholder = "-- اختر --",
  id,
}: Props) {
  const items = ITEMS_BY_CATEGORY_AND_GENDER[category][gender];

  return (
    <div>
      <label className={labelCls} htmlFor={id}>
        {category === "programs" ? "البرنامج *" : "اللعبة الرياضية *"}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
        required={required}
      >
        <option value="">{placeholder}</option>
        {grouped ? (
          SPORT_CATEGORIES.filter(
            (c) => ITEMS_BY_CATEGORY_AND_GENDER[c][gender].length > 0,
          ).map((c) => (
            <optgroup
              key={c}
              label={SPORT_CATEGORY_LABELS[c]}
            >
              {ITEMS_BY_CATEGORY_AND_GENDER[c][gender].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </optgroup>
          ))
        ) : (
          items.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))
        )}
      </select>
    </div>
  );
}