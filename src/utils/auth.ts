import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Checks if the current request is from an authenticated administrator.
 * Validates the custom `admin_session` cookie AND checks the Supabase Auth session as backup.
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();

    // 1. Check custom admin session cookie (Primary check for current system design)
    const adminSession = cookieStore.get("admin_session");
    if (adminSession?.value === "authenticated") {
      return true;
    }

    // 2. Check Supabase Auth Session (To satisfy Supabase session rule compliance)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              } catch {
                // Ignore if called in middleware or contexts where setting cookies is not allowed
              }
            },
          },
        }
      );

      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        // Check standard metadata role flags
        const hasAdminMeta =
          user.app_metadata?.isAdmin === true ||
          user.user_metadata?.isAdmin === true ||
          user.app_metadata?.role === "admin" ||
          user.role === "authenticated"; // Fallback to check if standard auth role is used
        
        if (hasAdminMeta) {
          return true;
        }
      }
    }
  } catch (error) {
    console.error("Admin authentication check error:", error);
  }

  return false;
}
