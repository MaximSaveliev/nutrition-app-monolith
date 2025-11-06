import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Handle both formats:
  // 1. Direct link: ?token_hash=xxx&type=signup
  // 2. Supabase redirect: ?token=xxx&type=signup (from Supabase's /verify endpoint)
  let token_hash = searchParams.get("token_hash") || searchParams.get("token");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    try {
      // Get the API URL from the request origin
      const origin = new URL(request.url).origin;
      const apiUrl = `${origin}/api/auth/verify-email`;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token_hash, type }),
      });

      if (response.ok) {
        // Email verified successfully - redirect to confirmed page
        redirect("/auth/confirmed");
      } else {
        const error = await response.json();
        redirect(`/auth/error?error=${error.detail || "Verification failed"}`);
      }
    } catch (error) {
      redirect("/auth/error?error=Verification request failed");
    }
  }

  // No token hash or type - redirect to error
  redirect("/auth/error?error=Missing token or type");
}
