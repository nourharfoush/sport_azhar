/**
 * تحميل متغيرات البيئة من ملف .env.local عند تشغيل السكريبتات عبر tsx
 * (Next.js يحمّل .env.local تلقائيًا، لكن tsx لا يفعل ذلك).
 *
 * كما تفحص خوادم DNS المستخدمة من Node: على بعض أجهزة ويندوز يكتشف Node
 * خادمًا داخليًا (127.0.0.1) لا يردّ على استعلامات SRV، فيفشل الاتصال بـ
 * MongoDB Atlas — فيتم هنا إعادة الضبط على خوادم النظام الفعلية/الاحتياطية.
 */
import fs from "node:fs";
import path from "node:path";
import dns from "node:dns";
import { execSync } from "node:child_process";

const DNS_PROBE_HOST = "cluster0.mongodb.net";

async function probeDns(): Promise<boolean> {
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${DNS_PROBE_HOST}`);
    return true;
  } catch {
    try {
      await dns.promises.resolve4(DNS_PROBE_HOST);
      return true;
    } catch {
      return false;
    }
  }
}

async function ensureDnsResolves(): Promise<void> {
  if (await probeDns()) return;

  const servers = new Set<string>();
  try {
    const raw = execSync(
      'powershell -NoProfile -Command "(Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses}).ServerAddresses"',
      { encoding: "utf-8", timeout: 5000 },
    );
    for (const s of raw.split(/[\s,]+/)) {
      const ip = s.trim();
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip) && ip !== "127.0.0.1") {
        servers.add(ip);
      }
    }
  } catch {
    // تجاهل — سنعتمد على الخوادم الاحتياطية
  }

  // خوادم احتياطية عامة
  servers.add("8.8.8.8");
  servers.add("1.1.1.1");

  const list = Array.from(servers);
  dns.setServers(list);
  const ok = await probeDns();
  console.log(
    ok
      ? `✓ تم ضبط خوادم DNS لـ Node: ${list.join(", ")}`
      : `⚠ تعذّرت إعادة ضبط DNS (تم المحاولة بـ: ${list.join(", ")})`,
  );
}

export async function loadEnvLocal(): Promise<void> {
  await ensureDnsResolves();

  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
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

