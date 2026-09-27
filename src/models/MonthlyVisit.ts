import mongoose, { Schema, Model, Document, Types } from "mongoose";
import {
  VISIT_TYPES,
  type VisitType,
} from "@/types";

/**
 * موعد يومي واحد ضمن الخطة الشهرية لل موجّه.
 * يضعه مدير المنطقة/الإدارة في بداية الشهر، ويكتب فيه الموجّه تقريره اليومي.
 */
export interface IMonthlyVisit extends Document {
  month: string; // "YYYY-MM"
  supervisor: Types.ObjectId; // ref User (region / administration role)
  region: Types.ObjectId;
  administration: Types.ObjectId;
  institute: Types.ObjectId;
  visitType: VisitType;
  date: Date; // تاريخ الموعد (يوم محدّد من الشهر)
  /** ملاحظات اختيارية يضعها المدير عند الجدولة. */
  notes?: string;
  createdBy: Types.ObjectId;
  /** من راجع/اعتمد الموعد (المدير الذي أنشأه). */
  createdByRole: string;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyVisitSchema = new Schema<IMonthlyVisit>(
  {
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/,
      index: true,
    },
    supervisor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    region: { type: Schema.Types.ObjectId, ref: "Region", required: true },
    administration: {
      type: Schema.Types.ObjectId,
      ref: "Administration",
      required: true,
    },
    institute: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    visitType: { type: String, enum: VISIT_TYPES, required: true },
    date: { type: Date, required: true },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByRole: { type: String, required: true },
  },
  { timestamps: true },
);

// لا يتكرر نفس الموجّه في نفس المعهد/اليوم/الشهر
MonthlyVisitSchema.index(
  { month: 1, supervisor: 1, institute: 1, date: 1 },
  { unique: true },
);
// استعراض سريع للمواعيد حسب اليوم
MonthlyVisitSchema.index({ month: 1, date: 1 });

export const MonthlyVisit: Model<IMonthlyVisit> =
  mongoose.models.MonthlyVisit ||
  mongoose.model<IMonthlyVisit>("MonthlyVisit", MonthlyVisitSchema);
