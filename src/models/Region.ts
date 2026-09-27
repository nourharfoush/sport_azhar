import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IRegion extends Document {
  name: string;
  code: string;
  createdAt: Date;
}

const RegionSchema = new Schema<IRegion>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  },
  { timestamps: true },
);

export const Region: Model<IRegion> =
  mongoose.models.Region || mongoose.model<IRegion>("Region", RegionSchema);
