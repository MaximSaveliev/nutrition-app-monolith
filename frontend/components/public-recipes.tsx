/**
 * PublicRecipes Component
 * 
 * List Component Pattern - Displays paginated grid of public recipes
 * Implements progressive loading with "Load More" functionality
 * Shows nutrition info, dietary restrictions, and recipe metadata
 */
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, Flame, Beef, Apple, Droplet, Wheat, Loader2 } from "lucide-react";
import Link from "next/link";

interface Recipe {
  id: string;
  title: string;
  description?: string;
  author_nickname?: string;
  cuisine_type?: string;
  difficulty?: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  dietary_restrictions?: string[];
  nutrition: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

const RECIPES_PER_BATCH = 6;

export function PublicRecipes() {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [displayedRecipes, setDisplayedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState(1);

  useEffect(() => {
    fetchPublicRecipes();
  }, []);

  const fetchPublicRecipes = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:8000/api/recipes?my_recipes=false", {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Fetched recipes:", data);
        setAllRecipes(data || []);
        setDisplayedRecipes((data || []).slice(0, RECIPES_PER_BATCH));
        setError(null);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch recipes:", errorData);
        setError("Failed to load recipes");
      }
    } catch (error) {
      console.error("Failed to fetch recipes:", error);
      setError("Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRecipes = () => {
    setLoadingMore(true);
    
    setTimeout(() => {
      const nextBatch = currentBatch + 1;
      const startIndex = 0;
      const endIndex = nextBatch * RECIPES_PER_BATCH;
      
      setDisplayedRecipes(allRecipes.slice(startIndex, endIndex));
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-t-lg" />
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-full mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <Apple className="h-12 w-12 mx-auto text-destructive mb-4" />
          <CardTitle>Failed to Load Recipes</CardTitle>
          <CardDescription>
            {error}. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (allRecipes.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <Apple className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>No Public Recipes Yet</CardTitle>
          <CardDescription>
            Be the first to create and share a recipe with the community!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
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
                <span className="ml-2 text-xs text-muted-foreground">
                  ({displayedRecipes.length} of {allRecipes.length})
                </span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
