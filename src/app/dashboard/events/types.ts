import { EventStatus, EventScope, type Gender } from "@/types";

export interface EventItem {
  _id: string;
  title: string;
  sport: string;
  gender: Gender;
  season: string;
  description?: string;
  scope: EventScope;
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
