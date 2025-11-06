import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get token_hash and type from query params
  // Email template should use: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  console.log("Confirm route - token_hash:", token_hash);
  console.log("Confirm route - type:", type);

  if (token_hash && type) {
    try {
      // Get the API URL from the request origin
      const origin = new URL(request.url).origin;
      const apiUrl = `${origin}/api/auth/verify-email`;
      
      console.log("Calling API:", apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token_hash, type }),
      });

      console.log("API response status:", response.status);
      
      if (response.ok) {
        console.log("Success! Redirecting to /auth/confirmed");
        return NextResponse.redirect(new URL("/auth/confirmed", request.url));
      } else {
        const error = await response.json();
        console.log("API error:", error);
        return NextResponse.redirect(new URL(`/auth/error?error=${error.detail || "Verification failed"}`, request.url));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      return NextResponse.redirect(new URL("/auth/error?error=Verification request failed", request.url));
    }
  }

  // No token hash or type - redirect to error
  console.log("Missing token or type - check Supabase email template");
  return NextResponse.redirect(new URL("/auth/error?error=Missing token or type", request.url));
}
