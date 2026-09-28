import type { PlanningRecordItem } from "./types";

interface Props {
  record: PlanningRecordItem;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

/** صف عرض سجل تخطيط واحد داخل القائمة. */
export function PlanningRecordRow({ record, canManage, onEdit, onDelete }: Props) {
  const isCentral =
    !record.region && !record.administration && !record.institute;

  // الإجراءات مكتوبة سطرًا بسطر
  const steps = (record.items ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const scopeLabel = isCentral
    ? "سجل مركزي"
    : (record.instituteName ??
      record.administrationName ??
      record.regionName ??
      "—");

  return (
    <article className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/60 transition">
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-900">{record.title}</h3>
          {record.academicYear && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
              {record.academicYear}
            </span>
          )}
          {record.status && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              {record.status}
            </span>
          )}
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${
              isCentral
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {scopeLabel}
          </span>
        </div>

        {record.content && (
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
            {record.content}
          </p>
        )}

        {steps.length > 0 && (
          <ol className="text-xs text-slate-700 space-y-1 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 list-decimal list-inside">
            {steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        )}

        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3">
          <span>أُضيف في: {record.createdAt || "—"}</span>
          {record.links && (
            <a
              href={record.links}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:underline font-semibold"
            >
              المصدر ↗
            </a>
          )}
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            تعديل
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition"
          >
            حذف
          </button>
        </div>
      )}
    </article>
  );
}