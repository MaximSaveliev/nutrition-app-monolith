import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Email Confirmation Route Handler
 * 
 * Handles Supabase email verification redirect.
 * When user clicks email link, Supabase verifies and redirects here.
 * We verify once, then on subsequent clicks just redirect to login.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Check for token in query params (from Supabase redirect)
  const token_hash = searchParams.get("token_hash") || searchParams.get("token");
  const type = searchParams.get("type") as EmailOtpType | null;

  // If we have a token, verify it
  if (token_hash && type) {
    const supabase = await createClient();
    
    // Verify the token
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });


    if (!error && data.user) {
      // Check if email was already confirmed
      if (data.user.email_confirmed_at) {
        // Email already verified - sign out and redirect
        await supabase.auth.signOut();
        
        return NextResponse.redirect(
          new URL("/auth/login?message=Email already verified. Please login.", request.url)
        );
      }
      
      // First time verification - sign out and show success
      await supabase.auth.signOut();
      
      return NextResponse.redirect(
        new URL("/auth/login?confirmed=true", request.url)
      );
    } else {
      // Token expired or invalid
      return NextResponse.redirect(
        new URL("/auth/error?error=Verification link expired or invalid", request.url)
      );
    }
  }

  // No token - just redirect to login
  return NextResponse.redirect(
    new URL("/auth/login", request.url)
  );
}
