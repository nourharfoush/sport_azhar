"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-2xl mx-auto mb-3 shadow-lg shadow-emerald-700/30">
            أ
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            الأزهر الشريف
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            منظومة متابعة الفعاليات والمسابقات الرياضية
          </p>
        </div>

        {state?.error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              name="email"
              required
              dir="ltr"
              placeholder="user@azhar.edu.eg"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              كلمة المرور
            </label>
            <input
              type="password"
              name="password"
              required
              dir="ltr"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-sm transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-base transition shadow-md shadow-emerald-700/20 mt-2"
          >
            {isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            حسابات تجريبية للمستويات الأربعة (كلمة المرور:{" "}
            <code className="text-emerald-700 font-mono">azhar123</code>):
          </p>
          <div className="space-y-1 text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200" dir="ltr">
            <div>الإدارة العامة: general@azhar.edu.eg</div>
            <div>المنطقة: cairo.region@azhar.edu.eg</div>
            <div>الإدارة التعليمية: nasr.admin@azhar.edu.eg</div>
            <div>المعهد: model.institute@azhar.edu.eg</div>
          </div>
        </div>
      </div>
    </div>
  );
}
