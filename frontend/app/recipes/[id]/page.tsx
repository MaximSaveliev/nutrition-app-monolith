"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Apple, Flame, Beef, Droplet, ArrowLeft, Wheat } from "lucide-react";

interface Ingredient {
  name: string;
  quantity: string;
  optional: boolean;
}

interface Step {
  step_number: number;
  instruction: string;
  duration_minutes: number;
}

interface Nutrition {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  cholesterol_mg?: number;
}

interface Recipe {
  id: string;
  title: string;
  description?: string;
  author_nickname?: string;
  cuisine_type?: string;
  difficulty: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  dietary_restrictions?: string[];
  ingredients: Ingredient[];
  steps: Step[];
  nutrition: Nutrition;
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch user
    const token = localStorage.getItem("access_token");
    if (token) {
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch(() => {});
    }

    // Fetch recipe
    fetchRecipe();
  }, [params.id]);

  const fetchRecipe = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/recipes/${params.id}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setRecipe(data);
      } else {
        setError("Recipe not found");
      }
    } catch (err) {
      console.error("Error fetching recipe:", err);
      setError("Failed to load recipe");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader user={user} />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <Wheat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">{error || "Recipe not found"}</h2>
            <Button onClick={() => router.push("/recipes")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader user={user} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {/* Recipe Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-lg text-muted-foreground">{recipe.description}</p>
            )}
            {recipe.author_nickname && (
              <p className="text-sm text-muted-foreground mt-2">
                By {recipe.author_nickname}
              </p>
            )}
          </div>

          {/* Meta & Badges */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>{totalTime} min ({recipe.prep_time_minutes} prep + {recipe.cook_time_minutes} cook)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{recipe.servings} servings</span>
            </div>
            <Badge variant="secondary" className={`capitalize ${difficultyColors[recipe.difficulty.toLowerCase()] || ''}`}>
              {recipe.difficulty}
            </Badge>
            {recipe.cuisine_type && (
              <Badge variant="outline" className="capitalize">
                {recipe.cuisine_type}
              </Badge>
            )}
            {recipe.dietary_restrictions && recipe.dietary_restrictions.length > 0 ? (
              recipe.dietary_restrictions.map((restriction, idx) => (
                <Badge key={idx} variant="outline" className="capitalize">
                  {restriction.replace(/_/g, ' ')}
                </Badge>
              ))
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                No dietary restrictions
              </Badge>
            )}
          </div>

          {/* Nutrition Card */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrition per Serving</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center">
                  <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <div className="text-lg font-bold">{Math.round(recipe.nutrition.calories)}</div>
                  <div className="text-xs text-muted-foreground">kcal</div>
                </div>
                <div className="text-center">
                  <Beef className="h-5 w-5 mx-auto mb-1 text-red-500" />
                  <div className="text-lg font-bold">{Math.round(recipe.nutrition.protein_g)}g</div>
                  <div className="text-xs text-muted-foreground">protein</div>
                </div>
                <div className="text-center">
                  <Wheat className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <div className="text-lg font-bold">{Math.round(recipe.nutrition.carbs_g)}g</div>
                  <div className="text-xs text-muted-foreground">carbs</div>
                </div>
                <div className="text-center">
                  <Droplet className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                  <div className="text-lg font-bold">{Math.round(recipe.nutrition.fat_g)}g</div>
                  <div className="text-xs text-muted-foreground">fat</div>
                </div>
              </div>
              
              {/* Additional Nutrition */}
              {(recipe.nutrition.fiber_g || recipe.nutrition.sugar_g || recipe.nutrition.sodium_mg) && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                  {recipe.nutrition.fiber_g && (
                    <div className="text-center">
                      <div className="text-sm font-semibold">{Math.round(recipe.nutrition.fiber_g)}g</div>
                      <div className="text-xs text-muted-foreground">Fiber</div>
                    </div>
                  )}
                  {recipe.nutrition.sugar_g && (
                    <div className="text-center">
                      <div className="text-sm font-semibold">{Math.round(recipe.nutrition.sugar_g)}g</div>
                      <div className="text-xs text-muted-foreground">Sugar</div>
                    </div>
                  )}
                  {recipe.nutrition.sodium_mg && (
                    <div className="text-center">
                      <div className="text-sm font-semibold">{Math.round(recipe.nutrition.sodium_mg)}mg</div>
                      <div className="text-xs text-muted-foreground">Sodium</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ingredients Card */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>{recipe.servings} servings</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <span className="font-medium">{ingredient.quantity}</span> {ingredient.name}
                      {ingredient.optional && <span className="text-muted-foreground text-sm ml-1">(optional)</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
              <CardDescription>Total time: {totalTime} minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {recipe.steps.map((step) => (
                  <li key={step.step_number} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {step.step_number}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{step.instruction}</p>
                      {step.duration_minutes > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {step.duration_minutes} min
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
