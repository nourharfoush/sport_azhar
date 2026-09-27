import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Region } from "../models/Region";
import { Administration } from "../models/Administration";
import { Institute } from "../models/Institute";
import { User } from "../models/User";
import { Event } from "../models/Event";
import { FollowUp } from "../models/FollowUp";

const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/azhar_sports";

async function run() {
  console.log("الاتصال بقاعدة البيانات...");
  await mongoose.connect(MONGODB_URI);

  console.log("تنظيف البيانات السابقة...");
  await Promise.all([
    Region.deleteMany({}),
    Administration.deleteMany({}),
    Institute.deleteMany({}),
    User.deleteMany({}),
    Event.deleteMany({}),
    FollowUp.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("azhar123", 10);

  // 1. المناطق
  const cairo = await Region.create({
    name: "منطقة القاهرة الأزهرية",
    code: "CAI",
  });
  const alex = await Region.create({
    name: "منطقة الإسكندرية الأزهرية",
    code: "ALX",
  });

  // 2. الإدارات
  const nasrAdmin = await Administration.create({
    name: "إدارة مدينة نصر التعليمية",
    code: "NSR",
    region: cairo._id,
  });
  const heliAdmin = await Administration.create({
    name: "إدارة مصر الجديدة التعليمية",
    code: "HLP",
    region: cairo._id,
  });

  // 3. المعاهد
  const inst1 = await Institute.create({
    name: "معهد مدينة نصر النموذجي بنين",
    code: "NSR-MOD-01",
    administration: nasrAdmin._id,
    stage: "الثانوي",
  });
  const inst2 = await Institute.create({
    name: "معهد النور الإعدادي",
    code: "NSR-NOOR-02",
    administration: nasrAdmin._id,
    stage: "الإعدادي",
  });
  const inst3 = await Institute.create({
    name: "معهد مصر الجديدة الابتدائي",
    code: "HLP-PRI-01",
    administration: heliAdmin._id,
    stage: "الابتدائي",
  });

  // 4. المستخدمون (مستوى لكل دور)
  const generalUser = await User.create({
    name: "أ.د/ مدير عام الرعاية الرياضية",
    email: "general@azhar.edu.eg",
    passwordHash,
    role: "general",
  });

  await User.create({
    name: "أ/ موجه أول منطقة القاهرة",
    email: "cairo.region@azhar.edu.eg",
    passwordHash,
    role: "region",
    region: cairo._id,
  });

  await User.create({
    name: "أ/ مدير إدارة مدينة نصر الرياضية",
    email: "nasr.admin@azhar.edu.eg",
    passwordHash,
    role: "administration",
    region: cairo._id,
    administration: nasrAdmin._id,
  });

  const instituteUser = await User.create({
    name: "كابتن/ مسؤول النشاط الرياضي بمعهد مدينة نصر",
    email: "model.institute@azhar.edu.eg",
    passwordHash,
    role: "institute",
    region: cairo._id,
    administration: nasrAdmin._id,
    institute: inst1._id,
  });

  // 5. مسابقة عامة منشورة
  const event1 = await Event.create({
    title: "بطولة الجمهورية الأزهرية لكرة القدم للمرحلة الثانوية",
    sport: "كرة القدم",
    season: "2025/2026",
    description: "البطولة السنوية المركزية لطلاب المرحلة الثانوية على مستوى كافة المناطق الأزهرية.",
    scope: "general",
    status: "published",
    createdBy: generalUser._id,
  });

  // 6. سجلات المتابعة للمسابقة
  await FollowUp.create({
    event: event1._id,
    institute: inst1._id,
    region: cairo._id,
    administration: nasrAdmin._id,
    status: "completed",
    teamSize: 18,
    score: "فوز في النهائي 2-1",
    rank: 1,
    notes: "فاز المعهد بكأس بطولة الجمهورية بعد أداء بطولي.",
    updatedBy: instituteUser._id,
  });

  await FollowUp.create({
    event: event1._id,
    institute: inst2._id,
    region: cairo._id,
    administration: nasrAdmin._id,
    status: "registered",
    teamSize: 14,
    notes: "تم إرسال الكشوف الطبية وجاري تسليم البطاقات.",
    updatedBy: instituteUser._id,
  });

  await FollowUp.create({
    event: event1._id,
    institute: inst3._id,
    region: cairo._id,
    administration: heliAdmin._id,
    status: "not_started",
    teamSize: 0,
    updatedBy: generalUser._id,
  });

  console.log("✓ تم إدخال البيانات التجريبية بنجاح!");
  console.log("-----------------------------------------");
  console.log("الحسابات الجاهزة للتجربة (كلمة المرور للجميع: azhar123):");
  console.log("1. الإدارة العامة:     general@azhar.edu.eg");
  console.log("2. المنطقة الأزهرية:   cairo.region@azhar.edu.eg");
  console.log("3. الإدارة التعليمية:  nasr.admin@azhar.edu.eg");
  console.log("4. المعهد الأزهري:    model.institute@azhar.edu.eg");
  console.log("-----------------------------------------");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("فشل إدخال البيانات:", err);
  process.exit(1);
});
