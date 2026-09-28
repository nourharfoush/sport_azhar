"use client";

import { useState } from "react";
import type { RefKind } from "@/models/SportsReference";
import type { SportsRefItem } from "./types";
import {
  createSportsRefAction,
  updateSportsRefAction,
  deleteSportsRefAction,
} from "./actions";
import { SportsRefModal } from "./SportsRefModal";
import { DeleteSportsRefModal } from "./DeleteSportsRefModal";

interface Props {
  pitches: SportsRefItem[];
  equipment: SportsRefItem[];
  /** الإدارة العامة فقط تعدّل؛ والباقي مشاهدة. */
  canManage: boolean;
}

const TABS: { key: RefKind; label: string; icon: string }[] = [
  { key: "pitch", label: "مقاييس الملاعب", icon: "🏟️" },
  { key: "equipment", label: "مواصفات الأجهزة الرياضية", icon: "🏋️" },
];

type ServerAction = (
  fd: FormData,
) => Promise<{ success: boolean; error?: string }>;

export function SportsRefsList({ pitches, equipment, canManage }: Props) {
  const [tab, setTab] = useState<RefKind>("pitch");
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<SportsRefItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<SportsRefItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const rows = tab === "pitch" ? pitches : equipment;
  const sports = [...new Set(rows.map((r) => r.sport))].sort((a, b) =>
    a.localeCompare(b, "ar"),
  );

  const filtered = rows.filter((r) => {
    if (sportFilter !== "all" && r.sport !== sportFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const hay = `${r.name} ${r.sport} ${r.specifications} ${r.notes} ${r.dimensions}`
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const runAction = async (
    e: React.FormEvent<HTMLFormElement>,
    action: ServerAction,
    onDone: () => void,
  ) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    const res = await action(new FormData(e.currentTarget));
    setFormLoading(false);
    if (!res.success) setFormError(res.error || "تعذّر حفظ البيانات.");
    else onDone();
  };

  return (
    <div className="space-y-5">
      {/* التبويبات */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {TABS.map((t) => {
          const count = t.key === "pitch" ? pitches.length : equipment.length;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setSearch("");
                setSportFilter("all");
              }}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition -mb-px ${
                tab === t.key
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span aria-hidden className="ml-1.5">
                {t.icon}
              </span>
              {t.label}
              <span className="text-[11px] text-slate-400 mr-1.5">({count})</span>
            </button>
          );
        })}
      </div>

      {/* البحث + الإضافة */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white min-w-56"
          />
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
            aria-label="فلتر اللعبة"
          >
            <option value="all">كل الألعاب</option>
            {sports.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
          >
            <span>+</span>
            <span>{tab === "pitch" ? "إضافة مقاس ملعب" : "إضافة مواصفة جهاز"}</span>
          </button>
        )}
      </div>

      {/* الجدول */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <p className="font-semibold text-slate-700">لا توجد سجلات لعرضها.</p>
            <p>
              {canManage
                ? "ابدأ بإضافة أول سجل من الزر أعلى الصفحة."
                : "لم تُسجَّل بيانات في هذا القسم بعد."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <div
                key={r._id}
                className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/60 transition"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-bold text-slate-900">{r.name}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {r.sport}
                    </span>
                    {r.dimensions && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        {r.dimensions}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                    {r.surfaceType && (
                      <span>
                        نوع السطح: <strong>{r.surfaceType}</strong>
                      </span>
                    )}
                    {r.quantity && (
                      <span>
                        الكمية: <strong>{r.quantity}</strong>
                      </span>
                    )}
                  </div>
                  {r.specifications && (
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {r.specifications}
                    </p>
                  )}
                  {r.notes && (
                    <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">
                      {r.notes}
                    </p>
                  )}
                  {r.diagramUrl && (
                    <a
                      href={r.diagramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-emerald-700 hover:underline font-semibold"
                    >
                      عرض المخطط ↗
                    </a>
                  )}
                </div>

                {canManage && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setEditItem(r);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setDeleteItem(r);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition"
                    >
                      حذف
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!canManage && (
        <p className="text-[11px] text-slate-500">
          هذا القسم للمراجعة فقط. الإضافة والتعديل والحذف من اختصاص الإدارة العامة.
        </p>
      )}

      {/* النوافذ */}
      {createOpen && (
        <SportsRefModal
          key="create"
          open
          item={null}
          kind={tab}
          onClose={() => setCreateOpen(false)}
          onSubmit={(e) =>
            runAction(e, createSportsRefAction, () => setCreateOpen(false))
          }
          loading={formLoading}
          error={formError}
        />
      )}

      {editItem && (
        <SportsRefModal
          key={editItem._id}
          open
          item={editItem}
          kind={editItem.kind}
          onClose={() => setEditItem(null)}
          onSubmit={(e) =>
            runAction(e, updateSportsRefAction, () => setEditItem(null))
          }
          loading={formLoading}
          error={formError}
        />
      )}

      <DeleteSportsRefModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onSubmit={(e) =>
          runAction(e, deleteSportsRefAction, () => setDeleteItem(null))
        }
        loading={formLoading}
        error={formError}
      />
    </div>
  );
}