/** سجل مرجعي بصيغة JSON-safe جاهزة للعرض في المكوّنات العميلة. */
export interface SportsRefItem {
  _id: string;
  kind: "pitch" | "equipment";
  name: string;
  sport: string;
  surfaceType: string;
  dimensions: string;
  quantity: string;
  specifications: string;
  diagramUrl: string;
  notes: string;
  createdAt: string;
}

export const REF_KIND_LABELS: Record<"pitch" | "equipment", string> = {
  pitch: "مقاييس الملاعب",
  equipment: "مواصفات الأجهزة الرياضية",
};