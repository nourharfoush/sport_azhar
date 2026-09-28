import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { PLANNING_SECTIONS, type PlanningSection, type Role } from "@/types";

/**
 * سجل موحّد لأقسام «التخطيط والمتابعة» التي لا تحتاج نموذجًا مخصصًا:
 * المؤتمرات والاجتماعات / الخطة الزمنية / التوصيات والمقترحات /
 * التقارير السنوية / خطط التحسين.
 *
 * النطاق (منطقة/إدارة/معهد) يُشتق من المعهد كما في بقية الأقسام،
 * فيرى المدير ما في نطاقه والمعهد يرى سجلاته فقط.
 */
export interface IPlanningRecord extends Document {
  section: PlanningSection;
  title: string;
  /** سنة العمل: "2025/2026" */
  academicYear?: string;
  /** نص المحتوى التفصيلي. */
  content: string;
  /** إجراءات / خطوات (للخطة الزمنية وخطط التحسين). */
  items?: string;
  /** روابط أو مصادر خارجية. */
  links?: string;
  region?: Types.ObjectId | null;
  administration?: Types.ObjectId | null;
  institute?: Types.ObjectId | null;
  status?: string;
  authorRole: Role;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlanningRecordSchema = new Schema<IPlanningRecord>(
  {
    section: {
      type: String,
      enum: PLANNING_SECTIONS,
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    academicYear: { type: String, trim: true, default: "" },
    content: { type: String, trim: true, default: "" },
    items: { type: String, trim: true, default: "" },
    links: { type: String, trim: true, default: "" },
    region: { type: Schema.Types.ObjectId, ref: "Region", default: null },
    administration: {
      type: Schema.Types.ObjectId,
      ref: "Administration",
      default: null,
    },
    institute: {
      type: Schema.Types.ObjectId,
      ref: "Institute",
      default: null,
    },
    status: { type: String, trim: true, default: "" },
    authorRole: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// سجلات القسم الواحد مرتبة من الأحدث
PlanningRecordSchema.index({ section: 1, createdAt: -1 });
PlanningRecordSchema.index({ region: 1, administration: 1 });

export const PlanningRecord: Model<IPlanningRecord> =
  mongoose.models.PlanningRecord ||
  mongoose.model<IPlanningRecord>("PlanningRecord", PlanningRecordSchema);