"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/api-client";
import { DishAnalyzer } from "@/components/dish-analyzer";
import { RecipeGenerator } from "@/components/recipe-generator";
import { NutritionDashboard } from "@/components/nutrition-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGoalNotifications } from "@/hooks/use-goal-notifications";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Enable goal notifications when user is logged in
  useGoalNotifications(!!user);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/auth/login");
      return;
    }

    getUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
        router.push("/auth/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🍽️</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Nutrition Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user.email}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <Tabs defaultValue="analyze" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analyze">📸 Analyze Dish</TabsTrigger>
            <TabsTrigger value="generate">🥗 Generate Recipe</TabsTrigger>
            <TabsTrigger value="stats">📊 My Stats</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-4">
            <DishAnalyzer />
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <RecipeGenerator />
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <NutritionDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
