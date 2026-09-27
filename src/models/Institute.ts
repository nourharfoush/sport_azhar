import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { STAGES, INSTITUTE_TYPES, type InstituteType } from "@/types";

export { STAGES, INSTITUTE_TYPES };
export type { InstituteType };

export interface IInstitute extends Document {
  name: string;
  code: string;
  administration: Types.ObjectId;
  stage: string;
  type: InstituteType;
  createdAt: Date;
}

const InstituteSchema = new Schema<IInstitute>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    administration: {
      type: Schema.Types.ObjectId,
      ref: "Administration",
      required: true,
    },
    stage: { type: String, enum: STAGES, default: "الإعدادي" },
    type: { type: String, enum: INSTITUTE_TYPES, default: "مشترك" },
  },
  { timestamps: true },
);

InstituteSchema.index({ administration: 1, code: 1 }, { unique: true });

export const Institute: Model<IInstitute> =
  mongoose.models.Institute ||
  mongoose.model<IInstitute>("Institute", InstituteSchema);
