"use client";

import { useState } from "react";
import {
  YES_NO,
  YES_NO_LABELS,
  ATTENDANCE,
  ATTENDANCE_LABELS,
  EXISTENCE,
  EXISTENCE_LABELS,
  COMPLETENESS,
  COMPLETENESS_LABELS,
  PLAN_EXECUTION,
  PLAN_EXECUTION_LABELS,
  type DailyReportBody,
} from "@/types";
import { missingReportFields } from "./reportRules";

/** عنوان قسم داخل النموذج. */
function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-3 border-t border-slate-100 first:border-0 first:pt-0">
      <h4 className="text-sm font-bold text-slate-800 mb-2.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-700 text-white text-[11px] ml-1.5">
          {n}
        </span>
        {title}
      </h4>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30";
const labelCls = "block text-xs font-bold text-slate-700 mb-1.5";

/**
 * نموذج تقرير المتابعة اليومي.
 *
 * الحقول مُتحكَّم بها (controlled): كل قائمة تُعيد الرسم فورًا
 * فتظهر الحقول التابعة لها أو تختفي مباشرةً عند تغيير الاختيار.
 * (لو استُخدم defaultValue لتقيّمت الشرط مرة واحدة عند التحميل فقط.)
 */
export function ReportFormFields({
  instituteName,
  instituteType,
  body,
  pending,
}: {
  instituteName: string;
  instituteType: string;
  body: DailyReportBody;
  pending: boolean;
}) {
  const [b, setB] = useState<DailyReportBody>(body ?? {});
  const isMixed = instituteType === "مشترك";
  const missing = missingReportFields(b, instituteType);
  const complete = missing.length === 0;

  const set = <K extends keyof DailyReportBody>(k: K, v: DailyReportBody[K]) =>
    setB((prev) => ({ ...prev, [k]: v }));

  // اختيار «لا» ينظّف الحقل التابع حتى لا يبقى محفوظًا من قبل
  const setSeconded = (v: string) => {
    setB((prev) => {
      const next = { ...prev, seconded: v as DailyReportBody["seconded"] };
      if (v !== "yes") delete next.secondedInstituteName;
      return next;
    });
  };
  const setRecordBook = (v: string) => {
    setB((prev) => {
      const next = { ...prev, recordBook: v as DailyReportBody["recordBook"] };
      if (v !== "present") delete next.recordBookCompleteness;
      return next;
    });
  };
  const setRecords = (v: string) => {
    setB((prev) => {
      const next = { ...prev, records: v as DailyReportBody["records"] };
      if (v !== "present") {
        delete next.recordsCompleteness;
        delete next.missingRecordsNames;
      }
      return next;
    });
  };
  const setRecordsCompleteness = (v: string) => {
    setB((prev) => {
      const next = {
        ...prev,
        recordsCompleteness: v as DailyReportBody["recordsCompleteness"],
      };
      if (v !== "incomplete") delete next.missingRecordsNames;
      return next;
    });
  };
  const setFinancialPlan = (v: string) => {
    setB((prev) => {
      const next = { ...prev, financialPlan: v as DailyReportBody["financialPlan"] };
      if (v === "absent") delete next.financialPlanExecution;
      else if (v === "present") delete next.financialPlanAbsentReason;
      return next;
    });
  };

  return (
    <div className="space-y-4 text-right">
      {/* اسم المعهد — تلقائي */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs font-semibold text-slate-500">اسم المعهد</p>
        <p className="text-base font-bold text-slate-900 mt-0.5">{instituteName}</p>
      </div>

      <Section n={1} title="عدد الطلاب">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>إجمالي الطلاب</label>
            <input
              type="number"
              name="studentCount"
              min="0"
              value={b.studentCount ?? ""} onChange={(e) => set("studentCount", e.target.value === "" ? undefined : Number(e.target.value))}
              className={inputCls}
            />
          </div>
          {isMixed && (
            <>
              <div>
                <label className={labelCls}>عدد البنين</label>
                <input
                  type="number"
                  name="boysCount"
                  min="0"
                  value={b.boysCount ?? ""} onChange={(e) => set("boysCount", e.target.value === "" ? undefined : Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>عدد الفتيات</label>
                <input
                  type="number"
                  name="girlsCount"
                  min="0"
                  value={b.girlsCount ?? ""} onChange={(e) => set("girlsCount", e.target.value === "" ? undefined : Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </>
          )}
        </div>
        {isMixed && (
          <p className="text-[11px] text-slate-500 mt-1.5">
            المعهد «مشترك» — لذلك يُطلب تفصيل البنات والبنين.
          </p>
        )}
      </Section>

      <Section n={2} title="معلّم التربية الرياضية">
        <select name="peTeacherPresent" value={b.peTeacherPresent ?? ""} onChange={(e) => set("peTeacherPresent", e.target.value as DailyReportBody["peTeacherPresent"])} className={inputCls}>
          <>
            <option value="">-- اختر --</option>
            {ATTENDANCE.map((a) => (
            <option key={a} value={a}>
              {ATTENDANCE_LABELS[a]}
            </option>
          ))}
        </>
        </select>
      </Section>

      <Section n={3} title="الانتداب لمعهد آخر">
        <select name="seconded" value={b.seconded ?? ""} onChange={(e) => setSeconded(e.target.value)} className={inputCls}>
          <>
            <option value="">-- اختر --</option>
            {YES_NO.map((v) => (
            <option key={v} value={v}>
              {YES_NO_LABELS[v]}
            </option>
          ))}
        </>
        </select>
        {b.seconded === "yes" && (
          <div className="mt-2.5">
            <label className={labelCls}>اسم المعهد الآخر</label>
            <input
              type="text"
              name="secondedInstituteName"
              value={b.secondedInstituteName ?? ""} onChange={(e) => set("secondedInstituteName", e.target.value)}
              placeholder="اسم المعهد الآخر"
              className={inputCls}
            />
          </div>
        )}
      </Section>

      <Section n={4} title="عدد حصص التربية الرياضية">
        <input
          type="number"
          name="peLessonsCount"
          min="0"
          value={b.peLessonsCount ?? ""} onChange={(e) => set("peLessonsCount", e.target.value === "" ? undefined : Number(e.target.value))}
          className={inputCls}
        />
      </Section>

      <Section n={5} title="الالتزام بالزي الرياضي">
        <select name="uniformCompliant" value={b.uniformCompliant ?? ""} onChange={(e) => set("uniformCompliant", e.target.value as DailyReportBody["uniformCompliant"])} className={inputCls}>
          <>
            <option value="">-- اختر --</option>
            {YES_NO.map((v) => (
            <option key={v} value={v}>
              {YES_NO_LABELS[v]}
            </option>
          ))}
        </>
        </select>
      </Section>

      <Section n={6} title="الكشكول">
        <select name="recordBook" value={b.recordBook ?? ""} onChange={(e) => setRecordBook(e.target.value)} className={inputCls}>
          <>
            <option value="">-- اختر --</option>
            {EXISTENCE.map((v) => (
            <option key={v} value={v}>
              {EXISTENCE_LABELS[v]}
            </option>
          ))}
        </>
        </select>
        {b.recordBook === "present" && (
          <div className="mt-2.5">
            <label className={labelCls}>حالة الكشكول</label>
            <select
              name="recordBookCompleteness"
              value={b.recordBookCompleteness ?? ""}
              onChange={(e) =>
                set(
                  "recordBookCompleteness",
                  e.target.value as DailyReportBody["recordBookCompleteness"],
                )
              }
              className={inputCls}
            >
              <>
                <option value="">-- اختر --</option>
                {COMPLETENESS.map((v) => (
                <option key={v} value={v}>
                  {COMPLETENESS_LABELS[v]}
                </option>
              ))}
            </>
            </select>
          </div>
        )}
      </Section>

      <Section n={7} title="السجلات">
        <select name="records" value={b.records ?? ""} onChange={(e) => setRecords(e.target.value)} className={inputCls}>
          <>
            <option value="">-- اختر --</option>
            {EXISTENCE.map((v) => (
            <option key={v} value={v}>
              {EXISTENCE_LABELS[v]}
            </option>
          ))}
        </>
        </select>
        {b.records === "present" && (
          <div className="mt-2.5 space-y-2.5">
            <div>
              <label className={labelCls}>حالة السجلات</label>
              <select
                name="recordsCompleteness"
                value={b.recordsCompleteness ?? ""}
                onChange={(e) => setRecordsCompleteness(e.target.value)}
                className={inputCls}
              >
                <>
                  <option value="">-- اختر --</option>
                  {COMPLETENESS.map((v) => (
                  <option key={v} value={v}>
                    {COMPLETENESS_LABELS[v]}
                  </option>
                ))}
              </>
              </select>
            </div>
            {b.recordsCompleteness === "incomplete" && (
              <div>
                <label className={labelCls}>أسماء السجلات الناقصة</label>
                <textarea
                  name="missingRecordsNames"
                  rows={2}
                  value={b.missingRecordsNames ?? ""} onChange={(e) => set("missingRecordsNames", e.target.value)}
                  placeholder="مثال: سجل الحضور، سجل المتابعة"
                  className={inputCls}
                />
              </div>
            )}
          </div>
        )}
      </Section>

      <Section n={8} title="الخطة المالية">
        <select name="financialPlan" value={b.financialPlan ?? ""} onChange={(e) => setFinancialPlan(e.target.value)} className={inputCls}>
          <>
            <option value="">-- اختر --</option>
            {EXISTENCE.map((v) => (
            <option key={v} value={v}>
              {EXISTENCE_LABELS[v]}
            </option>
          ))}
        </>
        </select>
        {b.financialPlan === "absent" ? (
          <div className="mt-2.5">
            <label className={labelCls}>سبب عدم وجود الخطة</label>
            <textarea
              name="financialPlanAbsentReason"
              rows={2}
              value={b.financialPlanAbsentReason ?? ""} onChange={(e) => set("financialPlanAbsentReason", e.target.value)}
              className={inputCls}
            />
          </div>
        ) : (
          b.financialPlan === "present" && (
            <div className="mt-2.5">
              <label className={labelCls}>مدى التنفيذ</label>
              <select
                name="financialPlanExecution"
                value={b.financialPlanExecution ?? ""}
                onChange={(e) => set("financialPlanExecution", e.target.value as DailyReportBody["financialPlanExecution"])}
                className={inputCls}
              >
                <>
                  <option value="">-- اختر --</option>
                  {PLAN_EXECUTION.map((v) => (
                  <option key={v} value={v}>
                    {PLAN_EXECUTION_LABELS[v]}
                  </option>
                ))}
              </>
              </select>
            </div>
          )
        )}
      </Section>

      <Section n={9} title="الإيجابيات">
        <textarea name="positives" rows={2} value={b.positives ?? ""} onChange={(e) => set("positives", e.target.value)} className={inputCls} />
      </Section>

      <Section n={10} title="السلبيات">
        <textarea name="negatives" rows={2} value={b.negatives ?? ""} onChange={(e) => set("negatives", e.target.value)} className={inputCls} />
      </Section>

      <Section n={11} title="المقترحات">
        <textarea name="suggestions" rows={2} value={b.suggestions ?? ""} onChange={(e) => set("suggestions", e.target.value)} className={inputCls} />
      </Section>

      <Section n={12} title="ملاحظات عامة">
        <textarea name="generalNotes" rows={3} value={b.generalNotes ?? ""} onChange={(e) => set("generalNotes", e.target.value)} className={inputCls} />
      </Section>

      {/* بوابة الإرسال: لا يُرسل إلا باكتمال كل الحقول */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        {complete ? (
          <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            ✓ اكتمل التقرير — كل الحقول مملوءة، يمكنك الإرسال.
          </p>
        ) : (
          <div className="text-xs bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <p className="font-semibold text-amber-900 mb-1">
              لا يمكن الإرسال قبل اكتمال الحقول ({missing.length} ناقص):
            </p>
            <p className="text-amber-800 leading-relaxed">{missing.join("، ")}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="intent"
            value="submitted"
            disabled={pending || !complete}
            title={complete ? undefined : "أكمل كل الحقول أولًا"}
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition"
          >
            {pending ? "جارٍ الحفظ..." : "إرسال التقرير"}
          </button>
          <button
            type="submit"
            name="intent"
            value="draft"
            disabled={pending}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            حفظ كمسودة
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          يمكن حفظ مسودة في أي وقت، لكن الإرسال يتطلّب اكتمال كل الحقول.
        </p>
      </div>
    </div>
  );
}





