"use client";
import { AppHeader } from "@/components/app-header";
import { DishAnalyzer } from "@/components/dish-analyzer";
import { ScanSearch, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function AnalyzeDishPage() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Scan Dish AI
            </h1>
            <p className="text-muted-foreground">
              Take a photo of your dish - AI will analyze calories and nutrition
            </p>
          </div>

          <DishAnalyzer />
        </div>
      </main>
    </div>
  );
}
