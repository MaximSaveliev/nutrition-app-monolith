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

  console.log("=== Email Confirmation ===");
  console.log("Full URL:", request.url);
  console.log("token_hash:", token_hash);
  console.log("type:", type);

  // If we have a token, verify it
  if (token_hash && type) {
    const supabase = await createClient();
    
    // Verify the token
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    console.log("Verification result - error:", error);
    console.log("Verification result - user:", data?.user?.email);
    console.log("Email confirmed at:", data?.user?.email_confirmed_at);

    if (!error && data.user) {
      // Check if email was already confirmed
      if (data.user.email_confirmed_at) {
        // Email already verified - sign out and redirect
        await supabase.auth.signOut();
        
        console.log("Already verified, redirecting to login with message");
        return NextResponse.redirect(
          new URL("/auth/login?message=Email already verified. Please login.", request.url)
        );
      }
      
      // First time verification - sign out and show success
      await supabase.auth.signOut();
      
      console.log("First time verification, redirecting to login with confirmed=true");
      return NextResponse.redirect(
        new URL("/auth/login?confirmed=true", request.url)
      );
    } else {
      // Token expired or invalid
      console.log("Token invalid or expired");
      return NextResponse.redirect(
        new URL("/auth/error?error=Verification link expired or invalid", request.url)
      );
    }
  }

  // No token - just redirect to login
  console.log("No token found, redirecting to login");
  return NextResponse.redirect(
    new URL("/auth/login", request.url)
  );
}
