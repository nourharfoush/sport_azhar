"use client";

import { useMemo, useState } from "react";
import { ActionModal } from "../entities/ActionModal";
import { ROLE_LABELS, ROLES, type Role, displayName } from "@/types";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  resetUserPasswordAction,
} from "./actions";
import type {
  UserRow,
  RegionOption,
  AdministrationOption,
  InstituteOption,
} from "./types";

/** الأدوار المتاحة للمنشئ الحالي في القائمة. */
export function roleOptionsFor(managerRole: Role): Role[] {
  if (managerRole === "general") return ["region", "administration", "institute"];
  if (managerRole === "region") return ["region", "administration", "institute"];
  if (managerRole === "administration") return ["administration", "institute"];
  return ["institute"];
}

export interface UsersClientProps {
  currentUserId: string;
  managerRole: Role;
  managerRegionId: string | null;
  managerAdminId: string | null;
  users: UserRow[];
  regions: RegionOption[];
  administrations: AdministrationOption[];
  institutes: InstituteOption[];
}

export interface WorkplaceInit {
  role: Role | "";
  regionId: string;
  adminId: string;
  instituteId: string;
}

export interface WorkplaceFieldsProps {
  managerRole: Role;
  managerRegionId: string | null;
  managerAdminId: string | null;
  regions: RegionOption[];
  administrations: AdministrationOption[];
  institutes: InstituteOption[];
  prefix: string;
  init?: Partial<WorkplaceInit>;
}

/**
 * حقول الوظيفة ومكان العمل المتسلسلة (وظيفة ← منطقة ← إدارة ← معهد)
 * حسب دور المنشئ الحالي.
 */
