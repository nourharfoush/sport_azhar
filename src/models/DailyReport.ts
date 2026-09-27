import mongoose, { Schema, Model, Document, Types } from "mongoose";
import {
  DAILY_REPORT_STATUSES,
  type DailyReportStatus,
} from "@/types";

/**
 * تقرير يومي واحد لموعد في الخطة الشهرية.
 * يكتبه الموجّه لنفسه ثم يرسله. حقل body متروك مرنًا
 * لإضافة حقول التقرير لاحقًا دون تعديل المخطط.
 */
export interface IDailyReport extends Document {
  visit: Types.ObjectId; // ref MonthlyVisit
  month: string; // "YYYY-MM" (denormalized for fast queries)
  supervisor: Types.ObjectId; // ref User
  status: DailyReportStatus;
  /** محتوى التقرير (حقول تُضاف لاحقًا). */
  body?: Record<string, unknown>;
  /** ملخص/خلاصة يكتبها الموجّه. */
  summary?: string;
  /** توصيات/ملاحظات للمتابعة. */
  recommendations?: string;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DailyReportSchema = new Schema<IDailyReport>(
  {
    visit: {
      type: Schema.Types.ObjectId,
      ref: "MonthlyVisit",
      required: true,
      unique: true, // تقرير واحد لكل موعد يومي
    },
    month: { type: String, required: true, index: true },
    supervisor: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: DAILY_REPORT_STATUSES,
      default: "draft",
    },
    body: { type: Schema.Types.Mixed, default: undefined },
    summary: { type: String, trim: true, default: "" },
    recommendations: { type: String, trim: true, default: "" },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

DailyReportSchema.index({ month: 1, supervisor: 1 });

export const DailyReport: Model<IDailyReport> =
  mongoose.models.DailyReport ||
  mongoose.model<IDailyReport>("DailyReport", DailyReportSchema);
