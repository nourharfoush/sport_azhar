import mongoose, { Schema, Model, Document, Types } from "mongoose";
import {
  VISIT_TYPES,
  type VisitType,
} from "@/types";

/** مستوى المتابعة الذي يخصّ الموعد: معهد (موجّه إدارة) أو إدارة تعليمية (عضو فني). */
export const VISIT_TARGET_KINDS = ["institute", "administration"] as const;

export type VisitTargetKind = (typeof VISIT_TARGET_KINDS)[number];

export const VISIT_TARGET_KIND_LABELS: Record<VisitTargetKind, string> = {
  institute: "متابعة معهد",
  administration: "متابعة إدارة تعليمية",
};

/**
 * موعد يومي واحد ضمن الخطة الشهرية للموجّه.
 * يضعه مدير المنطقة/الإدارة في بداية الشهر، ويكتب فيه الموجّه تقريره اليومي.
 *
 * - kind = "institute": متابعة معهد (الموجّه من مستوى إدارة تعليمية).
 * - kind = "administration": متابعة إدارة تعليمية (العضو الفني بالمنطقة)،
 *   فيكون الحقل institute بلا قيمة.
 */
export interface IMonthlyVisit extends Document {
  month: string; // "YYYY-MM"
  supervisor: Types.ObjectId; // ref User (region / administration / technical)
  region: Types.ObjectId;
  administration: Types.ObjectId;
  /** المعهد المتابَع — مطلوب فقط في متابعة المعاهد. */
  institute?: Types.ObjectId | null;
  kind: VisitTargetKind;
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
    institute: { type: Schema.Types.ObjectId, ref: "Institute", default: null },
    kind: { type: String, enum: VISIT_TARGET_KINDS, default: "institute" },
    visitType: { type: String, enum: VISIT_TYPES, required: true },
    date: { type: Date, required: true },
    notes: { type: String, trim: true, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByRole: { type: String, required: true },
  },
  { timestamps: true },
);

// لا يتكرر نفس الموجّه في نفس الهدف/اليوم/الشهر
// (الهدف = المعهد في متابعة المعاهد، أو الإدارة التعليمية في متابعة الإدارات)
MonthlyVisitSchema.index(
  { month: 1, supervisor: 1, administration: 1, institute: 1, date: 1 },
  { unique: true },
);
// استعراض سريع للمواعيد حسب اليوم
MonthlyVisitSchema.index({ month: 1, date: 1 });

export const MonthlyVisit: Model<IMonthlyVisit> =
  mongoose.models.MonthlyVisit ||
  mongoose.model<IMonthlyVisit>("MonthlyVisit", MonthlyVisitSchema);
