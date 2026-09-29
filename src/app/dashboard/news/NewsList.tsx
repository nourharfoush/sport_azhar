"use client";

import { useState } from "react";
import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_LABELS,
  isGeneralOnlyCategory,
  type Role,
} from "@/types";
import { NewsItem } from "./types";
import {
  createNewsAction,
  updateNewsAction,
  deleteNewsAction,
} from "./actions";
import { NewsTable } from "./NewsTable";
import { CreateNewsModal } from "./CreateNewsModal";
import { EditNewsModal } from "./EditNewsModal";
import { DeleteNewsModal } from "./DeleteNewsModal";

interface NewsListProps {
  news: NewsItem[];
  userRole: Role;
  userRegionId: string | null;
  userAdminId: string | null;
  canCreate: boolean;
}

export function NewsList({
  news,
  userRole,
  userRegionId,
  userAdminId,
  canCreate,
}: NewsListProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editNews, setEditNews] = useState<NewsItem | null>(null);
  const [deleteNews, setDeleteNews] = useState<NewsItem | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /**
   * نفس منطق الصلاحيات المطبّق على السيرفر
   * (lib/rbac -> canManageNewsItem): النطاق + حصر تصنيفات الإدارة العامة.
   */
  const canManageNewsItem = (n: NewsItem) => {
    // دليل العمل وضوابط وتعليمات: للإدارة العامة وحدها
    if (isGeneralOnlyCategory(n.category)) return userRole === "general";
    if (userRole === "general") return true;
    if (userRole === "region" || userRole === "technical") {
      return n.scope !== "general" && n.region === userRegionId;
    }
    if (userRole === "administration") {
      return n.scope === "administration" && n.administration === userAdminId;
    }
    return false;
  };

  const filteredNews = news.filter((n) => {
    if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
    if (scopeFilter !== "all" && n.scope !== scopeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchScope = `${n.regionName ?? ""} ${n.administrationName ?? ""}`
        .toLowerCase()
        .includes(q);
      if (!matchTitle && !matchContent && !matchScope) return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const res = await createNewsAction(formData);
    setFormLoading(false);
    if (!res.success) {
      setFormError(res.error || "فشل إضافة الخبر");
    } else {
      setCreateOpen(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const res = await updateNewsAction(formData);
    setFormLoading(false);
    if (!res.success) {
      setFormError(res.error || "فشل تعديل الخبر");
    } else {
      setEditNews(null);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    const formData = new FormData(e.currentTarget);
    const res = await deleteNewsAction(formData);
    setFormLoading(false);
    if (!res.success) {
      setFormError(res.error || "فشل حذف الخبر");
    } else {
      setDeleteNews(null);
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
            placeholder="بحث في الأخبار والتعميمات..."
            className="w-full sm:w-64 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">جميع التصنيفات</option>
            {NEWS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {NEWS_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">جميع النطاقات</option>
            <option value="general">مركزي عام</option>
            <option value="region">منطقة أزهرية</option>
            <option value="administration">إدارة تعليمية</option>
          </select>

          {(search || categoryFilter !== "all" || scopeFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setScopeFilter("all");
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
            <span>إضافة خبر / تعميم</span>
          </button>
        )}
      </div>



      {/* قائمة الأخبار */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            سجل الأخبار والتعميمات المتاحة ({filteredNews.length})
          </h2>
          {!canCreate && (
            <span className="text-[11px] text-slate-500">
              صلاحيتك: الاطلاع على الأخبار المنشورة فقط
            </span>
          )}
        </div>

        <NewsTable
          news={filteredNews}
          canManageNewsItem={canManageNewsItem}
          onEdit={(n) => {
            setFormError(null);
            setEditNews(n);
          }}
          onDelete={(n) => {
            setFormError(null);
            setDeleteNews(n);
          }}
        />
      </div>

      {/* النوافذ المنبثقة */}
      <CreateNewsModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={formLoading}
        error={formError}
        userRole={userRole}
      />

      <EditNewsModal
        key={editNews?._id ?? "empty"}
        news={editNews}
        onClose={() => setEditNews(null)}
        onSubmit={handleEditSubmit}
        loading={formLoading}
        error={formError}
        userRole={userRole}
      />

      <DeleteNewsModal
        news={deleteNews}
        onClose={() => setDeleteNews(null)}
        onSubmit={handleDeleteSubmit}
        loading={formLoading}
        error={formError}
      />
    </div>
  );
}
