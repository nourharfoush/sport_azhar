import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { Role } from "@/types";

/** نوع السجل المرجعي: مقاييس ملاعب | مواصفات أجهزة رياضية. */
export type RefKind = "pitch" | "equipment";

export interface ISportsReference extends Document {
  kind: RefKind;
  /** اسم الملعب أو الجهاز */
  name: string;
  sport: string;
  /** للملاعب: النوع (عشب صناعي، تراب، خرسانة...) */
  surfaceType?: string;
  /** الأبعاد كنص حر (مثال: 105×68 م) */
  dimensions?: string;
  /** عدد الوحدات/الكرات/الأهداف... */
  quantity?: string;
  /** المواصفات التفصيلية كنص حر */
  specifications?: string;
  /** رابط أو مصدر للمخطط (اختياري) */
  diagramUrl?: string;
  notes?: string;
  authorRole: Role;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SportsReferenceSchema = new Schema<ISportsReference>(
  {
    kind: { type: String, enum: ["pitch", "equipment"], required: true },
    name: { type: String, required: true, trim: true },
    sport: { type: String, required: true, trim: true },
    surfaceType: { type: String, trim: true },
    dimensions: { type: String, trim: true },
    quantity: { type: String, trim: true },
    specifications: { type: String, trim: true },
    diagramUrl: { type: String, trim: true },
    notes: { type: String, trim: true },
    authorRole: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

SportsReferenceSchema.index({ kind: 1, sport: 1, name: 1 });
SportsReferenceSchema.index({ kind: 1, createdAt: -1 });

export const SportsReference: Model<ISportsReference> =
  mongoose.models.SportsReference ||
  mongoose.model<ISportsReference>("SportsReference", SportsReferenceSchema);