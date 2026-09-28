import type { PlanningSection } from "@/types";

/** سجل تخطيط بصيغة JSON-safe جاهزة للعرض في المكوّنات العميلة. */
export interface PlanningRecordItem {
  _id: string;
  section: PlanningSection;
  title: string;
  academicYear: string;
  content: string;
  items: string;
  links: string;
  status: string;
  region: string | null;
  regionName: string | null;
  administration: string | null;
  administrationName: string | null;
  institute: string | null;
  instituteName: string | null;
  createdAt: string;
}

/** خيار معهد لإسناد السجل إلى نطاقه. */
export interface PlanningInstituteOption {
  _id: string;
  name: string;
  administrationName: string;
}