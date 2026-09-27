import mongoose, { Schema, Model, Document, Types } from "mongoose";
import {
  ALL_SPORTS,
  GENDERS,
  EVENT_STATUSES,
  type EventStatus,
  type Gender,
} from "@/types";

/**
 * فعالية / مسابقة رياضية.
 * تُنشأ من أحد المستويات وتُعمَّم على المستويات الأدنى حسب النطاق (scope).
 * scope = "general"  => يخاطب كل المناطق
 * scope = "region"   => يخاطب منطقة بعينها
 * scope = "administration" => يخاطب إدارة بعينها
 */
export interface IEvent extends Document {
  title: string;
  sport: string;
  gender: Gender;
  season: string;
  description?: string;
  scope: "general" | "region" | "administration";
  region?: Types.ObjectId | null;
  administration?: Types.ObjectId | null;
  startDate?: Date | null;
  endDate?: Date | null;
  status: EventStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    gender: { type: String, enum: GENDERS, default: "بنين" },
    sport: { type: String, enum: ALL_SPORTS, required: true },
    season: { type: String, required: true, trim: true, default: "2025/2026" },
    description: { type: String, trim: true },
    scope: {
      type: String,
      enum: ["general", "region", "administration"],
      default: "general",
    },
    region: { type: Schema.Types.ObjectId, ref: "Region", default: null },
    administration: {
      type: Schema.Types.ObjectId,
      ref: "Administration",
      default: null,
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    status: { type: String, enum: EVENT_STATUSES, default: "draft" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
