"use client";

import {
  ITEMS_BY_CATEGORY_AND_GENDER,
  SPORT_CATEGORIES,
  SPORT_CATEGORY_LABELS,
  type Gender,
  type SportCategory,
} from "@/types";

export interface ActivityState {
  category: SportCategory;
  sport: string;
}

/**
 * يهيّئ حالة المسار/اللعبة لسجل قائم، مع استنتاج المسار للسجلات القديمة.
 */
export function initialActivity(
  existing?: { category?: SportCategory; sport?: string } | null,
): ActivityState {
  const sport = existing?.sport ?? "";
  return {
    category: existing?.category ?? guessCategory(sport),
    sport,
  };
}

/** استنتاج المسار من اسم العنصر (يُستخدم للأثر القديم بدون حقل category). */
function guessCategory(item: string): SportCategory {
  const isProgram = (ITEMS_BY_CATEGORY_AND_GENDER.programs.بنين as readonly string[])
    .concat(ITEMS_BY_CATEGORY_AND_GENDER.programs.فتيات)
    .includes(item);
  return isProgram ? "programs" : "competitions";
}

/** هل العنصر متاح ضمن المسار والفئة المختارة؟ */
export function isAvailable(
  category: SportCategory,
  gender: Gender,
  item: string,
): boolean {
  return ITEMS_BY_CATEGORY_AND_GENDER[category][gender].includes(item);
}

const labelCls = "block text-xs font-semibold text-slate-700 mb-1";

/**
 * حقول المسار + اللعبة/البرنامج في نافذة الفعالية.
 * يعرض كل مسار قائمته الخاصة حسب المسار المختار
 * (برامج ومشروعات | مسابقات رياضية).
 */
export function EventActivityFields({
  state,
  gender,
  onChange,
  className,
}: {
  state: ActivityState;
  gender: Gender;
  onChange: (next: ActivityState) => void;
  className?: string;
}) {
  const items = ITEMS_BY_CATEGORY_AND_GENDER[state.category][gender];

  const changeCategory = (value: SportCategory) => {
    if (
      state.sport &&
      !ITEMS_BY_CATEGORY_AND_GENDER[value][gender].includes(state.sport)
    ) {
      onChange({ category: value, sport: "" });
    } else {
      onChange({ category: value, sport: state.sport });
    }
  };

  return (
    <>
      <div>
        <label className={labelCls}>المسار *</label>
        <select
          name="category"
          value={state.category}
          onChange={(e) => changeCategory(e.target.value as SportCategory)}
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

      <div>
        <label className={labelCls}>
          {state.category === "programs" ? "البرنامج *" : "اللعبة الرياضية *"}
        </label>
        <select
          name="sport"
          value={state.sport}
          onChange={(e) => onChange({ ...state, sport: e.target.value })}
          className={className}
          required
        >
          <option value="">اختر اللعبة...</option>
          {items.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}