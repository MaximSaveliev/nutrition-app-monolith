/**
 * AuthButton Component (Deprecated)
 * 
 * Legacy component - replaced by AppHeader and AuthContext
 * Kept for backward compatibility with existing pages
 */
"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { getUser, logout } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AuthButton() {
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      getUser(token).then(setUser).catch(() => {
        localStorage.removeItem("access_token");
      });
    }
  }, []);

  if (!user) return (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline"><Link href="/auth/login">Sign in</Link></Button>
      <Button asChild size="sm"><Link href="/auth/sign-up">Sign up</Link></Button>
    </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          👤 {user.email}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/protected/profile" className="cursor-pointer">
            👤 My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/protected/recipes" className="cursor-pointer">
            📖 My Recipes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/protected/history" className="cursor-pointer">
            📊 Nutrition History
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/protected/scans" className="cursor-pointer">
            🔍 Food Scans
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600"
          onClick={() => {
            logout(localStorage.getItem("access_token") || "").finally(() => {
              localStorage.removeItem("access_token");
              window.location.href = "/";
            });
          }}
        >
          🚪 Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
