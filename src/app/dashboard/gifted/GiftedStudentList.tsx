"use client";

import { useState } from "react";
import type { Role } from "@/types";
import type { GiftedInstituteOption, GiftedStudentItem } from "./types";
import {
  createGiftedAction,
  updateGiftedAction,
  deleteGiftedAction,
} from "./actions";
import { GiftedStudentCard } from "./GiftedStudentCard";
import { GiftedStudentModal } from "./GiftedStudentModal";
import { DeleteGiftedModal } from "./DeleteGiftedModal";
import { GiftedFiltersBar, type GiftedFilters } from "./GiftedFiltersBar";

interface Props {
  students: GiftedStudentItem[];
  institutes: GiftedInstituteOption[];
  userRole: Role;
  userRegionId: string | null;
  userAdminId: string | null;
  userInstituteId: string | null;
  canCreate: boolean;
}

const EMPTY_FILTERS: GiftedFilters = {
  search: "",
  category: "all",
  sport: "all",
  gender: "all",
  grade: "all",
  institute: "all",
};

type ServerAction = (
  fd: FormData,
) => Promise<{ success: boolean; error?: string }>;

export function GiftedStudentList({
  students,
  institutes,
  userRole,
  userRegionId,
  userAdminId,
  userInstituteId,
  canCreate,
}: Props) {
  const [filters, setFilters] = useState<GiftedFilters>(EMPTY_FILTERS);
  const [createOpen, setCreateOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<GiftedStudentItem | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<GiftedStudentItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** نفس منطق الصلاحيات المطبّق على السيرفر (lib/rbac -> canManageGiftedItem). */
  const canManageItem = (s: GiftedStudentItem) => {
    if (userRole === "general") return true;
    if (userRole === "region") return s.region === userRegionId;
    if (userRole === "administration") return s.administration === userAdminId;
    if (userRole === "institute") return s.institute === userInstituteId;
    return false;
  };

  const filtered = students.filter((s) => {
    if (filters.category !== "all" && s.category !== filters.category) return false;
    if (filters.sport !== "all" && s.sport !== filters.sport) return false;
    if (filters.gender !== "all" && s.gender !== filters.gender) return false;
    if (filters.grade !== "all" && s.grade !== filters.grade) return false;
    if (filters.institute !== "all" && s.institute !== filters.institute) return false;
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const haystack = [
        s.fullName,
        s.nationalId,
        s.instituteName ?? "",
        s.administrationName ?? "",
        s.regionName ?? "",
        s.sport,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <GiftedFiltersBar
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
          institutes={institutes}
          hasFilters={hasFilters}
        />

        {canCreate && (
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0"
          >
            <span>+</span>
            <span>إضافة طالب موهوب</span>
          </button>
        )}
      </div>

      {canCreate && institutes.length === 0 && (
        <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2">
          لا توجد معاهد مرتبطة بحسابك. أضف المعاهد من صفحة «الهيكل التنظيمي»
          قبل تسجيل الطلاب الموهوبين.
        </p>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold text-slate-900 text-sm">
            الطلاب الموهوبون في نطاقك ({filtered.length})
          </h2>
          <span className="text-[11px] text-slate-500">
            إجمالي المسجَّلين: {students.length}
          </span>
        </div>

        <GiftedStudentCard
          students={filtered}
          canManageItem={canManageItem}
          onEdit={(s) => {
            setFormError(null);
            setEditStudent(s);
          }}
          onDelete={(s) => {
            setFormError(null);
            setDeleteStudent(s);
          }}
        />
      </div>

      {createOpen && (
        <GiftedStudentModal
          key="create"
          open
          student={null}
          institutes={institutes}
          onClose={() => setCreateOpen(false)}
          onSubmit={(e) =>
            runAction(e, createGiftedAction, () => setCreateOpen(false))
          }
          loading={formLoading}
          error={formError}
        />
      )}

      {editStudent && (
        <GiftedStudentModal
          key={editStudent._id}
          open
          student={editStudent}
          institutes={institutes}
          onClose={() => setEditStudent(null)}
          onSubmit={(e) =>
            runAction(e, updateGiftedAction, () => setEditStudent(null))
          }
          loading={formLoading}
          error={formError}
        />
      )}

      <DeleteGiftedModal
        student={deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onSubmit={(e) =>
          runAction(e, deleteGiftedAction, () => setDeleteStudent(null))
        }
        loading={formLoading}
        error={formError}
      />
    </div>
  );
}