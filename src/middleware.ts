import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me-in-production-azhar-sports",
);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("azhar_session")?.value;
  const { pathname } = req.nextUrl;

  const isProtected = pathname.startsWith("/dashboard");

  if (!isProtected) {
    // إن كان مسجّلاً وفتح صفحة الدخول، حوّله للوحة التحكم
    if (token && pathname === "/login") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const url = new URL("/login", req.url);
    url.searchParams.set("from", pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete("azhar_session");
    return res;
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
