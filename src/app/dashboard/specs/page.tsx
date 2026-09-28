import { getSession } from "@/lib/auth";
import { getSportsReferences } from "@/lib/data";
import { canManageSportsRefs } from "@/lib/rbac";
import { SportsRefsList } from "./SportsRefsList";
import type { SportsRefItem } from "./types";

export default async function SpecsPage() {
  const session = (await getSession())!;
  const raw = await getSportsReferences();
  const canManage = canManageSportsRefs(session);

  // تحويل البيانات لـ JSON safe props
  const items: SportsRefItem[] = raw.map((r) => ({
    _id: String(r._id),
    kind: r.kind,
    name: r.name,
    sport: r.sport,
    surfaceType: r.surfaceType ?? "",
    dimensions: r.dimensions ?? "",
    quantity: r.quantity ?? "",
    specifications: r.specifications ?? "",
    diagramUrl: r.diagramUrl ?? "",
    notes: r.notes ?? "",
    createdAt: r.createdAt
      ? new Date(r.createdAt).toISOString().slice(0, 10)
      : "",
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
          مقاييس الملاعب ومواصفات الأجهزة الرياضية
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          مرجع قياسي موحّد لمقاسات الملاعب ومواصفات الأجهزة الرياضية.
        </p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          {canManage
            ? "كإدارة عامة يمكنك إضافة المقاسات والمواصفات وتعديلها وحذفها، ويطّلع عليها جميع المستخدمين."
            : "هذا القسم للمراجعة والاسترشاد. الإضافة والتعديل والحذف من اختصاص الإدارة العامة."}
        </p>
      </div>

      <SportsRefsList
        pitches={items.filter((r) => r.kind === "pitch")}
        equipment={items.filter((r) => r.kind === "equipment")}
        canManage={canManage}
      />
    </div>
  );
}