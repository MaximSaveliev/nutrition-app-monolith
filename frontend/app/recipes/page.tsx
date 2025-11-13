"use client";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Clock, Users, Flame, Plus, Beef, Apple, Droplet, Wheat, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const RECIPES_PER_BATCH = 6;

interface Recipe {
  id: string;
  title: string;
  description?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: string;
  cuisine_type?: string;
  dietary_restrictions?: string[];
  author_nickname?: string;
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

export default function RecipesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMyRecipes, setShowMyRecipes] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(1);

  // Redirect if not logged in (after auth check completes)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setLoading(true);
    setCurrentBatch(1); // Reset batch when switching tabs

    // Fetch recipes
    const url = `${BACKEND_URL}/api/recipes?my_recipes=${showMyRecipes}`;
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setAllRecipes(data || []);
        setDisplayedRecipes((data || []).slice(0, RECIPES_PER_BATCH));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching recipes:", err);
        setLoading(false);
      });
  }, [showMyRecipes]);

  const loadMoreRecipes = () => {
    setLoadingMore(true);
    
    setTimeout(() => {
      const nextBatch = currentBatch + 1;
      const endIndex = nextBatch * RECIPES_PER_BATCH;
      
      setDisplayedRecipes(allRecipes.slice(0, endIndex));
      setCurrentBatch(nextBatch);
      setLoadingMore(false);
    }, 300);
  };

  const hasMoreRecipes = displayedRecipes.length < allRecipes.length;

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Recipes</h1>
              <p className="text-muted-foreground">
                {showMyRecipes ? "Your saved recipes" : "Discover recipes from the community"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={showMyRecipes ? "outline" : "default"}
                onClick={() => setShowMyRecipes(false)}
              >
                <Users className="h-4 w-4 mr-2" />
                Community
              </Button>
              <Button
                variant={showMyRecipes ? "default" : "outline"}
                onClick={() => setShowMyRecipes(true)}
              >
                My Recipes
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardHeader>
                    <div className="h-6 bg-muted rounded animate-pulse mb-2" />
                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : allRecipes.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Apple className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg text-muted-foreground mb-4">
                  {showMyRecipes ? "You haven't created any recipes yet" : "No public recipes available"}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {showMyRecipes 
                    ? "Use the Recipe AI to generate your first recipe from ingredients" 
                    : "Be the first to share a recipe with the community"}
                </p>
                <Button onClick={() => router.push("/generate-recipe")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recipe
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedRecipes.map((recipe) => {
                const totalTime = recipe.prep_time_minutes + recipe.cook_time_minutes;
                
                return (
                  <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl line-clamp-2">{recipe.title}</CardTitle>
                        {recipe.description && (
                          <CardDescription className="line-clamp-2 mt-2">
                            {recipe.description}
                          </CardDescription>
                        )}
                      </CardHeader>

                      <CardContent className="space-y-4 flex-1 flex flex-col">
                        {/* Nutrition Grid */}
                        <div className="grid grid-cols-4 gap-2 pb-3 border-b">
                          <div className="text-center">
                            <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                            <div className="text-sm font-semibold">{Math.round(recipe.nutrition.calories)}</div>
                            <div className="text-xs text-muted-foreground">kcal</div>
                          </div>
                          <div className="text-center">
                            <Beef className="h-4 w-4 mx-auto mb-1 text-red-500" />
                            <div className="text-sm font-semibold">{Math.round(recipe.nutrition.protein_g)}g</div>
                            <div className="text-xs text-muted-foreground">protein</div>
                          </div>
                          <div className="text-center">
                            <Wheat className="h-4 w-4 mx-auto mb-1 text-green-500" />
                            <div className="text-sm font-semibold">{Math.round(recipe.nutrition.carbs_g)}g</div>
                            <div className="text-xs text-muted-foreground">carbs</div>
                          </div>
                          <div className="text-center">
                            <Droplet className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                            <div className="text-sm font-semibold">{Math.round(recipe.nutrition.fat_g)}g</div>
                            <div className="text-xs text-muted-foreground">fat</div>
                          </div>
                        </div>

                        {/* Recipe Meta */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{totalTime} min</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" />
                            <span>{recipe.servings} servings</span>
                          </div>
                          {recipe.difficulty && (
                            <Badge variant="secondary" className={`capitalize text-xs ${difficultyColors[recipe.difficulty] || ''}`}>
                              {recipe.difficulty}
                            </Badge>
                          )}
                          {recipe.cuisine_type && (
                            <Badge variant="outline" className="capitalize text-xs">
                              {recipe.cuisine_type}
                            </Badge>
                          )}
                        </div>

                        {/* Dietary Restrictions */}
                        <div className="flex flex-wrap gap-1">
                          {recipe.dietary_restrictions && recipe.dietary_restrictions.length > 0 ? (
                            recipe.dietary_restrictions.map((restriction, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs capitalize">
                                {restriction.replace(/_/g, ' ')}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              No dietary restrictions
                            </Badge>
                          )}
                        </div>
                      </CardContent>

                      {/* Author - Separate section at bottom */}
                      {recipe.author_nickname && (
                        <div className="px-6 pb-4 mt-auto border-t pt-3">
                          <p className="text-xs text-muted-foreground">
                            By {recipe.author_nickname}
                          </p>
                        </div>
                      )}
                    </Card>
                  </Link>
                );
              })}
              </div>

              {/* Load More Button */}
              {hasMoreRecipes && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={loadMoreRecipes}
                    disabled={loadingMore}
                    variant="outline"
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More Recipes
                        <span className="ml-3 px-2 py-0.5 text-xs font-medium bg-muted rounded-full">
                          {displayedRecipes.length} / {allRecipes.length}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
