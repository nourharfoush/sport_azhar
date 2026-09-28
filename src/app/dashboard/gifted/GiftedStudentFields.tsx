"use client";

import { useState } from "react";
import {
  GENDERS,
  GENDER_LABELS,
  NATIONAL_ID_LENGTH,
  STUDENT_GRADES,
  categoryOf,
  ITEMS_BY_CATEGORY_AND_GENDER,
  type Gender,
  type SportCategory,
} from "@/types";
import type { GiftedInstituteOption, GiftedStudentItem } from "./types";
import { StudentPhotoField } from "./StudentPhotoField";
import { ActivitySelect, CategorySelect } from "./ActivitySelect";
import { ScopeSelects } from "./ScopeSelects";

export const GIFTED_INPUT_CLS =
  "w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30";
export const GIFTED_LABEL_CLS = "block text-xs font-semibold text-slate-700 mb-1";

interface FieldsProps {
  student: GiftedStudentItem | null;
  institutes: GiftedInstituteOption[];
}

/**
 * حقول النموذج المشتركة بين الإضافة والتعديل.
 * النطاق يُختار مترابطًا (منطقة ← إدارة ← معهد) عبر ScopeSelects،
 * ويتحقق السيرفر من صحته عند الحفظ.
 */
export function GiftedStudentFields({ student, institutes }: FieldsProps) {
  const [gender, setGender] = useState<Gender>(student?.gender ?? "بنين");
  // المسار يُشتق من السجل المحفوظ، أو من اسم العنصر في السجلات القديمة
  const [category, setCategory] = useState<SportCategory>(
    student?.category ?? categoryOf(student?.sport ?? ""),
  );
  const [sport, setSport] = useState<string>(student?.sport ?? "");
  const [preview, setPreview] = useState<string | null>(null);

  /** تغيير الفئة: نُبطل الاختيار إن لم يعد متاحًا لها. */
  const changeGender = (value: Gender) => {
    setGender(value);
    if (sport && !ITEMS_BY_CATEGORY_AND_GENDER[category][value].includes(sport)) {
      setSport("");
    }
  };

  /** تغيير المسار: نُبطل الاختيار إن لم يكن ضمن المسار الجديد. */
  const changeCategory = (value: SportCategory) => {
    setCategory(value);
    if (sport && !ITEMS_BY_CATEGORY_AND_GENDER[value][gender].includes(sport)) {
      setSport("");
    }
  };

  return (
    <div className="space-y-4">
      {student && <input type="hidden" name="id" value={student._id} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={GIFTED_LABEL_CLS}>اسم الطالب *</label>
          <input
            type="text"
            name="fullName"
            required
            defaultValue={student?.fullName ?? ""}
            placeholder="الاسم ثلاثي"
            className={GIFTED_INPUT_CLS}
          />
        </div>

        <div>
          <label className={GIFTED_LABEL_CLS}>
            الرقم القومي * ({NATIONAL_ID_LENGTH} رقمًا)
          </label>
          <input
            type="text"
            name="nationalId"
            required
            inputMode="numeric"
            maxLength={NATIONAL_ID_LENGTH}
            pattern="[0-9]{14}"
            defaultValue={student?.nationalId ?? ""}
            placeholder="14 رقمًا بلا مسافات"
            className={GIFTED_INPUT_CLS}
          />
        </div>

        <div className="md:col-span-2">
          <ScopeSelects
            institutes={institutes}
            initialInstituteId={student?.institute ?? null}
            className={GIFTED_INPUT_CLS}
          />
        </div>

        <div>
          <label className={GIFTED_LABEL_CLS}>الصف الدراسي *</label>
          <select
            name="grade"
            required
            defaultValue={student?.grade ?? ""}
            className={GIFTED_INPUT_CLS}
          >
            <option value="">-- اختر الصف --</option>
            {STUDENT_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={GIFTED_LABEL_CLS}>فئة الطالب *</label>
          <select
            name="gender"
            required
            value={gender}
            onChange={(e) => changeGender(e.target.value as Gender)}
            className={GIFTED_INPUT_CLS}
          >
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {GENDER_LABELS[g]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <CategorySelect
            value={category}
            onChange={changeCategory}
            className={GIFTED_INPUT_CLS}
          />
        </div>

        <ActivitySelect
          value={sport}
          onChange={setSport}
          gender={gender}
          category={category}
          grouped
          className={GIFTED_INPUT_CLS}
          placeholder={
            category === "programs" ? "-- اختر البرنامج --" : "-- اختر اللعبة --"
          }
        />
      </div>

      <StudentPhotoField
        currentPhoto={student?.photo}
        preview={preview}
        onPreviewChange={setPreview}
        required={!student}
      />

      <div>
        <label className={GIFTED_LABEL_CLS}>ملاحظات (اختياري)</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={student?.notes ?? ""}
          placeholder="أي إنجازات أو ملاحظات إضافية..."
          className={GIFTED_INPUT_CLS}
        />
      </div>
    </div>
  );
}