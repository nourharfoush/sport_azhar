import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IAdministration extends Document {
  name: string;
  code: string;
  region: Types.ObjectId;
  createdAt: Date;
}

const AdministrationSchema = new Schema<IAdministration>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true },
    region: { type: Schema.Types.ObjectId, ref: "Region", required: true },
  },
  { timestamps: true },
);

AdministrationSchema.index({ region: 1, code: 1 }, { unique: true });

export const Administration: Model<IAdministration> =
  mongoose.models.Administration ||
  mongoose.model<IAdministration>("Administration", AdministrationSchema);
