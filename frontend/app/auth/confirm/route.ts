import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Email Confirmation Route Handler
 * 
 * Handles Supabase email verification redirect.
 * When user clicks email link, Supabase verifies and redirects here.
 * We just check if there's a valid token and redirect to login.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Check for token in query params (from Supabase redirect)
  const token_hash = searchParams.get("token_hash") || searchParams.get("token");
  const type = searchParams.get("type") as EmailOtpType | null;

  // If we have a token, it means email was verified by Supabase
  if (token_hash && type) {
    const supabase = await createClient();
    
    // Verify the token
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Email verified successfully - sign out and redirect to login
      await supabase.auth.signOut();
      
      return NextResponse.redirect(
        new URL("/auth/login?confirmed=true", request.url)
      );
    }
  }

  // If no token or verification failed, just redirect to login anyway
  // (Supabase already verified it before redirecting here)
  // return NextResponse.redirect(
  //   new URL("/auth/login?confirmed=true", request.url)
  // );
}
