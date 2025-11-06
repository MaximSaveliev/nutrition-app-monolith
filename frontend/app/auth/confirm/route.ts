import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    try {
      // Determine the API URL based on environment
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";
      
      const apiUrl = `${baseUrl}/api/auth/verify-email`;
      
      // Call FastAPI backend to verify the email confirmation
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token_hash,
          type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the token if returned
        if (data.access_token) {
          // Redirect with token in URL so client-side can store it
          redirect(`/auth/confirmed?token=${data.access_token}`);
        }
        // redirect user to specified redirect URL or root of app
        redirect(next);
      } else {
        const error = await response.json();
        redirect(`/auth/error?error=${error.detail || "Verification failed"}`);
      }
    } catch (error) {
      redirect(`/auth/error?error=Verification request failed`);
    }
  }

  // redirect the user to an error page with some instructions
  redirect(`/auth/error?error=No token hash or type`);
}
