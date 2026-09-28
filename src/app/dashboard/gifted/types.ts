import type { Gender, SportCategory } from "@/types";

/** سجل طالب موهوب بصيغة JSON-safe جاهزة للعرض في المكوّنات العميلة. */
export interface GiftedStudentItem {
  _id: string;
  fullName: string;
  nationalId: string;
  region: string | null;
  regionName: string | null;
  administration: string | null;
  administrationName: string | null;
  institute: string | null;
  instituteName: string | null;
  grade: string;
  gender: Gender;
  /** المسار: برامج ومشروعات | مسابقات رياضية */
  category: SportCategory;
  sport: string;
  photo: string;
  notes: string;
  createdAt: string;
}

/** خيار معهد متاح للتسجيل، مع نطاقه لعرضه في النموذج. */
export interface GiftedInstituteOption {
  _id: string;
  name: string;
  code: string;
  stage: string;
  administrationId: string;
  administrationName: string;
  regionId: string;
  regionName: string;
}