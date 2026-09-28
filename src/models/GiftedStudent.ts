import mongoose, { Schema, Model, Document, Types } from "mongoose";
import {
  GENDERS,
  SPORT_CATEGORIES,
  STUDENT_GRADES,
  type Gender,
  type SportCategory,
} from "@/types";

/**
 * طالب موهوب رياضيًا في ركن الموهوبين.
 * النطاق (منطقة / إدارة / معهد) يُستنتج من المعهد المختار عند الإنشاء
 * حتى لا تتعارض البيانات مع الهيكل التنظيمي.
 */
export interface IGiftedStudent extends Document {
  fullName: string;
  nationalId: string;
  region: Types.ObjectId;
  administration: Types.ObjectId;
  institute: Types.ObjectId;
  grade: string;
  gender: Gender;
  /** المسار: برامج ومشروعات | مسابقات رياضية */
  category: SportCategory;
  /** اللعبة/البرنامج داخل المسار المختار */
  sport: string;
  /** مسار صورة الطالب (داخل /uploads/gifted أو رابط Vercel Blob) */
  photo: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GiftedStudentSchema = new Schema<IGiftedStudent>(
  {
    fullName: { type: String, required: true, trim: true },
    nationalId: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{14}$/, "الرقم القومي يجب أن يكون 14 رقمًا"],
    },
    region: { type: Schema.Types.ObjectId, ref: "Region", required: true },
    administration: {
      type: Schema.Types.ObjectId,
      ref: "Administration",
      required: true,
    },
    institute: {
      type: Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },
    grade: { type: String, required: true, enum: STUDENT_GRADES },
    gender: { type: String, required: true, enum: GENDERS, default: "بنين" },
    category: {
      type: String,
      required: true,
      enum: SPORT_CATEGORIES,
      default: "competitions",
    },
    sport: { type: String, required: true, trim: true },
    photo: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// الرقم bosomى فريد على مستوى الجمهورية: يمنع تكرار تسجيل نفس الطالب
GiftedStudentSchema.index({ nationalId: 1 }, { unique: true });
GiftedStudentSchema.index({ institute: 1, createdAt: -1 });
GiftedStudentSchema.index({ region: 1, administration: 1 });
// فلاتر التقسيم: المسار ثم اللعبة داخله
GiftedStudentSchema.index({ category: 1, sport: 1 });

export const GiftedStudent: Model<IGiftedStudent> =
  mongoose.models.GiftedStudent ||
  mongoose.model<IGiftedStudent>("GiftedStudent", GiftedStudentSchema);