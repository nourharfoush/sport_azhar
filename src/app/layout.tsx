import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "منظومة متابعة الفعاليات والمسابقات الرياضية - الأزهر الشريف",
  description:
    "النظام الإلكتروني لمتابعة الأنشطة والمسابقات الرياضية بين الإدارة العامة والمناطق والإدارات التعليمية والمعاهد الأزهرية",
};

/**
 * إزالة سمات الامتدادات (bis_* من مكافئ الفيروسات) التي تُحقن في DOM
 * وتُسبّب عدم تطابق الـ hydration. يُنفَّذ قبل تفاعل React.
 */
const CLEAN_EXTENSION_ATTRS = `
(function() {
  var ATTRS = ['bis_skin_checked', 'bis_register', '__processed_'];
  function clean(node) {
    if (!node || node.nodeType !== 1) return;
    for (var i = 0; i < node.attributes.length; i++) {
      var attr = node.attributes[i];
      if (attr && (ATTRS.indexOf(attr.name) !== -1 || attr.name.indexOf('bis_') === 0)) {
        node.removeAttribute(attr.name);
        i--;
      }
    }
    for (var c = node.firstElementChild; c; c = c.nextElementSibling) {
      clean(c);
    }
  }
  clean(document.documentElement);
  var obs = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];
      if (m.type === 'attributes' && m.attributeName && m.attributeName.indexOf('bis_') === 0) {
        m.target.removeAttribute(m.attributeName);
      }
    }
  });
  obs.observe(document.documentElement, { attributes: true, subtree: true });
  setTimeout(function() { obs.disconnect(); }, 4000);
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body
        className="font-[family-name:var(--font-cairo)] min-h-screen bg-slate-50 text-slate-900 antialiased"
        suppressHydrationWarning
      >
        {children}
        <Script
          id="clean-extension-attrs"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: CLEAN_EXTENSION_ATTRS }}
        />
      </body>
    </html>
  );
}


