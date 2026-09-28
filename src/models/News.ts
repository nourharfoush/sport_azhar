import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { NEWS_CATEGORIES, type NewsCategory, type Role } from "@/types";

export interface INews extends Document {
  title: string;
  content: string;
  category: NewsCategory;
  scope: "general" | "region" | "administration";
  region?: Types.ObjectId | null;
  administration?: Types.ObjectId | null;
  isPinned: boolean;
  published: boolean;
  /** مسارات الصور المرفقة داخل /public/uploads */
  images: string[];
  authorRole: Role;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NewsSchema = new Schema<INews>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: NEWS_CATEGORIES,
      default: "news",
    },
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
    isPinned: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    images: { type: [String], default: [] },
    authorRole: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

NewsSchema.index({ isPinned: -1, createdAt: -1 });
NewsSchema.index({ scope: 1, region: 1, administration: 1 });

export const News: Model<INews> =
  mongoose.models.News || mongoose.model<INews>("News", NewsSchema);
