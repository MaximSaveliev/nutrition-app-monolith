"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();

  useEffect(() => {
    // Supabase redirects here with access_token in URL hash after email confirmation
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const type = params.get("type");

    if (accessToken && type === "signup") {
      // Email confirmed successfully
      // Redirect to login with success message
      router.push("/auth/login?confirmed=true");
    } else if (accessToken) {
      // Other confirmation types
      router.push("/auth/login?confirmed=true");
    } else {
      // No token found
      router.push("/auth/error?error=Invalid confirmation link");
    }
  }, [router]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Confirming your email...</h2>
        <p className="text-muted-foreground mt-2">Please wait while we verify your account.</p>
      </div>
    </div>
  );
}
