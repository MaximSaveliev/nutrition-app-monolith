"use client";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b">
        <div className="max-w-5xl mx-auto flex justify-between items-center p-4">
          <Link href="/" className="font-bold text-xl">🍽️ Nutrition App</Link>
          <div className="flex gap-4">
            <AuthButton />
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        <div className="text-center py-12 space-y-4">
          <h1 className="text-4xl font-bold">AI-Powered Recipe & Nutrition App</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Take a photo of your food to get instant nutrition analysis,
            or snap your ingredients to generate delicious recipes.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="font-bold mb-2">Photo Food Analysis</h3>
            <p className="text-sm text-muted-foreground">Get instant calorie and nutrition info</p>
          </div>
          <div className="p-6 border rounded-lg">
            <div className="text-4xl mb-4">🥗</div>
            <h3 className="font-bold mb-2">Recipe Generation</h3>
            <p className="text-sm text-muted-foreground">Photo ingredients, get step-by-step recipes</p>
          </div>
          <div className="p-6 border rounded-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-bold mb-2">Smart Search</h3>
            <p className="text-sm text-muted-foreground">Find recipes by dietary restrictions</p>
          </div>
        </div>
      </main>

      <footer className="border-t p-4 text-center text-sm text-muted-foreground">
        Powered by FastAPI + Supabase + Groq AI
      </footer>
    </div>
  );
}
