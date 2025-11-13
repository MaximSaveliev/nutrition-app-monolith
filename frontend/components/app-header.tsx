/**
 * AppHeader Component
 * 
 * Composite Component Pattern - Main application header with responsive navigation
 * Handles desktop and mobile layouts, authentication state, and theme switching
 * Integrates AuthContext for user state management
 */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, User, Scan, BarChart3, Apple, LogOut, ChefHat, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/auth-context";

export function AppHeader() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <Apple className="h-6 w-6 text-primary" />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                NutriSnap
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
          </div>
        </div>
      </header>
    );
  }

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { href: "/analyze-dish", label: "Scan Dish AI", icon: Scan },
    { href: "/generate-recipe", label: "Gen Recipe AI", icon: Utensils },
    { href: "/recipes", label: "Recipes AI", icon: ChefHat },
    { href: "/statistics", label: "Statistics", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4 md:hidden w-full">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 flex flex-col p-0 [&>button]:hidden">
              <div className="p-6 border-b flex items-center justify-between">
                <SheetTitle>
                  <div className="flex items-center gap-2.5">
                    <Apple className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-xl font-bold">NutriSnap</span>
                  </div>
                </SheetTitle>
                <SheetClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </SheetClose>
              </div>

              <nav className="flex-1 flex flex-col gap-1 p-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-accent transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-md bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium text-base">{item.label}</span>
                  </Link>
                ))}
              </nav>

              {user && (
                <div className="border-t p-4 space-y-2">
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-foreground">
                        {user.nickname?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">
                        {user.nickname || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-3 h-auto text-base"
                    onClick={handleLogout}
                  >
                    <div className="h-9 w-9 rounded-md flex items-center justify-center">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <span className="font-medium">Logout</span>
                  </Button>
                </div>
              )}

              {!user && (
                <div className="border-t p-4 space-y-2">
                  <Link href="/auth/login" onClick={() => setOpen(false)} className="block">
                    <Button variant="outline" className="w-full h-12 text-base font-medium">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/auth/sign-up" onClick={() => setOpen(false)} className="block">
                    <Button className="w-full h-12 text-base font-medium">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex items-center gap-2 flex-1 justify-center">
            <Apple className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">NutriSnap</span>
          </Link>

          <ThemeSwitcher />
        </div>

          <div className="hidden md:flex items-center w-full">
            <Link href="/" className="flex items-center gap-2 mr-8">
            <Apple className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">NutriSnap</span>
          </Link>

          {/* Navigation (if logged in) */}
          {user && (
            <nav className="flex items-center gap-1 flex-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className="gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          )}

            <div className="flex-1" />

            <div className="flex items-center gap-2">
            <ThemeSwitcher />
            
            {user ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    {user.nickname || "Profile"}
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline">Log In</Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
