import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Region } from "../models/Region";
import { Administration } from "../models/Administration";
import { Institute } from "../models/Institute";
import { User } from "../models/User";
import { Event } from "../models/Event";
import { FollowUp } from "../models/FollowUp";
import { News } from "../models/News";
import regionsData from "./regions-data.json";
import { loadEnvLocal } from "./load-env";

const MONGODB_URI_FALLBACK = "mongodb://127.0.0.1:27017/azhar_sports";

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
  await loadEnvLocal();
  const MONGODB_URI = process.env.MONGODB_URI ?? MONGODB_URI_FALLBACK;
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
    News.deleteMany({}),
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

  const allAdminDocs: Array<{
    name: string;
    code: string;
    region: mongoose.Types.ObjectId;
  }> = [];

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
    name: "مدير عام الرعاية الرياضية",
    email: "general@azhar.edu.eg",
    passwordHash,
    role: "general",
  });

  await User.create({
    name: "موجه أول منطقة القاهرة",
    email: "cairo.region@azhar.edu.eg",
    passwordHash,
    role: "region",
    region: cairo._id,
  });

  await User.create({
    name: "مدير إدارة مدينة نصر الرياضية",
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

  // 4ب. عضو فني بالمنطقة (مكان عمله المنطقة فقط)
  await User.create({
    name: "عضو فني بمنطقة القاهرة",
    email: "cairo.technical@azhar.edu.eg",
    passwordHash,
    role: "technical",
    region: cairo._id,
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

  // 5ب. مسابقة اللياقة البدنية على مستوى الجمهورية
  const eventFitness = await Event.create({
    title: "بطولة الجمهورية الأزهرية لللياقة البدنية",
    sport: "اللياقة البدنية",
    gender: "بنين",
    season: "2025/2026",
    description:
      "بطولة اللياقة البدنية لطلاب الأزهر على مستوى الجمهورية، وتشمل اختبارات اللياقة العامة والسرعة والقوة.",
    scope: "general",
    status: "published",
    createdBy: generalUser._id,
  });

  // 5ج. مسابقات فئة الفتيات (المرشدات والزهرات)
  await Event.create({
    title: "مسابقة الزهرات على مستوى الجمهورية",
    sport: "الزهرات",
    gender: "فتيات",
    season: "2025/2026",
    description:
      "مسابقة تفوق دراسي ورياضي لطالبات الأزهر (الزهرات) على مستوى الجمهورية.",
    scope: "general",
    status: "published",
    createdBy: generalUser._id,
  });

  await Event.create({
    title: "مسابقة المرشدات على مستوى الجمهورية",
    sport: "المرشدات",
    gender: "فتيات",
    season: "2025/2026",
    description:
      "مسابقة المرشدات في الأنشطة المدرسية ودور التوجيه الصحي بين الطالبات.",
    scope: "general",
    status: "published",
    createdBy: generalUser._id,
  });

  await Event.create({
    title: "بطولة الجمهورية الأزهرية لكرة السلة للسيدات",
    sport: "كرة السلة",
    gender: "فتيات",
    season: "2025/2026",
    description: "بطولة كرة السلة لطالبات الأزهر على مستوى الجمهورية.",
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
    event: eventFitness._id,
    institute: inst1._id,
    region: cairo._id,
    administration: nasrAdmin._id,
    status: "registered",
    teamSize: 12,
    notes: "تسجيل فريق المعهد في بطولة اللياقة البدنية.",
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

  // 7. الأخبار والتعميمات على المستويات الثلاثة
  await News.create([
    {
      title: "انطلاق بطولة الجمهورية الأزهرية لكرة القدم للمرحلة الثانوية",
      content:
        "تعلن الإدارة العامة للرعاية الرياضية عن بدء التصفيات التمهيدية لبطولة الجمهورية لكرة القدم للمرحلة الثانوية بجميع المناطق الأزهرية، على أن تُرسل كشوف المشاركين خلال أسبوعين من تاريخ التعميم.",
      category: "announcement",
      scope: "general",
      isPinned: true,
      published: true,
      authorRole: "general",
      createdBy: generalUser._id,
    },
    {
      title: "نتائج تصفيات منطقة القاهرة الأزهرية في كرة الطائرة",
      content:
        "أسفرت تصفيات منطقة القاهرة الأزهرية في كرة الطائرة للمرحلة الإعدادية عن تأهل أربعة معاهد للدور النهائي، وقد أشادت اللجنة الفنية بمستوى التنظيم والروح الرياضية للمشاركين.",
      category: "sports_report",
      scope: "region",
      region: cairo._id,
      published: true,
      authorRole: "region",
      createdBy: generalUser._id,
    },
    {
      title: "تعميم بشأن مواعيد تدريبات معاهد إدارة مدينة نصر",
      content:
        "تُنظَّم التدريبات الأسبوعية لمعاهد إدارة مدينة نصر التعليمية بمقر معهد مدينة نصر النموذجي، مع ضرورة التزام المشرف الرياضي بتسجيل الحضور في منظومة المتابعة.",
      category: "decision",
      scope: "administration",
      region: cairo._id,
      administration: nasrAdmin._id,
      published: true,
      authorRole: "administration",
      createdBy: generalUser._id,
    },
  ]);


  console.log("✓ تم إدخال البيانات التجريبية بنجاح!");
  console.log("-----------------------------------------");
  console.log("الحسابات الجاهزة للتجربة (كلمة المرور للجميع: azhar123):");
  console.log("1. الإدارة العامة:     general@azhar.edu.eg");
  console.log("2. المنطقة الأزهرية:   cairo.region@azhar.edu.eg");
  console.log("3. الإدارة التعليمية:  nasr.admin@azhar.edu.eg");
  console.log("4. المعهد الأزهري:    model.institute@azhar.edu.eg");
  console.log("5. عضو فني بالمنطقة:  cairo.technical@azhar.edu.eg");
  console.log("-----------------------------------------");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("فشل إدخال البيانات:", err);
  process.exit(1);
});
