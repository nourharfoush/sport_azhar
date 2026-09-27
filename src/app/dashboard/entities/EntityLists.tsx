"use client";

import { useState, useMemo } from "react";
import type { RegionItem, AdministrationItem, InstituteItem } from "./types";
import { RegionModals } from "./RegionModals";
import { AdminModals } from "./AdminModals";
import { InstituteModals } from "./InstituteModals";
import { RegionsTable } from "./RegionsTable";
import { AdminsTable } from "./AdminsTable";
import { InstitutesTable } from "./InstitutesTable";

export interface EntityListsProps {
  role: string;
  userRegionId?: string | null;
  userAdminId?: string | null;
  regions: RegionItem[];
  administrations: AdministrationItem[];
  institutes: InstituteItem[];
}

export function EntityLists({
  role,
  userRegionId,
  userAdminId,
  regions,
  administrations,
  institutes,
}: EntityListsProps) {
  const [activeTab, setActiveTab] = useState<"regions" | "admins" | "institutes">(
    role === "general" ? "regions" : role === "region" ? "admins" : "institutes",
  );

  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [adminFilter, setAdminFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [regionModal, setRegionModal] = useState<{
    type: "createRegion" | "editRegion" | "deleteRegion" | null;
    data?: any;
  }>({ type: null });

  const [adminModal, setAdminModal] = useState<{
    type: "createAdmin" | "editAdmin" | "deleteAdmin" | null;
    data?: any;
  }>({ type: null });

  const [instituteModal, setInstituteModal] = useState<{
    type: "createInstitute" | "editInstitute" | "deleteInstitute" | null;
    data?: any;
  }>({ type: null });

  const administrationsCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of administrations) {
      const rId = typeof a.region === "object" ? a.region?._id : a.region;
      if (rId) map[rId] = (map[rId] || 0) + 1;
    }
    return map;
  }, [administrations]);

  const institutesCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const i of institutes) {
      const aId = typeof i.administration === "object" ? i.administration?._id : i.administration;
      if (aId) map[aId] = (map[aId] || 0) + 1;
    }
    return map;
  }, [institutes]);

  const filteredRegions = useMemo(() => {
    return regions.filter((r) => {
      if (!searchQuery.trim()) return true;
      return (
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [regions, searchQuery]);

  const filteredAdmins = useMemo(() => {
    return administrations.filter((a) => {
      const parentRegionId = typeof a.region === "object" ? a.region?._id : a.region;
      if (regionFilter !== "all" && parentRegionId !== regionFilter) return false;
      if (!searchQuery.trim()) return true;
      const parentRegionName = typeof a.region === "object" ? a.region?.name : "";
      return (
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parentRegionName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [administrations, regionFilter, searchQuery]);

  const filteredInstitutes = useMemo(() => {
    return institutes.filter((i) => {
      const adminObj = typeof i.administration === "object" ? i.administration : null;
      const parentAdminId = adminObj?._id || (typeof i.administration === "string" ? i.administration : "");
      const parentRegionId =
        typeof adminObj?.region === "object" ? adminObj.region?._id : adminObj?.region;

      if (regionFilter !== "all" && parentRegionId !== regionFilter) return false;
      if (adminFilter !== "all" && parentAdminId !== adminFilter) return false;
      if (stageFilter !== "all" && i.stage !== stageFilter) return false;

      if (!searchQuery.trim()) return true;
      const adminName = adminObj?.name || "";
      return (
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        adminName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [institutes, regionFilter, adminFilter, stageFilter, searchQuery]);

  const canManageRegions = role === "general";
  const canManageAdmins = role === "general" || role === "region";
  const canManageInstitutes =
    role === "general" || role === "region" || role === "administration";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {role === "general" && (
            <button
              onClick={() => setActiveTab("regions")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "regions"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>المناطق الأزهرية</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "regions" ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"}`}>
                {regions.length}
              </span>
            </button>
          )}

          {canManageAdmins && (
            <button
              onClick={() => setActiveTab("admins")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === "admins"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>الإدارات التعليمية</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "admins" ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"}`}>
                {administrations.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("institutes")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === "institutes"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>المعاهد الأزهرية</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === "institutes" ? "bg-emerald-800 text-emerald-100" : "bg-slate-200 text-slate-700"}`}>
              {institutes.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "regions" && canManageRegions && (
            <button
              onClick={() => setRegionModal({ type: "createRegion" })}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <span>+</span>
              <span>إضافة منطقة جديدة</span>
            </button>
          )}

          {activeTab === "admins" && canManageAdmins && (
            <button
              onClick={() => setAdminModal({ type: "createAdmin" })}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <span>+</span>
              <span>إضافة إدارة تعليمية</span>
            </button>
          )}

          {activeTab === "institutes" && canManageInstitutes && (
            <button
              onClick={() => setInstituteModal({ type: "createInstitute" })}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <span>+</span>
              <span>إضافة معهد أزهري</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو الكود..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>

        {role === "general" && (activeTab === "admins" || activeTab === "institutes") && (
          <select
            value={regionFilter}
            onChange={(e) => {
              setRegionFilter(e.target.value);
              setAdminFilter("all");
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">جميع المناطق</option>
            {regions.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        )}

        {activeTab === "institutes" && (role === "general" || role === "region") && (
          <select
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">جميع الإدارات</option>
            {administrations
              .filter((a) => {
                if (regionFilter === "all") return true;
                const parentRegionId = typeof a.region === "object" ? a.region?._id : a.region;
                return parentRegionId === regionFilter;
              })
              .map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
          </select>
        )}

        {activeTab === "institutes" && (
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="all">جميع المراحل</option>
            <option value="الابتدائي">الابتدائي</option>
            <option value="الإعدادي">الإعدادي</option>
            <option value="الثانوي">الثانوي</option>
          </select>
        )}

        {(searchQuery || regionFilter !== "all" || adminFilter !== "all" || stageFilter !== "all") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setRegionFilter("all");
              setAdminFilter("all");
              setStageFilter("all");
            }}
            className="text-xs text-rose-600 hover:underline px-2 py-1 font-semibold"
          >
            إعادة ضبط
          </button>
        )}
      </div>

      {activeTab === "regions" && role === "general" && (
        <RegionsTable
          filteredRegions={filteredRegions}
          administrationsCountMap={administrationsCountMap}
          onEdit={(r) => setRegionModal({ type: "editRegion", data: r })}
          onDelete={(r, count) =>
            setRegionModal({ type: "deleteRegion", data: { ...r, adminsCount: count } })
          }
        />
      )}

      {activeTab === "admins" && canManageAdmins && (
        <AdminsTable
          filteredAdmins={filteredAdmins}
          regions={regions}
          institutesCountMap={institutesCountMap}
          onEdit={(a) => setAdminModal({ type: "editAdmin", data: a })}
          onDelete={(a, count) =>
            setAdminModal({ type: "deleteAdmin", data: { ...a, institutesCount: count } })
          }
        />
      )}

      {activeTab === "institutes" && (
        <InstitutesTable
          filteredInstitutes={filteredInstitutes}
          canManageInstitutes={canManageInstitutes}
          onEdit={(i) => setInstituteModal({ type: "editInstitute", data: i })}
          onDelete={(i) => setInstituteModal({ type: "deleteInstitute", data: i })}
        />
      )}

      <RegionModals
        modalState={regionModal}
        onClose={() => setRegionModal({ type: null })}
      />

      <AdminModals
        role={role}
        userRegionId={userRegionId || undefined}
        regions={regions}
        modalState={adminModal}
        onClose={() => setAdminModal({ type: null })}
      />

      <InstituteModals
        role={role}
        userAdminId={userAdminId || undefined}
        administrations={administrations}
        modalState={instituteModal}
        onClose={() => setInstituteModal({ type: null })}
      />
    </div>
  );
}

