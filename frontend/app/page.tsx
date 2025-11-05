import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { DishAnalyzer } from "@/components/dish-analyzer";
import { RecipeGenerator } from "@/components/recipe-generator";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-8 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"} className="text-xl">🥗 Nutrition App</Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              <AuthButton />
            </div>
          </div>
        </nav>

        <div className="flex-1 w-full max-w-7xl p-5">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">AI-Powered Nutrition & Recipe Assistant</h1>
            <p className="text-lg text-muted-foreground">
              Analyze dishes, generate recipes, and manage your dietary preferences with AI
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">📸 Dish Analyzer</h2>
              <DishAnalyzer />
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-4">👨‍🍳 Recipe Generator</h2>
              <RecipeGenerator />
            </div>
          </div>

          <div className="mt-12 p-6 bg-muted rounded-lg">
            <h3 className="text-xl font-semibold mb-4">✨ Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-semibold mb-2">🔍 AI Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Upload any dish photo to get instant nutritional breakdown using Groq AI
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-semibold mb-2">📝 Smart Recipes</h4>
                <p className="text-sm text-muted-foreground">
                  Generate step-by-step recipes from ingredients with dietary restrictions support
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <h4 className="font-semibold mb-2">🎯 Dietary Support</h4>
                <p className="text-sm text-muted-foreground">
                  Vegan, vegetarian, keto, gluten-free, and more dietary restrictions supported
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-primary/5 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">🏗️ Architecture Highlights</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="p-3 bg-background rounded text-center">
                <div className="font-semibold">Factory</div>
                <div className="text-xs text-muted-foreground">AI Providers</div>
              </div>
              <div className="p-3 bg-background rounded text-center">
                <div className="font-semibold">Singleton</div>
                <div className="text-xs text-muted-foreground">DB Connection</div>
              </div>
              <div className="p-3 bg-background rounded text-center">
                <div className="font-semibold">Builder</div>
                <div className="text-xs text-muted-foreground">Recipe Builder</div>
              </div>
              <div className="p-3 bg-background rounded text-center">
                <div className="font-semibold">Strategy</div>
                <div className="text-xs text-muted-foreground">Dietary Rules</div>
              </div>
              <div className="p-3 bg-background rounded text-center">
                <div className="font-semibold">Chain</div>
                <div className="text-xs text-muted-foreground">Image Pipeline</div>
              </div>
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p>
            Built with FastAPI + Next.js + Supabase + Groq AI • Monolith Architecture
          </p>
        </footer>
      </div>
    </main>
  );
}
