"use client";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Clock, Users, Flame, Plus, Beef, Apple, Droplet, Wheat, Loader2, ArrowLeft, Earth, EarthLock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { API_URL } from "@/lib/config";
import confetti from "canvas-confetti";

const RECIPES_PER_BATCH = 6;

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
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: string;
  cuisine_type?: string;
  dietary_restrictions?: string[];
  spice_level?: string;
  author_nickname?: string;
  author_id?: string;
  is_public?: boolean;
  image_url?: string;
  ingredients?: Ingredient[];
  steps?: Step[];
  nutrition: Nutrition;
}

function RecipesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('id');
  const tabParam = searchParams.get('tab');
  const { user, loading: authLoading } = useAuth();
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMyRecipes, setShowMyRecipes] = useState(tabParam === 'my-recipes');
  const [currentBatch, setCurrentBatch] = useState(1);
  const [singleRecipe, setSingleRecipe] = useState<Recipe | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  useEffect(() => {
    if (!recipeId) {
      setSingleRecipe(null);
      setRecipeError(null);
      return;
    }

    setRecipeLoading(true);
    setRecipeError(null);

    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(`${API_URL}/recipes/${recipeId}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Recipe not found');
        return res.json();
      })
      .then((data) => {
        setSingleRecipe(data);
        setRecipeLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching recipe:", err);
        setRecipeError("Recipe not found");
        setRecipeLoading(false);
      });
  }, [recipeId]);

  useEffect(() => {
    setLoading(true);
    setCurrentBatch(1);

    const token = localStorage.getItem("access_token");
    
    if (showMyRecipes && !token) {
      setShowMyRecipes(false);
      return;
    }

    const url = `${API_URL}/recipes?my_recipes=${showMyRecipes}`;
    const fetchOptions: RequestInit = {};
    if (token) {
      fetchOptions.headers = { Authorization: `Bearer ${token}` };
    }
    
    fetch(url, fetchOptions)
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
  }, [showMyRecipes, user]);

  const handleToggleVisibility = async () => {
    if (!singleRecipe || !user) return;

    setIsTogglingVisibility(true);
    const token = localStorage.getItem("access_token");
    
    if (!token) {
      setIsTogglingVisibility(false);
      return;
    }

    const newVisibility = !singleRecipe.is_public;

    try {
      const updateData = {
        title: singleRecipe.title,
        description: singleRecipe.description,
        ingredients: singleRecipe.ingredients,
        steps: singleRecipe.steps,
        cuisine_type: singleRecipe.cuisine_type,
        dietary_restrictions: singleRecipe.dietary_restrictions,
        spice_level: singleRecipe.spice_level,
        difficulty: singleRecipe.difficulty,
        prep_time_minutes: singleRecipe.prep_time_minutes,
        cook_time_minutes: singleRecipe.cook_time_minutes,
        servings: singleRecipe.servings,
        nutrition: singleRecipe.nutrition,
        is_public: newVisibility,
        image_url: singleRecipe.image_url,
      };

      const response = await fetch(`${API_URL}/recipes/${singleRecipe.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update recipe visibility");
      }

      const updatedRecipe = await response.json();
      setSingleRecipe(updatedRecipe);

      if (newVisibility) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#10b981', '#4ade80', '#86efac'],
        });
      }
    } catch (error) {
      console.error("Error toggling visibility:", error);
    } finally {
      setIsTogglingVisibility(false);
    }
  };

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

  // Show single recipe view if ID is provided
  if (recipeId) {
    if (recipeLoading) {
      return (
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      );
    }

    if (recipeError) {
      return (
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1 container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <Wheat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">{recipeError}</h2>
              <Button onClick={() => router.push("/recipes")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Recipes
              </Button>
            </div>
          </main>
        </div>
      );
    }

    if (!singleRecipe) {
      return (
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
        </div>
      );
    }

    const totalTime = singleRecipe.prep_time_minutes + singleRecipe.cook_time_minutes;

    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => router.push(`/recipes${showMyRecipes ? '?tab=my-recipes' : ''}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              {user && singleRecipe.author_id === user.id && (
                <div className="flex items-center gap-2">
                  {singleRecipe.is_public ? (
                    <>
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800 pointer-events-none select-none rounded-full h-9 px-3">
                        <Earth className="h-3 w-3 mr-1" />
                        Published
                      </Badge>
                      <Button
                        onClick={handleToggleVisibility}
                        disabled={isTogglingVisibility}
                        variant="outline"
                        size="sm"
                        className="rounded-full h-9"
                      >
                        {isTogglingVisibility ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <EarthLock className="h-4 w-4 mr-2" />
                        )}
                        Make Private
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleToggleVisibility}
                      disabled={isTogglingVisibility}
                      variant="outline"
                      size="sm"
                      className="rounded-full h-9"
                    >
                      {isTogglingVisibility ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Earth className="h-4 w-4 mr-2" />
                      )}
                      Make Public
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div>
              <h1 className="text-4xl font-bold mb-2">{singleRecipe.title}</h1>
              {singleRecipe.description && (
                <p className="text-lg text-muted-foreground">{singleRecipe.description}</p>
              )}
              {singleRecipe.author_nickname && (
                <p className="text-sm text-muted-foreground mt-2">By {singleRecipe.author_nickname}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>{totalTime} min ({singleRecipe.prep_time_minutes} prep + {singleRecipe.cook_time_minutes} cook)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                <span>{singleRecipe.servings} servings</span>
              </div>
              <Badge variant="secondary" className={`capitalize pointer-events-none select-none ${difficultyColors[singleRecipe.difficulty.toLowerCase()] || ''}`}>
                {singleRecipe.difficulty}
              </Badge>
              {singleRecipe.cuisine_type && (
                <Badge variant="outline" className="capitalize pointer-events-none select-none">{singleRecipe.cuisine_type}</Badge>
              )}
              {singleRecipe.dietary_restrictions && singleRecipe.dietary_restrictions.length > 0 && (
                singleRecipe.dietary_restrictions.map((restriction, idx) => (
                  <Badge key={idx} variant="outline" className="capitalize pointer-events-none select-none">
                    {restriction.replace(/_/g, ' ')}
                  </Badge>
                ))
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Nutrition per Serving</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <div className="text-lg font-bold">{Math.round(singleRecipe.nutrition.calories)}</div>
                    <div className="text-xs text-muted-foreground">kcal</div>
                  </div>
                  <div className="text-center">
                    <Beef className="h-5 w-5 mx-auto mb-1 text-red-500" />
                    <div className="text-lg font-bold">{Math.round(singleRecipe.nutrition.protein_g)}g</div>
                    <div className="text-xs text-muted-foreground">protein</div>
                  </div>
                  <div className="text-center">
                    <Wheat className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <div className="text-lg font-bold">{Math.round(singleRecipe.nutrition.carbs_g)}g</div>
                    <div className="text-xs text-muted-foreground">carbs</div>
                  </div>
                  <div className="text-center">
                    <Droplet className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                    <div className="text-lg font-bold">{Math.round(singleRecipe.nutrition.fat_g)}g</div>
                    <div className="text-xs text-muted-foreground">fat</div>
                  </div>
                </div>
                {(singleRecipe.nutrition.fiber_g || singleRecipe.nutrition.sugar_g || singleRecipe.nutrition.sodium_mg) && (
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    {singleRecipe.nutrition.fiber_g && (
                      <div className="text-center">
                        <div className="text-sm font-semibold">{Math.round(singleRecipe.nutrition.fiber_g)}g</div>
                        <div className="text-xs text-muted-foreground">Fiber</div>
                      </div>
                    )}
                    {singleRecipe.nutrition.sugar_g && (
                      <div className="text-center">
                        <div className="text-sm font-semibold">{Math.round(singleRecipe.nutrition.sugar_g)}g</div>
                        <div className="text-xs text-muted-foreground">Sugar</div>
                      </div>
                    )}
                    {singleRecipe.nutrition.sodium_mg && (
                      <div className="text-center">
                        <div className="text-sm font-semibold">{Math.round(singleRecipe.nutrition.sodium_mg)}mg</div>
                        <div className="text-xs text-muted-foreground">Sodium</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {singleRecipe.ingredients && (
              <Card>
                <CardHeader>
                  <CardTitle>Ingredients</CardTitle>
                  <CardDescription>{singleRecipe.servings} servings</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {singleRecipe.ingredients.map((ingredient, idx) => (
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
            )}

            {singleRecipe.steps && (
              <Card>
                <CardHeader>
                  <CardTitle>Instructions</CardTitle>
                  <CardDescription>Total time: {totalTime} minutes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-4">
                    {singleRecipe.steps.map((step) => (
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
            )}
          </div>
        </main>
      </div>
    );
  }

  // Show list view
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
              {user && (
                <Button
                  variant={showMyRecipes ? "default" : "outline"}
                  onClick={() => setShowMyRecipes(true)}
                >
                  My Recipes
                </Button>
              )}
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
                  <Link key={recipe.id} href={`/recipes?id=${recipe.id}${showMyRecipes ? '&tab=my-recipes' : ''}`}>
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
                            <Badge variant="secondary" className={`capitalize text-xs pointer-events-none select-none ${difficultyColors[recipe.difficulty] || ''}`}>
                              {recipe.difficulty}
                            </Badge>
                          )}
                          {recipe.cuisine_type && (
                            <Badge variant="outline" className="capitalize text-xs pointer-events-none select-none">
                              {recipe.cuisine_type}
                            </Badge>
                          )}
                        </div>

                        {/* Dietary Restrictions */}
                        <div className="flex flex-wrap gap-1">
                          {recipe.dietary_restrictions && recipe.dietary_restrictions.length > 0 ? (
                            recipe.dietary_restrictions.map((restriction, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs capitalize pointer-events-none select-none">
                                {restriction.replace(/_/g, ' ')}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground pointer-events-none select-none">
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

export default function RecipesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    }>
      <RecipesContent />
    </Suspense>
  );
}
