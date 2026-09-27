/**
 * سكريبت تعبئة المناطق الأزهرية والإدارات التعليمية فقط (بدون حذف أي بيانات).
 *
 * آمن للتشغيل المتكرر (idempotent): يعتمد upsert حسب الـ code، فلا يُنشئ تكرارات.
 * - كل محافظة في regions-data.json تنشئ منطقة أزهرية برمز من 3 أحرف.
 * - كل إدارة تعليمية داخلها تنشأ برمز المنطقة + تسلسل مرقّم.
 *
 * لا يمس المستخدمين ولا المعاهد ولا الفعاليات ولا الأخبار (بعكس seed.ts).
 *
 * التشغيل:
 *   npm run seed:regions
 */
import mongoose from "mongoose";
import { loadEnvLocal } from "./load-env";
import { Region } from "../models/Region";
import { Administration } from "../models/Administration";
import regionsData from "./regions-data.json";

const MONGODB_URI_FALLBACK = "mongodb://127.0.0.1:27017/azhar_sports";

/** الرموز الرسمية للمناطق الأزهرية (27 محافظة) — مطابقة لseed.ts. */
const REGION_CODES: Record<string, string> = {
  "القاهرة": "CAI",
  "الجيزة": "GIZ",
  "الإسكندرية": "ALX",
  "القليوبية": "QLY",
  "الدقهلية": "DKH",
  "الشرقية": "SHR",
  "الغربية": "GHR",
  "المنوفية": "MNF",
  "البحيرة": "BEH",
  "كفر الشيخ": "KFS",
  "دمياط": "DOM",
  "بورسعيد": "PSD",
  "الإسماعيلية": "ISM",
  "السويس": "SUZ",
  "شمال سيناء": "SIN",
  "جنوب سيناء": "SIS",
  "البحر الأحمر": "RED",
  "مطروح": "MAT",
  "الوادى الجديد": "WAD",
  "الفيوم": "FYM",
  "بنى سويف": "BSU",
  "المنيا": "MNY",
  "أسيوط": "ASY",
  "سوهاج": "SOH",
  "قنا": "QNA",
  "الأقصر": "LUX",
  "أسوان": "ASW",
};

async function run() {
  await loadEnvLocal();
  const MONGODB_URI = process.env.MONGODB_URI ?? MONGODB_URI_FALLBACK;
  console.log("الاتصال بقاعدة البيانات...");
  await mongoose.connect(MONGODB_URI);

  // 1) المناطق
  let regionsCreated = 0;
  let regionsUpdated = 0;
  let adminsCreated = 0;
  let adminsUpdated = 0;
  const missingCodes: string[] = [];
  const regionIdByGovernorate = new Map<string, mongoose.Types.ObjectId>();

  for (const [governorate, adminNames] of Object.entries(
    regionsData as Record<string, string[]>,
  )) {
    const code = REGION_CODES[governorate];
    if (!code) {
      missingCodes.push(governorate);
      continue;
    }

    const fullName = `منطقة ${governorate} الأزهرية`;
    const existingRegion = await Region.findOne({ code });
    const region = await Region.findOneAndUpdate(
      { code },
      { $set: { name: fullName, code } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    if (existingRegion) {
      if (existingRegion.name !== fullName) {
        existingRegion.name = fullName;
        await existingRegion.save();
        regionsUpdated++;
      }
    } else {
      regionsCreated++;
    }
    regionIdByGovernorate.set(governorate, region._id as mongoose.Types.ObjectId);

    // 2) الإدارات التعليمية التابعة
    for (const [idx, rawName] of adminNames.entries()) {
      const name = rawName.startsWith("إدارة")
        ? rawName
        : `إدارة ${rawName} التعليمية`;
      const adminCode = `${code}-ADM-${String(idx + 1).padStart(2, "0")}`;

      const existing = await Administration.findOne({ code: adminCode });
      if (existing) {
        if (existing.name !== name) {
          existing.name = name;
          await existing.save();
          adminsUpdated++;
        }
      } else {
        await Administration.create({ name, code: adminCode, region: region._id });
        adminsCreated++;
      }
    }
  }

  if (missingCodes.length) {
    console.log(
      `⚠️Governorates بلا رمز منطقة (تُجاوَلت): ${missingCodes.join("، ")}`,
    );
  }

  const totalRegions = await Region.countDocuments();
  const totalAdmins = await Administration.countDocuments();

  console.log("-----------------------------------------");
  console.log(`✓ المناطق:        +${regionsCreated} جديد / ${regionsUpdated} محدّث (الإجمالي ${totalRegions})`);
  console.log(`✓ الإدارات:       +${adminsCreated} جديد / ${adminsUpdated} محدّث (الإجمالي ${totalAdmins})`);
  console.log("✓ لم يتم حذف أي بيانات قائمة (مستخدمون/معاهد/فعاليات/أخبار).");
  console.log("-----------------------------------------");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("فشل تعبئة المناطق والإدارات:", err);
  process.exit(1);
});
