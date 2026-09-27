"use client";

import { useActionState, useEffect } from "react";

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: (state: any, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  submitLabel: string;
  submitVariant?: "emerald" | "rose";
  children: React.ReactNode;
}

export function ActionModal({
  isOpen,
  onClose,
  title,
  action,
  submitLabel,
  submitVariant = "emerald",
  children,
}: ActionModalProps) {
  const [state, formAction, isPending] = useActionState(action, { success: false });

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden transform transition-all my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          {state?.error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
              {state.error}
            </div>
          )}

          {children}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition ${
                submitVariant === "rose"
                  ? "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400"
                  : "bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-500"
              }`}
            >
              {isPending ? "جاري التنفيذ..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
