"use client";
import { forgotPassword } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    try {
      const response = await forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            We've sent you a password reset link. Please check your email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              Didn't receive the email? Check your spam folder or try again.
            </div>
            <Button variant="outline" className="w-full" onClick={() => setSuccess(false)}>
              Try Again
            </Button>
            <div className="text-center text-sm">
              <Link href="/auth/login" className="underline">
                Back to Login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              placeholder="your@email.com"
              required 
              disabled={loading} 
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </Button>
          <div className="text-center text-sm">
            Remember your password? <Link href="/auth/login" className="underline">Login</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
