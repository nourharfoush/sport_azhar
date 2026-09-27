import type { Role } from "@/types";

/** صف مستخدم معروض في الجدول (المعرفات نصية + مكان العمل محسوب من السيرفر). */
export interface UserRow {
  _id: string;
  name: string;
  email: string;
  role: Role;
  regionId: string | null;
  administrationId: string | null;
  instituteId: string | null;
  workplace: string;
}

export interface RegionOption {
  _id: string;
  name: string;
  code: string;
}

export interface AdministrationOption {
  _id: string;
  name: string;
  code: string;
  regionId: string;
  regionName: string;
}

export interface InstituteOption {
  _id: string;
  name: string;
  code: string;
  stage: string;
  administrationId: string;
  administrationName: string;
}
