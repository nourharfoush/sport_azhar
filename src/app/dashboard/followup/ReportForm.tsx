"use client";

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
  type YesNo,
  type Attendance,
  type Existence,
  type Completeness,
  type PlanExecution,
} from "@/types";

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
 * - اسم المعهد يظهر تلقائيًا (غير قابل للتعديل).
 * - حقول «مشترك» و«غير موجود» تظهر شرطًا حسب الاختيارات السابقة.
 */
export function ReportFormFields({
  instituteName,
  instituteType,
  body,
}: {
  instituteName: string;
  instituteType: string;
  body: DailyReportBody;
}) {
  const b = body ?? {};
  const isMixed = instituteType === "مشترك";

  const yn = (v: YesNo | undefined) => v ?? "no";
  const att = (v: Attendance | undefined) => v ?? "present";
  const ex = (v: Existence | undefined) => v ?? "present";
  const comp = (v: Completeness | undefined) => v ?? "complete";

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
              defaultValue={b.studentCount ?? ""}
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
                  defaultValue={b.boysCount ?? ""}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>عدد الفتيات</label>
                <input
                  type="number"
                  name="girlsCount"
                  min="0"
                  defaultValue={b.girlsCount ?? ""}
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
        <select name="peTeacherPresent" defaultValue={att(b.peTeacherPresent)} className={inputCls}>
          {ATTENDANCE.map((a) => (
            <option key={a} value={a}>
              {ATTENDANCE_LABELS[a]}
            </option>
          ))}
        </select>
      </Section>

      <Section n={3} title="الانتداب لمعهد آخر">
        <select name="seconded" defaultValue={yn(b.seconded)} className={inputCls}>
          {YES_NO.map((v) => (
            <option key={v} value={v}>
              {YES_NO_LABELS[v]}
            </option>
          ))}
        </select>
        {b.seconded === "yes" && (
          <div className="mt-2.5">
            <label className={labelCls}>اسم المعهد الآخر</label>
            <input
              type="text"
              name="secondedInstituteName"
              defaultValue={b.secondedInstituteName ?? ""}
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
          defaultValue={b.peLessonsCount ?? ""}
          className={inputCls}
        />
      </Section>

      <Section n={5} title="الالتزام بالزي الرياضي">
        <select name="uniformCompliant" defaultValue={yn(b.uniformCompliant)} className={inputCls}>
          {YES_NO.map((v) => (
            <option key={v} value={v}>
              {YES_NO_LABELS[v]}
            </option>
          ))}
        </select>
      </Section>

      <Section n={6} title="الكشكول">
        <select name="recordBook" defaultValue={ex(b.recordBook)} className={inputCls}>
          {EXISTENCE.map((v) => (
            <option key={v} value={v}>
              {EXISTENCE_LABELS[v]}
            </option>
          ))}
        </select>
        {b.recordBook === "present" && (
          <div className="mt-2.5">
            <label className={labelCls}>حالة الكشكول</label>
            <select
              name="recordBookCompleteness"
              defaultValue={comp(b.recordBookCompleteness)}
              className={inputCls}
            >
              {COMPLETENESS.map((v) => (
                <option key={v} value={v}>
                  {COMPLETENESS_LABELS[v]}
                </option>
              ))}
            </select>
          </div>
        )}
      </Section>

      <Section n={7} title="السجلان">
        <select name="records" defaultValue={ex(b.records)} className={inputCls}>
          {EXISTENCE.map((v) => (
            <option key={v} value={v}>
              {EXISTENCE_LABELS[v]}
            </option>
          ))}
        </select>
        {b.records === "present" && (
          <div className="mt-2.5 space-y-2.5">
            <div>
              <label className={labelCls}>حالة السجلين</label>
              <select
                name="recordsCompleteness"
                defaultValue={comp(b.recordsCompleteness)}
                className={inputCls}
              >
                {COMPLETENESS.map((v) => (
                  <option key={v} value={v}>
                    {COMPLETENESS_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
            {b.recordsCompleteness === "incomplete" && (
              <div>
                <label className={labelCls}>أسماء السجلات الناقصة</label>
                <textarea
                  name="missingRecordsNames"
                  rows={2}
                  defaultValue={b.missingRecordsNames ?? ""}
                  placeholder="مثال: سجل الحضور، سجل المتابعة"
                  className={inputCls}
                />
              </div>
            )}
          </div>
        )}
      </Section>

      <Section n={8} title="الخطة المالية">
        <select name="financialPlan" defaultValue={ex(b.financialPlan)} className={inputCls}>
          {EXISTENCE.map((v) => (
            <option key={v} value={v}>
              {EXISTENCE_LABELS[v]}
            </option>
          ))}
        </select>
        {b.financialPlan === "absent" ? (
          <div className="mt-2.5">
            <label className={labelCls}>سبب عدم وجود الخطة</label>
            <textarea
              name="financialPlanAbsentReason"
              rows={2}
              defaultValue={b.financialPlanAbsentReason ?? ""}
              className={inputCls}
            />
          </div>
        ) : (
          b.financialPlan === "present" && (
            <div className="mt-2.5">
              <label className={labelCls}>مدى التنفيذ</label>
              <select
                name="financialPlanExecution"
                defaultValue={(b.financialPlanExecution as PlanExecution | undefined) ?? "full"}
                className={inputCls}
              >
                {PLAN_EXECUTION.map((v) => (
                  <option key={v} value={v}>
                    {PLAN_EXECUTION_LABELS[v]}
                  </option>
                ))}
              </select>
            </div>
          )
        )}
      </Section>

      <Section n={9} title="الإيجابيات">
        <textarea name="positives" rows={2} defaultValue={b.positives ?? ""} className={inputCls} />
      </Section>

      <Section n={10} title="السلبيات">
        <textarea name="negatives" rows={2} defaultValue={b.negatives ?? ""} className={inputCls} />
      </Section>

      <Section n={11} title="المقترحات">
        <textarea name="suggestions" rows={2} defaultValue={b.suggestions ?? ""} className={inputCls} />
      </Section>

      <Section n={12} title="ملاحظات عامة">
        <textarea name="generalNotes" rows={3} defaultValue={b.generalNotes ?? ""} className={inputCls} />
      </Section>
    </div>
  );
}
