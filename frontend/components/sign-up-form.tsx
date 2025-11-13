/**
 * SignUpForm Component
 * 
 * Controlled Form Component - Handles user registration
 * Validates password matching and enforces password strength requirements
 */
"use client";
import { signup } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function SignUpForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const nickname = (form.elements.namedItem("nickname") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const repeat = (form.elements.namedItem("repeat") as HTMLInputElement).value;

    if (password !== repeat) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await signup(email, password, repeat, nickname);
      window.location.href = "/auth/sign-up-success";
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              required 
              disabled={loading}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Label htmlFor="nickname">Nickname</Label>
            <Input 
              id="nickname" 
              name="nickname" 
              type="text" 
              minLength={3} 
              maxLength={50}
              pattern="[a-zA-Z0-9_-]+"
              required 
              disabled={loading} 
              placeholder="e.g., ChefMaster"
            />
            <p className="text-xs text-muted-foreground mt-1">3-50 characters (letters, numbers, _, -)</p>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              minLength={8} 
              required 
              disabled={loading}
              placeholder="Min 8 characters"
            />
            <p className="text-xs text-muted-foreground mt-1">Min 8 chars, 1 uppercase, 1 digit</p>
          </div>
          <div>
            <Label htmlFor="repeat">Confirm Password</Label>
            <Input 
              id="repeat" 
              name="repeat" 
              type="password" 
              required 
              disabled={loading}
              placeholder="Re-enter your password"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </Button>
          <div className="text-center text-sm">
            Already have an account? <Link href="/auth/login" className="underline">Login</Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
