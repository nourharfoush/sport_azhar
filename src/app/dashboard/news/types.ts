import { NewsCategory, Role } from "@/types";

export interface NewsItem {
  _id: string;
  title: string;
  content: string;
  category: NewsCategory;
  scope: "general" | "region" | "administration";
  region: string | null;
  regionName: string | null;
  administration: string | null;
  administrationName: string | null;
  isPinned: boolean;
  published: boolean;
  /** مسارات الصور المرفقة (داخل /uploads) */
  images: string[];
  authorRole: Role;
  createdAt: string;
}
