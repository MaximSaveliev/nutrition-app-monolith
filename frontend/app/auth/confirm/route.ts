import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    if (!error) {
      // Email confirmed successfully - redirect to confirmed page
      redirect("/auth/confirmed");
    } else {
      // Redirect to error page with error message
      redirect(`/auth/error?error=${error.message}`);
    }
  }

  // No token hash or type - redirect to error
  redirect("/auth/error?error=Missing token or type");
}
