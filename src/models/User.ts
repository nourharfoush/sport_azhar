import mongoose, { Schema, Model, Document, Types } from "mongoose";
import { ROLES, type Role } from "@/types";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  region?: Types.ObjectId | null;
  administration?: Types.ObjectId | null;
  institute?: Types.ObjectId | null;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true },
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
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
