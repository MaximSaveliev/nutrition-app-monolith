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

  // Debug logging
  console.log("=== CONFIRM ROUTE ===");
  console.log("Full URL:", request.url);
  console.log("All params:", Object.fromEntries(searchParams.entries()));
  console.log("token_hash/token:", token_hash);
  console.log("type:", type);

  if (token_hash && type) {
    const supabase = await createClient();
    
    console.log("Calling verifyOtp...");
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    console.log("VerifyOtp result:", { error: error?.message, userEmail: data?.user?.email });

    if (!error && data.user) {
      // Sign out user
      await supabase.auth.signOut();
      
      // Check if already verified
      const alreadyVerified = data.user.email_confirmed_at !== null;
      
      console.log("Already verified?", alreadyVerified);
      
      // Build redirect URL with proper query params
      const loginUrl = new URL("/auth/login", request.url);
      if (alreadyVerified) {
        loginUrl.searchParams.set("message", "Email already verified. Please login.");
      } else {
        loginUrl.searchParams.set("confirmed", "true");
      }
      
      console.log("Redirecting to:", loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }
    
    // Error - token invalid
    console.log("Token invalid, redirecting to error page");
    const errorUrl = new URL("/auth/error", request.url);
    errorUrl.searchParams.set("error", "Verification link expired or invalid");
    return NextResponse.redirect(errorUrl);
  }

  // No token
  console.log("No token found, redirecting to plain login");
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
