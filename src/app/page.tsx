import Link from "next/link";
import { getSession } from "@/lib/auth";
import { displayName } from "@/types";

export default async function HomePage() {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-col">
      {/* رأس الصفحة */}
      <header className="border-b border-emerald-900/10 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
              أ
            </div>
            <div>
              <div className="font-bold text-lg text-emerald-950">
                الأزهر الشريف
              </div>
              <div className="text-xs text-slate-500">
                الإدارة العامة للرعاية الرياضية
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {session ? (
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition shadow-sm"
              >
                الدخول للوحة التحكم ({displayName(session.name)})
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition shadow-sm"
              >
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-200">
            المنظومة الرقمية للأنشطة الرياضية
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
            متابعة الفعاليات والمسابقات الرياضية
            <span className="block text-emerald-700 mt-2">
              بالمعاهد والمناطق الأزهرية
            </span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            منظومة متكاملة تربط مستويات العمل الأربعة في الأزهر الشريف لرصد
            الأنشطة الرياضية، تسجيل الفرق، متابعة النتائج، وإصدار التقارير
            الفورية بكل دقة وسهولة.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="px-8 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-base shadow-lg shadow-emerald-700/20 transition"
            >
              ابدأ الآن
            </Link>
          </div>
        </div>

        {/* مستويات المتابعة الأربعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="font-bold text-slate-900 mb-2">الإدارة العامة</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              إطلاق البطولات المركزية على مستوى الجمهورية، ومتابعة مؤشرات أداء
              جميع المناطق.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="font-bold text-slate-900 mb-2">المناطق الأزهرية</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              تنظيم بطولات المنطقة، وتوزيع المهام على الإدارات التعليمية،
              وتجميع النتائج الإقليمية.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="font-bold text-slate-900 mb-2">الإدارات التعليمية</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              الإشراف المباشر على معاهد الإدارة، وحصر المشاركات الرياضية وتنسيق
              المسابقات المحلية.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mb-4">
              4
            </div>
            <h3 className="font-bold text-slate-900 mb-2">المعاهد الأزهرية</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              تسجيل فرق المعهد والطلاب، وتحديث حالة المشاركة ورصد النتائج
              والمراكز المحققة.
            </p>
          </div>
        </div>
      </main>

      {/* التذييل */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        الأزهر الشريف - الإدارة العامة للرعاية الرياضية © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

