import { EventStatus } from "@/types";

export interface EventItem {
  _id: string;
  title: string;
  sport: string;
  season: string;
  description?: string;
  scope: "general" | "region" | "administration";
  region: string | null;
  regionName: string | null;
  administration: string | null;
  administrationName: string | null;
  startDate?: string;
  endDate?: string;
  status: EventStatus;
  targetCount: number;
  respondedCount: number;
}
