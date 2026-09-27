"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { verifyPassword, signSession, sessionCookieName, sessionCookieOptions } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "أدخل البريد الإلكتروني وكلمة المرور." };
  }

  await dbConnect();
  const user = await User.findOne({ email }).lean();
  if (!user) {
    return { error: "بيانات الدخول غير صحيحة." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "بيانات الدخول غير صحيحة." };
  }

  const token = await signSession({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    regionId: user.region ? String(user.region) : null,
    administrationId: user.administration ? String(user.administration) : null,
    instituteId: user.institute ? String(user.institute) : null,
  });

  const store = await cookies();
  store.set(sessionCookieName(), token, sessionCookieOptions);
  redirect("/dashboard");
}

export async function logoutAction() {
  const store = await cookies();
  store.delete(sessionCookieName());
  redirect("/login");
}
