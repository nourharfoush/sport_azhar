/**
 * سكريبت إنشاء/تحديث حساب مستخدم مستقل (يوزر + باسورد) لكل إدارة تعليمية،
 * مع ترتيب النتائج حسب المنطقة مع فاصل واضح بين كل منطقة وأخرى.
 *
 * - يمرّ على كل الإدارات الموجودة في قاعدة البيانات مرتبة حسب المنطقة ثم الاسم.
 * - إن لم يوجد مستخدم بدور "administration" لهذه الإدارة يتم إنشاؤه،
 *   وإن وُجد تُحدَّث كلمة مروره.
 * - يولّد بريدًا إلكترونيًا فريدًا وكلمة مرور عشوائية قوية لكل إدارة.
 * - يكتب بيانات الدخول كاملة (يوزر/باسورد) في ملف داخل مجلد المشروع:
 *     src/scripts/administration-credentials.txt
 *   هذا الملف مُستبعد من Git (راجع .gitignore) للحفاظ على سرية كلمات المرور.
 *
 * التشغيل:
 *   npm run seed:admin-users
 */
import mongoose from "mongoose";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { loadEnvLocal } from "./load-env";
import { Administration } from "../models/Administration";
import { Region } from "../models/Region";
import { User } from "../models/User";

const MONGODB_URI_FALLBACK = "mongodb://127.0.0.1:27017/azhar_sports";

/** إزالة التشكيل والفوارق الإملائية لتحويل الاسم إلى سلاج إنجليزي بسيط */
function slugify(name: string): string {
  const map: Record<string, string> = {
    "الإدارة ": "",
    "إدارة ": "",
    "التعليمية": "",
    "التعليميه": "",
  };
  let s = name;
  for (const k of Object.keys(map)) s = s.split(k).join(map[k]);
  s = s.trim();

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
  return crypto.randomBytes(9).toString("base64url");
}


async function run() {
  await loadEnvLocal();
  const MONGODB_URI = process.env.MONGODB_URI ?? MONGODB_URI_FALLBACK;
  console.log("الاتصال بقاعدة البيانات...");
  await mongoose.connect(MONGODB_URI);

  // الإدارات مع بيانات المنطقة، مرتبة بالمنطقة ثم الاسم
  // نمرّر Region.columns لضمان تسجيل موديل Region قبل populate
  void Region.collection;
  const administrations = await Administration.find({})
    .populate<{ region: { _id: any; name: string; code: string } }>("region")
    .sort({ name: 1 })
    .lean();

  if (administrations.length === 0) {
    console.log("لا توجد إدارات مسجّلة بعد. قم بتشغيل seed أو إضافة إدارات أولاً.");
    await mongoose.disconnect();
    return;
  }

  // تجميع الإدارات حسب المنطقة مع الحفاظ على ترتيب المناطق أبجديًا
  const byRegion = new Map<
    string,
    { regionName: string; regionCode: string; items: typeof administrations }
  >();

  for (const admin of administrations) {
    const regionObj =
      admin.region && typeof admin.region === "object" ? admin.region : null;
    const key = String(regionObj?._id ?? "none");
    if (!byRegion.has(key)) {
      byRegion.set(key, {
        regionName: regionObj?.name ?? "بدون منطقة",
        regionCode: regionObj?.code ?? "--",
        items: [],
      });
    }
    byRegion.get(key)!.items.push(admin);
  }

  const groups = [...byRegion.values()].sort((a, b) =>
    a.regionName.localeCompare(b.regionName, "ar"),
  );

  const lines: string[] = [];
  lines.push("بيانات دخول حسابات الإدارات التعليمية");
  lines.push("===========================================");
  lines.push(`تاريخ التوليد: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("تنبيه: هذا الملف يحتوي كلمات مرور حساسة، لا تشاركه، ولا يتم رفعه على Git.");
  lines.push("");

  let created = 0;
  let updated = 0;

  for (const group of groups) {
    // ترويسة المنطقة كعنوان واضح يفصل بين الإدارات
    lines.push("");
    lines.push("========================================================");
    lines.push(`  ${group.regionName} (${group.regionCode}) — ${group.items.length} إدارة`);
    lines.push("========================================================");

    for (const admin of group.items) {
      const base = slugify(admin.name) || String(admin.code).toLowerCase();
      // رمز المنطقة يضمن عدم تكرار البريد بين إدارات مختلفة بنفس الاسم
      const email = `${base}.${String(admin.code).toLowerCase()}.admin@azhar.edu.eg`;
      const password = generatePassword();
      const passwordHash = await bcrypt.hash(password, 10);

      const existing = await User.findOne({
        administration: admin._id,
        role: "administration",
      });
      if (existing) {
        existing.passwordHash = passwordHash;
        existing.email = existing.email || email;
        existing.region = admin.region?._id ?? existing.region;
        await existing.save();
        lines.push(
          `  - ${admin.name} (${admin.code}) -> البريد: ${existing.email} | كلمة المرور الجديدة: ${password}`,
        );
        updated += 1;
        console.log(`✓ تم تحديث حساب إدارة: ${admin.name}`);
      } else {
        // تفادي تصادم البريد مع حساب آخر (بريد مستخدم مسبقًا)
        let uniqueEmail = email;
        let suffix = 2;
        while (await User.exists({ email: uniqueEmail })) {
          uniqueEmail = `${base}.${suffix++}@azhar.edu.eg`;
        }
        await User.create({
          name: `أ/ مدير ${admin.name}`,
          email: uniqueEmail,
          passwordHash,
          role: "administration",
          region: admin.region?._id ?? null,
          administration: admin._id,
        });
        lines.push(
          `  - ${admin.name} (${admin.code}) -> البريد: ${uniqueEmail} | كلمة المرور: ${password}`,
        );
        created += 1;
        console.log(`✓ تم إنشاء حساب إدارة جديد: ${admin.name}`);
      }
    }
  }

  lines.push("");
  lines.push("-----------------------------------------");
  lines.push(`الإجمالي: ${created} حساب جديد، ${updated} حساب محدّث.`);
  lines.push("-----------------------------------------");

  const outPath = path.join(__dirname, "administration-credentials.txt");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log("-----------------------------------------");
  console.log(`✓ تم حفظ بيانات الدخول في: ${outPath}`);
  console.log("-----------------------------------------");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("فشل توليد حسابات الإدارات:", err);
  process.exit(1);
});