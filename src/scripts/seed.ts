import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Region } from "../models/Region";
import { Administration } from "../models/Administration";
import { Institute } from "../models/Institute";
import { User } from "../models/User";
import { Event } from "../models/Event";
import { FollowUp } from "../models/FollowUp";
import regionsData from "./regions-data.json";


const MONGODB_URI =
  process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/azhar_sports";

// الـ 27 محافظة مصرية والمناطق الأزهرية الرسمية المقابلة لها
const EGYPT_REGIONS = [
  { name: "منطقة القاهرة الأزهرية", code: "CAI" },
  { name: "منطقة الجيزة الأزهرية", code: "GIZ" },
  { name: "منطقة الإسكندرية الأزهرية", code: "ALX" },
  { name: "منطقة القليوبية الأزهرية", code: "QLY" },
  { name: "منطقة الدقهلية الأزهرية", code: "DKH" },
  { name: "منطقة الشرقية الأزهرية", code: "SHR" },
  { name: "منطقة الغربية الأزهرية", code: "GHR" },
  { name: "منطقة المنوفية الأزهرية", code: "MNF" },
  { name: "منطقة البحيرة الأزهرية", code: "BEH" },
  { name: "منطقة كفر الشيخ الأزهرية", code: "KFS" },
  { name: "منطقة دمياط الأزهرية", code: "DOM" },
  { name: "منطقة بورسعيد الأزهرية", code: "PSD" },
  { name: "منطقة الإسماعيلية الأزهرية", code: "ISM" },
  { name: "منطقة السويس الأزهرية", code: "SUZ" },
  { name: "منطقة شمال سيناء الأزهرية", code: "SIN" },
  { name: "منطقة جنوب سيناء الأزهرية", code: "SIS" },
  { name: "منطقة البحر الأحمر الأزهرية", code: "RED" },
  { name: "منطقة مطروح الأزهرية", code: "MAT" },
  { name: "منطقة الوادي الجديد الأزهرية", code: "WAD" },
  { name: "منطقة الفيوم الأزهرية", code: "FYM" },
  { name: "منطقة بني سويف الأزهرية", code: "BSU" },
  { name: "منطقة المنيا الأزهرية", code: "MNY" },
  { name: "منطقة أسيوط الأزهرية", code: "ASY" },
  { name: "منطقة سوهاج الأزهرية", code: "SOH" },
  { name: "منطقة قنا الأزهرية", code: "QNA" },
  { name: "منطقة الأقصر الأزهرية", code: "LUX" },
  { name: "منطقة أسوان الأزهرية", code: "ASW" },
];


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

  // 1. إنشاء كافة المناطق الأزهرية لجميع محافظات جمهورية مصر العربية (27 منطقة)
  console.log("إدخال مناطق المحافظات المصرية الـ 27...");
  const createdRegions = await Region.insertMany(EGYPT_REGIONS);
  const cairo = createdRegions.find((r) => r.code === "CAI")!;

  // 2. إدخال كافة الإدارات التعليمية التابعة لكل منطقة أزهرية
  console.log("إدخال جميع الإدارات التعليمية للمناطق الأزهرية...");
  const norm = (s: string) =>
    s
      .replace(/[\u064B-\u065F]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .trim();

  const allAdminDocs: Array<{ name: string; code: string; region: any }> = [];

  for (const [rawRegionName, adminNames] of Object.entries(regionsData)) {
    const regionDoc = createdRegions.find((r) => {
      const dNorm = norm(r.name).replace("منطقه ", "").replace(" الازهريه", "");
      const mNorm = norm(rawRegionName);
      return dNorm === mNorm || norm(r.name).includes(mNorm);
    });

    if (!regionDoc) continue;

    (adminNames as string[]).forEach((adminName, idx) => {
      allAdminDocs.push({
        name: adminName.startsWith("إدارة")
          ? adminName
          : `إدارة ${adminName} التعليمية`,
        code: `${regionDoc.code}-ADM-${String(idx + 1).padStart(2, "0")}`,
        region: regionDoc._id,
      });
    });
  }

  // إضافة إدارات تجريبية كإدارة مدينة نصر ومصر الجديدة إذا لم تكن موجودة بالقائمة لضمان التوافق مع المعاهد التجريبية
  let nasrAdminDoc = allAdminDocs.find((a) => a.name.includes("مدينة نصر"));
  if (!nasrAdminDoc) {
    nasrAdminDoc = {
      name: "إدارة مدينة نصر التعليمية",
      code: "CAI-ADM-99",
      region: cairo._id,
    };
    allAdminDocs.push(nasrAdminDoc);
  }

  let heliAdminDoc = allAdminDocs.find((a) => a.name.includes("مصر الجديدة"));
  if (!heliAdminDoc) {
    heliAdminDoc = {
      name: "إدارة مصر الجديدة التعليمية",
      code: "CAI-ADM-98",
      region: cairo._id,
    };
    allAdminDocs.push(heliAdminDoc);
  }

  const createdAdmins = await Administration.insertMany(allAdminDocs);
  const nasrAdmin = createdAdmins.find((a) => a.code === nasrAdminDoc!.code)!;
  const heliAdmin = createdAdmins.find((a) => a.code === heliAdminDoc!.code)!;
  console.log(`✓ تم إدخال ${createdAdmins.length} إدارة تعليمية بنجاح!`);

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
