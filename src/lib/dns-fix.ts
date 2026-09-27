import dns from "node:dns";
import { execSync } from "node:child_process";

/** استخراج مضيف Atlas من ربط mongodb+srv لاستخدامه في فحص DNS. */
function probeHostFromUri(): string {
  const uri = process.env.MONGODB_URI ?? "";
  // تجاهل بيانات الاتصال (user:pass@) وأي مسار/استعلام بعد المضيف
  const m = uri.match(/^mongodb\+srv:\/\/(?:[^@/?]+@)?([^/?]+)/);
  return m ? m[1] : "cluster0.mongodb.net";
}

async function probeDns(): Promise<boolean> {
  const host = probeHostFromUri();
  try {
    await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
    return true;
  } catch {
    try {
      await dns.promises.resolve4(host);
      return true;
    } catch {
      return false;
    }
  }
}

let dnsFixPromise: Promise<boolean> | null = null;

/**
 * على بعض أجهزة ويندوز يكتشف Node خادم DNS داخليًا (127.0.0.1) لا يردّ على
 * استعلامات SRV، فيفشل الاتصال بـ MongoDB Atlas — تُعاد هنا ضبط خوادم DNS
 * على خوادم النظام الفعلية/الاحتياطية عند الحاجة. تُنفَّذ مرة واحدة لكل عملية.
 * @returns true إذا كان DNS يعمل (أو تم إصلاحه)، false عند فشل الاختبار.
 */
export function ensureDnsResolves(): Promise<boolean> {
  if (!dnsFixPromise) {
    dnsFixPromise = (async () => {
      if (await probeDns()) return true;

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
      return ok;
    })();
  }
  return dnsFixPromise;
}