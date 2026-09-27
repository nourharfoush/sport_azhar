"use client";

import { useState } from "react";
import { SPORTS, type Role } from "@/types";
import { EventItem } from "./types";
import {
  createEventAction,
  updateEventAction,
  deleteEventAction,
} from "./actions";
import { EventTable } from "./EventTable";
import { CreateEventModal } from "./CreateEventModal";
import { EditEventModal } from "./EditEventModal";
import { DeleteEventModal } from "./DeleteEventModal";

interface EventListProps {
  events: EventItem[];
  userRole: Role;
  userRegionId: string | null;
  userAdminId: string | null;
  /** إدارات المستخدم (مطلوبة لدور المنطقة والإدارة العامة عند إنشاء تصفيات إدارية) */
  administrations: { _id: string; name: string }[];
  /** المناطق المتاحة للاختيار (للإدارة العامة فقط) */
  regions?: { _id: string; name: string }[];
}

export function EventList({
  events,
  userRole,
  userRegionId,
  userAdminId,
  administrations,
  regions = [],
}: EventListProps) {
  const canCreate = userRole !== "institute";

  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<EventItem | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** نفس منطق الصلاحيات المطبّق على السيرفر (lib/rbac -> canManageScopedItem). */
  const canManageEvent = (e: EventItem) => {
    if (userRole === "general") return true;
    if (userRole === "region") {
      return e.scope !== "general" && e.region === userRegionId;
    }
    if (userRole === "administration") {
      return e.scope === "administration" && e.administration === userAdminId;
    }
    return false;
  };

  const filteredEvents = events.filter((e) => {
    if (sportFilter !== "all" && e.sport !== sportFilter) return false;
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchDesc = e.description?.toLowerCase().includes(q) ?? false;
      const matchScope = `${e.regionName ?? ""} ${e.administrationName ?? ""}`
        .toLowerCase()
        .includes(q);
      if (!matchTitle && !matchDesc && !matchScope) return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createEventAction(formData);
    setFormLoading(false);
    if (!res.success) {
      setFormError(res.error || "فشل إنشاء الفعالية");
    } else {
      setCreateOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const res = await updateEventAction(formData);
    setFormLoading(false);
    if (!res.success) {
      setFormError(res.error || "فشل تعديل الفعالية");
    } else {
      setEditEvent(null);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const res = await deleteEventAction(formData);
    setFormLoading(false);
    if (!res.success) {
      setFormError(res.error || "فشل حذف الفعالية");
    } else {
      setDeleteEvent(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* شريط الإجراءات والبحث */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في البطولات والمسابقات..."
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />

          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">جميع الألعاب الرياضية</option>
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="published">معلنة</option>
            <option value="active">جارية</option>
            <option value="archived">مؤرشفة</option>
          </select>

          {(search || sportFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSportFilter("all");
                setStatusFilter("all");
              }}
              className="text-xs text-rose-600 hover:underline px-2 py-1 font-semibold"
            >
              إعادة ضبط
            </button>
          )}
        </div>

        {canCreate && (
          <button
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <span>+</span>
            <span>إطلاق بطولة جديدة</span>
          </button>
        )}
      </div>



      {/* قائمة البطولات */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            سجل البطولات والفعاليات المتاحة ({filteredEvents.length})
          </h2>
          {!canCreate && (
            <span className="text-[11px] text-slate-500">
              صلاحيتك: متابعة وتسجيل المشاركة فقط
            </span>
          )}
        </div>

        <EventTable
          events={filteredEvents}
          canManageEvent={canManageEvent}
          onEdit={(e) => {
            setFormError(null);
            setEditEvent(e);
          }}
          onDelete={(e) => {
            setFormError(null);
            setDeleteEvent(e);
          }}
        />
      </div>

      {/* النوافذ المنبثقة */}
      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={formLoading}
        error={formError}
        userRole={userRole}
        administrations={administrations}
        regions={regions}
      />

      <EditEventModal
        event={editEvent}
        onClose={() => setEditEvent(null)}
        onSubmit={handleEditSubmit}
        loading={formLoading}
        error={formError}
      />

      <DeleteEventModal
        event={deleteEvent}
        onClose={() => setDeleteEvent(null)}
        onSubmit={handleDeleteSubmit}
        loading={formLoading}
        error={formError}
      />
    </div>
  );
}
