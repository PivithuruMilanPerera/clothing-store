import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isAdminUser,
  sanitizeAdminRedirectPath,
  sanitizeRedirectPath,
} from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAccountRoute = pathname.startsWith("/account");
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/login/forgot-password";
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname === "/admin/login";

  if (isAdminRoute && !isAdminLoginRoute) {
    if (!user) {
      const adminLoginUrl = request.nextUrl.clone();
      adminLoginUrl.pathname = "/admin/login";
      adminLoginUrl.searchParams.set(
        "redirect",
        sanitizeAdminRedirectPath(pathname),
      );
      return NextResponse.redirect(adminLoginUrl);
    }

    const isAdmin = await isAdminUser(supabase, user.id);

    if (!isAdmin) {
      const adminLoginUrl = request.nextUrl.clone();
      adminLoginUrl.pathname = "/admin/login";
      adminLoginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  if (isAdminLoginRoute && user) {
    const isAdmin = await isAdminUser(supabase, user.id);

    if (isAdmin) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = sanitizeAdminRedirectPath(
        request.nextUrl.searchParams.get("redirect"),
      );
      adminUrl.search = "";
      return NextResponse.redirect(adminUrl);
    }
  }

  if (isAccountRoute) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", sanitizeRedirectPath(pathname));
      return NextResponse.redirect(loginUrl);
    }

    const isAdmin = await isAdminUser(supabase, user.id);

    if (isAdmin) {
      const adminUrl = request.nextUrl.clone();
      adminUrl.pathname = "/admin";
      adminUrl.search = "";
      return NextResponse.redirect(adminUrl);
    }
  }

  if (isAuthRoute && user) {
    const isAdmin = await isAdminUser(supabase, user.id);
    const accountUrl = request.nextUrl.clone();
    accountUrl.pathname = isAdmin ? "/admin" : "/account";
    accountUrl.search = "";
    return NextResponse.redirect(accountUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