export function WorkplaceFields(props: WorkplaceFieldsProps) {
  const {
    managerRole,
    managerRegionId,
    managerAdminId,
    regions,
    administrations,
    institutes,
    prefix,
    init,
  } = props;
  const availableRoles = useMemo(
    () => roleOptionsFor(managerRole),
    [managerRole],
  );
  const [selRole, setSelRole] = useState<Role | "">(init?.role ?? "");
  const [selRegion, setSelRegion] = useState(init?.regionId ?? "");
  const [selAdmin, setSelAdmin] = useState(init?.adminId ?? "");

  // خيارات الإدارة المتاحة: للعامة حسب المنطقة المختارة، وللمنطقة إدارات منطقته
  const adminOptions =
    managerRole === "general"
      ? selRegion
        ? administrations.filter((a) => a.regionId === selRegion)
        : administrations
      : administrations;

  // خيارات المعاهد المتاحة حسب الإدارة المختارة/الثابتة
  const currentAdminId =
    managerRole === "administration"
      ? (managerAdminId ?? "")
      : selAdmin || (init?.adminId ?? "");
  const instituteOptions = currentAdminId
    ? institutes.filter((i) => i.administrationId === currentAdminId)
    : [];

  // هل يظهر اختيار المنطقة للعامة (خطوة وسيطة لمستوى إدارة/معهد)
  const showRegionPicker =
    selRole &&
    selRole !== "general" &&
    managerRole === "general" &&
    (selRole === "region" || selAdmin === "");

  return (
    <>
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          الوظيفة / المستوى *
        </label>
        <select
          name="role"
          required
          value={selRole}
          onChange={(e) => {
            const r = e.target.value as Role | "";
            setSelRole(r);
            setSelRegion("");
            setSelAdmin("");
          }}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
        >
          <option value="">-- اختر الوظيفة --</option>
          {availableRoles.map((r) => (
            <option key={`${prefix}-r-${r}`} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      {showRegionPicker && (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            المنطقة الأزهرية {selRole === "region" ? "*" : "(اختياري لتصفية الإدارات)"}
          </label>
          <select
            name={selRole === "region" ? "regionId" : undefined}
            required={selRole === "region"}
            value={selRegion}
            onChange={(e) => {
              setSelRegion(e.target.value);
              setSelAdmin("");
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
          >
            <option value="">-- اختر المنطقة --</option>
            {regions.map((r) => (
              <option key={`${prefix}-rg-${r._id}`} value={r._id}>
                {r.name} ({r.code})
              </option>
            ))}
          </select>
        </div>
      )}

      {managerRole !== "general" && selRole === "region" && (
        <input type="hidden" name="regionId" value={managerRegionId || ""} />
      )}

      {selRole === "administration" && (managerRole === "region" ||
        (managerRole === "general" && (selRegion || adminOptions.length))) && (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            الإدارة التعليمية *{managerRole === "region" ? " (من منطقتك فقط)" : ""}
          </label>
          <select
            name="administrationId"
            required
            value={selAdmin}
            onChange={(e) => setSelAdmin(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
          >
            <option value="">-- اختر الإدارة --</option>
            {adminOptions.map((a) => (
              <option key={`${prefix}-ad-${a._id}`} value={a._id}>
                {a.name} {a.regionName ? `(${a.regionName})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {selRole === "administration" && managerRole === "administration" && (
        <input type="hidden" name="administrationId" value={managerAdminId || ""} />
      )}

      {selRole === "institute" && managerRole !== "administration" && (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            الإدارة التعليمية *
          </label>
          <select
            value={selAdmin}
            onChange={(e) => setSelAdmin(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
          >
            <option value="">-- اختر الإدارة أولاً --</option>
            {adminOptions.map((a) => (
              <option key={`${prefix}-ai-${a._id}`} value={a._id}>
                {a.name} {a.regionName ? `(${a.regionName})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {selRole === "institute" && managerRole === "administration" && (
        <input type="hidden" name="administrationId" value={managerAdminId || ""} />
      )}

      {selRole === "institute" && (
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            المعهد الأزهري *
          </label>
          <select
            name="instituteId"
            required
            defaultValue={init?.instituteId ?? ""}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-600/30"
          >
            <option value="">-- اختر المعهد --</option>
            {instituteOptions.map((i) => (
              <option key={`${prefix}-in-${i._id}`} value={i._id}>
                {i.name} ({i.stage})
              </option>
            ))}
          </select>
          {managerRole !== "administration" && !currentAdminId && (
            <p className="text-[11px] text-slate-500 mt-1">اختر الإدارة أولاً لعرض معاهدها.</p>
          )}
        </div>
      )}
    </>
  );
}


/** جدول المستخدمين + نوافذ الإضافة/التعديل/الحذف/تغيير كلمة المرور. */
export function UsersClient({
  currentUserId,
  managerRole,
  managerRegionId,
  managerAdminId,
  users,
  regions,
  administrations,
  institutes,
}: UsersClientProps) {
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [resetUser, setResetUser] = useState<UserRow | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !u.name.toLowerCase().includes(q) &&
          !u.email.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [users, roleFilter, search]);

  const sharedProps = {
    managerRole,
    managerRegionId,
    managerAdminId,
    regions,
    administrations,
    institutes,
  };

  return (
    <div className="space-y-4">
      {/* شريط الأدوات */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white"
        >
          <option value="all">جميع الوظائف</option>
          {ROLES.filter((r) => r !== "general").map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
        >
          <span>+</span>
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>


      {/* الجدول */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">
            قائمة المستخدمين في نطاقك ({filtered.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                <th className="py-3 px-4">الاسم</th>
                <th className="py-3 px-4">البريد الإلكتروني</th>
                <th className="py-3 px-4">الوظيفة</th>
                <th className="py-3 px-4">مكان العمل</th>
                <th className="py-3 px-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    لا يوجد مستخدمون مطابقون للبحث.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isSelf = u._id === currentUserId;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {displayName(u.name)}
                        {isSelf && (
                          <span className="mr-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            حسابك
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700" dir="ltr">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{u.workplace}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setEditUser(u)}
                            disabled={isSelf}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => setResetUser(u)}
                            disabled={isSelf}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            كلمة المرور
                          </button>
                          <button
                            onClick={() => setDeleteUser(u)}
                            disabled={isSelf}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* نافذة الإضافة */}
      <ActionModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="إضافة مستخدم جديد"
        action={createUserAction}
        submitLabel="حفظ المستخدم"
      >
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="مثال: أ/ أحمد محمد"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              البريد الإلكتروني *
            </label>
            <input
              type="email"
              name="email"
              required
              dir="ltr"
              placeholder="user@azhar.edu.eg"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              كلمة المرور *
            </label>
            <input
              type="text"
              name="password"
              required
              minLength={6}
              dir="ltr"
              placeholder="6 أحرف على الأقل"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>
        </div>
        <WorkplaceFields key={`new-${createOpen}`} {...sharedProps} prefix="new" />
      </ActionModal>

      {/* نافذة التعديل */}
      <ActionModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        title="تعديل بيانات المستخدم"
        action={updateUserAction}
        submitLabel="حفظ التعديلات"
      >
        <input type="hidden" name="id" value={editUser?._id || ""} />
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">الاسم *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={editUser?.name || ""}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            البريد الإلكتروني *
          </label>
          <input
            type="email"
            name="email"
            required
            dir="ltr"
            defaultValue={editUser?.email || ""}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
        <WorkplaceFields
          key={`edit-${editUser?._id || "none"}`}
          {...sharedProps}
          prefix="edit"
          init={
            editUser
              ? {
                  role: editUser.role,
                  regionId: editUser.regionId ?? "",
                  adminId: editUser.administrationId ?? "",
                  instituteId: editUser.instituteId ?? "",
                }
              : undefined
          }
        />
      </ActionModal>

      {/* نافذة الحذف */}
      <ActionModal
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        title="تأكيد حذف المستخدم"
        action={deleteUserAction}
        submitLabel="تأكيد الحذف"
        submitVariant="rose"
      >
        <input type="hidden" name="id" value={deleteUser?._id || ""} />
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm space-y-2">
          <p className="font-bold">
            هل تريد بالتأكيد حذف &ldquo;{displayName(deleteUser?.name)}&rdquo;؟
          </p>
          <p className="text-xs text-rose-700 leading-relaxed">
            سيتم إيقاف حسابه فورًا ولن يتمكن من تسجيل الدخول بالبريد{" "}
            <span className="font-mono" dir="ltr">
              {deleteUser?.email}
            </span>
            .
          </p>
        </div>
      </ActionModal>

      {/* نافذة تغيير كلمة المرور */}
      <ActionModal
        isOpen={!!resetUser}
        onClose={() => setResetUser(null)}
        title={`تغيير كلمة المرور — ${resetUser?.name || ""}`}
        action={resetUserPasswordAction}
        submitLabel="حفظ كلمة المرور"
      >
        <input type="hidden" name="id" value={resetUser?._id || ""} />
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            كلمة المرور الجديدة *
          </label>
          <input
            type="text"
            name="password"
            required
            minLength={6}
            dir="ltr"
            placeholder="6 أحرف على الأقل"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          شارك كلمة المرور الجديدة مع المستخدم عبر قناة آمنة — لن تظهر مرة أخرى بعد الحفظ.
        </p>
      </ActionModal>
    </div>
  );
}
