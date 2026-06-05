import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude login page from protection to avoid redirect loop
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Define basic redirect url
  const loginUrl = new URL("/admin/login", request.url);

  // 1. Check custom admin session cookie first
  const adminSession = request.cookies.get("admin_session");
  if (adminSession?.value === "authenticated") {
    return NextResponse.next();
  }

  // 2. Check Supabase Auth Session
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const response = NextResponse.next();
      
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value);
                response.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const hasAdminMeta =
          user.app_metadata?.isAdmin === true ||
          user.user_metadata?.isAdmin === true ||
          user.app_metadata?.role === "admin" ||
          user.role === "authenticated";

        if (hasAdminMeta) {
          return response;
        }
      }
    }
  } catch (error) {
    console.error("Proxy admin auth check failed:", error);
  }

  // Redirect to login if not authenticated
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Matches all routes under /admin, including subpaths, but excluding static files/assets
  matcher: ["/admin/:path*"],
};
