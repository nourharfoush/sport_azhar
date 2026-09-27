/**
 * تحميل متغيرات البيئة من ملف .env.local عند تشغيل السكريبتات عبر tsx
 * (Next.js يحمّل .env.local تلقائيًا، لكن tsx لا يفعل ذلك).
 *
 * كما يُصلاح DNS عبر ensureDnsResolves (انظر lib/dns-fix.ts) لأن أجهزة ويندوز
 * قد تكتشف خادم DNS داخليًا لا يرد على استعلامات SRV الخاصة بـ MongoDB Atlas.
 */
import fs from "node:fs";
import path from "node:path";
import { ensureDnsResolves } from "@/lib/dns-fix";

export { ensureDnsResolves };

export async function loadEnvLocal(): Promise<void> {
  // تحميل البيئة أولاً حتى يقرأ ensureDnsResolves مضيف Atlas من MONGODB_URI
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      const key = m[1];
      let value = m[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }

  await ensureDnsResolves();
}

