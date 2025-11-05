"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfirmedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      // Store the token
      localStorage.setItem("access_token", token);
      
      // Redirect to home page after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } else {
      // No token, just redirect after showing message
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-green-600">
            ✓ Email Confirmed!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Your email has been successfully verified. Redirecting you to the home page...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
