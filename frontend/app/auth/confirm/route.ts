import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Email Confirmation Route Handler
 * 
 * Handles email verification after user clicks confirmation link from email.
 * Flow: Email link → This route → Backend verification → Clear session → Redirect to login
 * 
 * Email template should use: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Validate required parameters
  if (!token_hash || !type) {
    return NextResponse.redirect(
      new URL("/auth/error?error=Missing verification token", request.url)
    );
  }

  try {
    // Call backend to verify email token
    const origin = new URL(request.url).origin;
    const response = await fetch(`${origin}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token_hash, type }),
    });

    if (response.ok) {
      // Clear any session cookies created by Supabase
      const supabase = await createClient();
      await supabase.auth.signOut();
      
      // Success - redirect to login with confirmation message
      return NextResponse.redirect(
        new URL("/auth/login?confirmed=true", request.url)
      );
    } else {
      // Verification failed
      const error = await response.json();
      return NextResponse.redirect(
        new URL(`/auth/error?error=${error.detail || "Verification failed"}`, request.url)
      );
    }
  } catch (error) {
    // Network or unexpected error
    console.error("Email verification error:", error);
    return NextResponse.redirect(
      new URL("/auth/error?error=Verification request failed", request.url)
    );
  }
}
