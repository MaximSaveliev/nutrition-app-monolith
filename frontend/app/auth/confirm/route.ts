import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Email Confirmation Route Handler
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash") || searchParams.get("token");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error && data.user) {
      // Sign out user
      await supabase.auth.signOut();
      
      // Check if already verified
      const alreadyVerified = data.user.email_confirmed_at !== null;
      
      // Build redirect URL with proper query params
      const loginUrl = new URL("/auth/login", request.url);
      if (alreadyVerified) {
        loginUrl.searchParams.set("message", "Email already verified. Please login.");
      } else {
        loginUrl.searchParams.set("confirmed", "true");
      }
      
      return NextResponse.redirect(loginUrl);
    }
    
    // Error - token invalid
    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("error", "Verification link expired or invalid");
    return NextResponse.redirect(errorUrl);
  }

  // No token
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
