"use client";

import { useEffect, useState } from "react";

const THEME_KEY = "azhar-theme";

/**
 * زر تبديل الوضع الليلي/النهاري.
 * يُطبّق class "dark" على <html> ويحفظ الاختيار في localStorage.
 */
export function ThemeToggle({
  compact = false,
  tone = "dark",
}: {
  compact?: boolean;
  /** dark = زر فاتح يناسب الشريط الجانبي الداكن، light = زر داكن يناسب الخلفيات الفاتحة */
  tone?: "dark" | "light";
}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* تجاهل أخطاء التخزين */
    }
  };

  const shell =
    tone === "dark"
      ? "border-slate-700 bg-slate-800/60 text-slate-300 hover:border-emerald-700 hover:text-emerald-300"
      : "border-slate-200 bg-white/80 text-slate-600 hover:border-emerald-500 hover:text-emerald-700";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي"}
      title={dark ? "الوضع النهاري" : "الوضع الليلي"}
      className={`flex items-center justify-center gap-2 rounded-xl border transition ${shell} ${
        compact ? "h-10 w-10 text-sm" : "w-full px-3 py-2.5 text-xs font-semibold"
      }`}
    >
      <span aria-hidden>{dark ? "☀️" : "🌙"}</span>
      {!compact && <span>{dark ? "الوضع النهاري" : "الوضع الليلي"}</span>}
    </button>
  );
}
