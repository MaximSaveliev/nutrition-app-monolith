"use client";
import { AppHeader } from "@/components/app-header";
import { PublicRecipes } from "@/components/public-recipes";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scan, Camera, Apple, Gift } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg text-muted-foreground">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      <main className="flex-1">
        {/* Hero Section - Only show if not logged in */}
        {!user && (
          <section className="border-b bg-gradient-to-b from-background to-muted/20">
            <div className="container max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                AI-Powered Recipe & Nutrition App
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Take a photo of your food to get instant nutrition analysis,
                or snap your ingredients to generate delicious recipes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={() => router.push("/analyze-dish")} size="lg" className="text-lg py-3">
                  <Gift className="h-8 w-8" />
                  Try It Free (3 requests)
                </Button>
                <Button
                  onClick={() => router.push("/auth/sign-up")}
                  variant="outline"
                  size="lg"
                  className="text-lg"
                >
                  Sign Up for Unlimited
                </Button>
              </div>

              {/* Feature Cards */}
              <div className="grid md:grid-cols-3 gap-6 mt-16">
                <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
                  <Camera className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-bold text-lg mb-2">Photo Food Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant calorie and nutrition info from dish photos
                  </p>
                </div>
                <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
                  <Apple className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-bold text-lg mb-2">Recipe Generation</h3>
                  <p className="text-sm text-muted-foreground">
                    Photo ingredients, get step-by-step cooking recipes
                  </p>
                </div>
                <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
                  <Scan className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-bold text-lg mb-2">Nutrition Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    Track daily macros and achieve your health goals
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Public Recipes Section */}
        <section className="container max-w-6xl mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Community Recipes</h2>
            <p className="text-muted-foreground">
              Discover delicious recipes shared by our community
            </p>
          </div>
          <PublicRecipes />
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          Powered by FastAPI + Supabase + Groq AI
        </div>
      </footer>
    </div>
  );
}

