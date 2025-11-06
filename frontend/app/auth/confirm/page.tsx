"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      // Supabase redirects here with access_token in URL hash after email confirmation
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("token");
      const type = params.get("type");
      const errorParam = params.get("error");
      const errorDescription = params.get("error_description");

      // Check for errors from Supabase
      if (errorParam) {
        setError(errorDescription || errorParam);
        setTimeout(() => {
          router.push(`/auth/error?error=${errorDescription || errorParam}`);
        }, 2000);
        return;
      }

      // If we have access_token, email is confirmed by Supabase
      if (accessToken && type === "signup") {
        // Email confirmed successfully - redirect to login
        router.push("/auth/login?confirmed=true");
      } else if (accessToken) {
        // Other confirmation types
        router.push("/auth/login?confirmed=true");
      } else {
        // No token yet - this page was loaded directly
        // Wait a moment for Supabase to redirect with token
        setTimeout(() => {
          // If still no token after 3 seconds, show error
          const currentHash = window.location.hash;
          if (!currentHash || !currentHash.includes("access_token")) {
            setError("Invalid or expired confirmation link");
            router.push("/auth/error?error=Invalid confirmation link");
          }
        }, 3000);
      }
    };

    confirmEmail();
  }, [router]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">
          {error || "Confirming your email..."}
        </h2>
        <p className="text-muted-foreground mt-2">
          {error ? "Redirecting..." : "Please wait while we verify your account."}
        </p>
      </div>
    </div>
  );
}
