"use client";

import { useState } from "react";
import {
  PLANNING_SECTION_LABELS,
  PLANNING_SECTIONS,
  type PlanningSection,
} from "@/types";
import type {
  PlanningInstituteOption,
  PlanningRecordItem,
} from "./types";
import {
  createPlanningRecordAction,
  updatePlanningRecordAction,
  deletePlanningRecordAction,
} from "./actions";
import { PlanningRecordModal } from "./PlanningRecordModal";
import { DeletePlanningRecordModal } from "./DeletePlanningRecordModal";
import { PlanningRecordRow } from "./PlanningRecordRow";

interface Props {
  /** سجلات مجمّعة حسب القسم. */
  recordsBySection: Record<string, PlanningRecordItem[]>;
  institutes: PlanningInstituteOption[];
  userRole: string;
  userRegionId: string | null;
  userAdminId: string | null;
  userInstituteId: string | null;
  /** الإدارة العامة تتيح السجلات المركزية. */
  allowCentral: boolean;
  /** محتوى تبويب «المتابعات الشهرية» (المكوّنات القائمة كما هي). */
  monthlyFollowupTab: React.ReactNode;
}

type ServerAction = (
  fd: FormData,
) => Promise<{ success: boolean; error?: string }>;

const TAB_ICONS: Record<PlanningSection, string> = {
  conferences: "🎓",
  time_plan: "🗓️",
  recommendations: "💡",
  monthly_followup: "📋",
  followup_reports: "📑",
  annual_reports: "📊",
  improvement_plans: "📈",
};

export function PlanningTabs({
  recordsBySection,
  institutes,
  userRole,
  userRegionId,
  userAdminId,
  userInstituteId,
  allowCentral,
  monthlyFollowupTab,
}: Props) {
  const [tab, setTab] = useState<PlanningSection>(PLANNING_SECTIONS[0]);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<PlanningRecordItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<PlanningRecordItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const rows = recordsBySection[tab] ?? [];
  const filtered = rows.filter((r) =>
    search.trim()
      ? `${r.title} ${r.content} ${r.items} ${r.instituteName ?? ""}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      : true,
  );

  /** نفس منطق الصلاحيات المطبّق على السيرفر (lib/rbac). */
  const canManageItem = (r: PlanningRecordItem) => {
    if (userRole === "general") return true;
    if (!r.region && !r.administration && !r.institute) return false;
    if (userRole === "region" || userRole === "technical")
      return r.region === userRegionId;
    if (userRole === "administration") return r.administration === userAdminId;
    if (userRole === "institute") return r.institute === userInstituteId;
    return false;
  };

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
        {PLANNING_SECTIONS.map((s) => {
          const count = (recordsBySection[s] ?? []).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => {
                setTab(s);
                setSearch("");
              }}
              className={`px-3.5 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition -mb-px ${
                tab === s
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span aria-hidden className="ml-1">
                {TAB_ICONS[s]}
              </span>
              {PLANNING_SECTION_LABELS[s]}
              <span className="text-[11px] text-slate-400 mr-1.5">({count})</span>
            </button>
          );
        })}
      </div>

      {/* تبويب «المتابعات الشهرية»: يعرض المحتوى القائم كما هو بلا تغيير */}
      {tab === "monthly_followup" ? (
        monthlyFollowupTab
      ) : (
        <>
      {/* شريط البحث والإضافة */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في السجلات..."
          className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white min-w-56"
        />
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setCreateOpen(true);
          }}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
        >
          <span>+</span>
          <span>إضافة سجل</span>
        </button>
      </div>

      {/* السجلات */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <p className="font-semibold text-slate-700">
              لا توجد سجلات في هذا القسم.
            </p>
            <p>ابدأ بإضافة أول سجل من الزر أعلى الصفحة.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <PlanningRecordRow
                key={r._id}
                record={r}
                canManage={canManageItem(r)}
                onEdit={() => {
                  setFormError(null);
                  setEditItem(r);
                }}
                onDelete={() => {
                  setFormError(null);
                  setDeleteItem(r);
                }}
              />
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {/* النوافذ */}
      {createOpen && (
        <PlanningRecordModal
          key="create"
          open
          item={null}
          section={tab}
          institutes={institutes}
          allowCentral={allowCentral}
          onClose={() => setCreateOpen(false)}
          onSubmit={(e) =>
            runAction(e, createPlanningRecordAction, () => setCreateOpen(false))
          }
          loading={formLoading}
          error={formError}
        />
      )}

      {editItem && (
        <PlanningRecordModal
          key={editItem._id}
          open
          item={editItem}
          section={editItem.section}
          institutes={institutes}
          allowCentral={allowCentral}
          onClose={() => setEditItem(null)}
          onSubmit={(e) =>
            runAction(e, updatePlanningRecordAction, () => setEditItem(null))
          }
          loading={formLoading}
          error={formError}
        />
      )}

      <DeletePlanningRecordModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onSubmit={(e) =>
          runAction(e, deletePlanningRecordAction, () => setDeleteItem(null))
        }
        loading={formLoading}
        error={formError}
      />
    </div>
  );
}