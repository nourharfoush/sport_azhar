import type { Metadata } from "next";
import { Cairo } from "next/font/google";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="font-[family-name:var(--font-cairo)] min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}

