/**
 * سكريبت إنشاء/تحديث حساب مستخدم مستقل (يوزر + باسورد) لكل منطقة أزهرية.
 *
 * - يمرّ على كل المناطق الموجودة في قاعدة البيانات.
 * - إن لم يوجد مستخدم بدور "region" لهذه المنطقة يتم إنشاؤه، وإن وُجد تُحدَّث كلمة مروره.
 * - يولّد بريدًا إلكترونيًا فريدًا وكلمة مرور عشوائية قوية لكل منطقة.
 * - يكتب بيانات الدخول كاملة (يوزر/باسورد) في ملف داخل مجلد المشروع:
 *     src/scripts/region-credentials.txt
 *   هذا الملف مُستبعد من Git (راجع .gitignore) للحفاظ على سرية كلمات المرور.
 *
 * التشغيل:
 *   npm run seed:region-users
 */
import mongoose from "mongoose";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { loadEnvLocal } from "./load-env";
import { Region } from "../models/Region";
import { User } from "../models/User";

const MONGODB_URI_FALLBACK = "mongodb://127.0.0.1:27017/azhar_sports";

/** إزالة التشكيل والفوارق الإملائية لتحويل اسم المنطقة إلى سلاج إنجليزي بسيط */
function slugify(name: string): string {
  const map: Record<string, string> = {
    "منطقة": "",
    "الأزهرية": "",
    "الازهرية": "",
  };
  let s = name;
  for (const k of Object.keys(map)) s = s.split(k).join(map[k]);
  s = s.trim();

  // خريطة تحويل تقريبية من العربية لحروف لاتينية لأغراض عناوين البريد فقط
  const arabicToLatin: Record<string, string> = {
    ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th", ج: "g",
    ح: "h", خ: "kh", د: "d", ذ: "z", ر: "r", ز: "z", س: "s", ش: "sh",
    ص: "s", ض: "d", ط: "t", ظ: "z", ع: "a", غ: "gh", ف: "f", ق: "q",
    ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w", ي: "y", ى: "a",
    ة: "a", ء: "", " ": "-",
  };
  let out = "";
  for (const ch of s) {
    out += arabicToLatin[ch] ?? (/[a-zA-Z0-9\-]/.test(ch) ? ch : "");
  }
  return out
    .toLowerCase()
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generatePassword(): string {
  // كلمة مرور عشوائية قوية (12 حرفًا) بصيغة Base64Url قابلة للقراءة
  return crypto.randomBytes(9).toString("base64url");
}

async function run() {
  await loadEnvLocal();
  const MONGODB_URI = process.env.MONGODB_URI ?? MONGODB_URI_FALLBACK;
  console.log("الاتصال بقاعدة البيانات...");
  await mongoose.connect(MONGODB_URI);

  const regions = await Region.find({}).sort({ name: 1 }).lean();
  if (regions.length === 0) {
    console.log("لا توجد مناطق مسجّلة بعد. قم بتشغيل seed أو إضافة مناطق أولاً.");
    await mongoose.disconnect();
    return;
  }

  const lines: string[] = [];
  lines.push("بيانات دخول حسابات المناطق الأزهرية");
  lines.push("=====================================");
  lines.push(`تاريخ التوليد: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("تنبيه: هذا الملف يحتوي كلمات مرور حساسة، لا تشاركه، ولا يتم رفعه على Git.");
  lines.push("");

  for (const region of regions) {
    const slug = slugify(region.name) || String(region.code).toLowerCase();
    const email = `${slug}.region@azhar.edu.eg`;
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await User.findOne({ region: region._id, role: "region" });
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.email = existing.email || email;
      await existing.save();
      lines.push(
        `${region.name} (${region.code}) -> البريد: ${existing.email} | كلمة المرور الجديدة: ${password}`,
      );
      console.log(`✓ تم تحديث كلمة مرور مستخدم منطقة: ${region.name}`);
    } else {
      await User.create({
        name: `أ/ موجه أول ${region.name}`,
        email,
        passwordHash,
        role: "region",
        region: region._id,
      });
      lines.push(
        `${region.name} (${region.code}) -> البريد: ${email} | كلمة المرور: ${password}`,
      );
      console.log(`✓ تم إنشاء مستخدم منطقة جديد: ${region.name}`);
    }
  }

  const outPath = path.join(__dirname, "region-credentials.txt");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log("-----------------------------------------");
  console.log(`✓ تم حفظ بيانات الدخول في: ${outPath}`);
  console.log("-----------------------------------------");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("فشل توليد حسابات المناطق:", err);
  process.exit(1);
});
