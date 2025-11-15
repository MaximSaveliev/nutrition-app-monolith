/**
 * UpdatePasswordForm Component
 * 
 * Controlled Form Component - Handles password reset completion
 * Extracts reset token from URL hash and validates passwords match
 */
"use client";
import { resetPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    
    if (accessToken) {
      setToken(accessToken);
    } else {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!token) {
      setError("Invalid reset token. Please request a new password reset link.");
      return;
    }

    setLoading(true);
    setError("");
    
    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const repeat = (form.elements.namedItem("repeat") as HTMLInputElement).value;

    if (password !== repeat) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await resetPassword(token, password, repeat);
      router.push("/auth/login?password_reset=success");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Password</CardTitle>
        <CardDescription>Enter your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              minLength={8}
              required 
              disabled={loading || !token} 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Min 8 chars, 1 uppercase, 1 digit
            </p>
          </div>
          <div>
            <Label htmlFor="repeat">Confirm New Password</Label>
            <Input 
              id="repeat" 
              name="repeat" 
              type="password" 
              required 
              disabled={loading || !token} 
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading || !token}>
            {loading ? "Updating..." : "Update Password"}
          </Button>
          <div className="text-center text-sm">
            <Link href="/auth/login" className="underline">
              Back to Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
