import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { FOLLOWUP_STATUSES, type FollowupStatus } from "@/types";

/**
 * متابعة/نتيجة مشاركة معهد في فعالية معيّنة.
 * تُنشأ تلقائياً لكل معهد معنيّ بالفعالية، ويحدّثها المعهد،
 * وتُجمَّع للعرض في المستويات الأعلى.
 */
export interface IFollowUp extends Document {
  event: Types.ObjectId;
  institute: Types.ObjectId;
  region: Types.ObjectId;
  administration: Types.ObjectId;
  status: FollowupStatus;
  teamSize: number;
  score?: string;
  rank?: number | null;
  notes?: string;
  updatedBy: Types.ObjectId;
  updatedAt: Date;
}

const FollowUpSchema = new Schema<IFollowUp>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    institute: { type: Schema.Types.ObjectId, ref: "Institute", required: true },
    region: { type: Schema.Types.ObjectId, ref: "Region", required: true },
    administration: {
      type: Schema.Types.ObjectId,
      ref: "Administration",
      required: true,
    },
    status: { type: String, enum: FOLLOWUP_STATUSES, default: "not_started" },
    teamSize: { type: Number, default: 0, min: 0 },
    score: { type: String, trim: true },
    rank: { type: Number, default: null, min: 1 },
    notes: { type: String, trim: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

FollowUpSchema.index({ event: 1, institute: 1 }, { unique: true });

export const FollowUp: Model<IFollowUp> =
  mongoose.models.FollowUp ||
  mongoose.model<IFollowUp>("FollowUp", FollowUpSchema);
