"use client";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrendingUp, Flame, Beef, Droplet, Activity, Wheat, ImageIcon, X } from "lucide-react";
import { getDailyLog, getWeeklyStats } from "@/lib/api-client";
import { useGoalNotifications } from "@/hooks/use-goal-notifications";
import Image from "next/image";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts";

export default function StatisticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [dailyData, setDailyData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Enable goal notifications
  useGoalNotifications(!!user);

  // Define meal type order
  const mealTypeOrder: { [key: string]: number} = {
    'breakfast': 1,
    'lunch': 2,
    'dinner': 3,
    'snack': 4
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      // Fetch daily nutrition log first (faster)
      const today = new Date().toISOString().split('T')[0];
      console.log("Fetching daily log for:", today);
      
      getDailyLog(today, token)
        .then((logData) => {
          console.log("Daily log data:", logData);
          setDailyData(logData);
          setDataLoading(false);
        })
        .catch((err) => {
          console.error("Error loading daily statistics:", err);
          setDataLoading(false);
        });

      // Fetch weekly stats separately (loads in background)
      getWeeklyStats(token, 7)
        .then((weekly) => {
          console.log("Weekly data:", weekly);
          setWeeklyData(weekly);
          setWeeklyLoading(false);
        })
        .catch((err) => {
          console.error("Error loading weekly statistics:", err);
          setWeeklyLoading(false);
        });
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg text-muted-foreground ml-4">Loading...</div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  // Sort meals by meal type order
  const sortedMeals = dailyData?.meals ? [...dailyData.meals].sort((a: any, b: any) => {
    const orderA = mealTypeOrder[a.meal_type?.toLowerCase()] || 999;
    const orderB = mealTypeOrder[b.meal_type?.toLowerCase()] || 999;
    return orderA - orderB;
  }) : [];

  const handleMealClick = (meal: any) => {
    setSelectedMeal(meal);
    setIsSheetOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Nutrition Statistics</h1>
            <p className="text-muted-foreground">
              Track your daily nutrition intake and progress
            </p>
          </div>

          {/* Today's Summary */}
          {dataLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2"></div>
                    <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Calories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dailyData ? Math.round(dailyData.total_calories) : 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {user?.daily_calorie_goal || 2000} kcal goal
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Beef className="h-4 w-4 text-red-500" />
                    Protein
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dailyData ? Math.round(dailyData.total_protein_g) : 0}g
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {user?.daily_protein_goal || 150}g goal
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wheat className="h-4 w-4 text-green-500" />
                    Carbs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dailyData ? Math.round(dailyData.total_carbs_g) : 0}g
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {user?.daily_carbs_goal || 250}g goal
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Droplet className="h-4 w-4 text-yellow-500" />
                    Fats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dailyData ? Math.round(dailyData.total_fat_g) : 0}g
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {user?.daily_fat_goal || 70}g goal
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Meals */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6" />
                Recent Meals
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Your scanned dishes from today</p>
            </div>
            
            {sortedMeals.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {sortedMeals.map((meal: any, index: number) => (
                  <div 
                    key={meal.id || index} 
                    onClick={() => handleMealClick(meal)}
                    className="overflow-hidden rounded-xl border bg-card hover:shadow-md cursor-pointer transition-shadow duration-200"
                  >
                    <div className="flex gap-4 p-4">
                      {/* Image on the left */}
                      <div className="flex-shrink-0">
                        {meal.image_url ? (
                          <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={meal.image_url}
                              alt={meal.dish_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 lg:h-12 lg:w-12 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-lg mb-1 line-clamp-2">{meal.dish_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Badge variant="secondary" className="capitalize font-medium">
                              {meal.meal_type || 'Meal'}
                            </Badge>
                            <span className="text-xs">
                              {new Date(meal.scanned_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* Main 4 properties - Enhanced */}
                        <div className="grid grid-cols-4 gap-2">
                          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 text-center">
                            <div className="text-base font-bold text-blue-600 dark:text-blue-400">{Math.round(meal.nutrition.calories)}</div>
                            <div className="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">cal</div>
                          </div>
                          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-2 text-center">
                            <div className="text-base font-bold text-green-600 dark:text-green-400">{Math.round(meal.nutrition.protein_g)}g</div>
                            <div className="text-xs text-green-600/70 dark:text-green-400/70 font-medium">protein</div>
                          </div>
                          <div className="bg-yellow-50 dark:bg-yellow-950/30 rounded-lg p-2 text-center">
                            <div className="text-base font-bold text-yellow-600 dark:text-yellow-400">{Math.round(meal.nutrition.carbs_g)}g</div>
                            <div className="text-xs text-yellow-600/70 dark:text-yellow-400/70 font-medium">carbs</div>
                          </div>
                          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-2 text-center">
                            <div className="text-base font-bold text-orange-600 dark:text-orange-400">{Math.round(meal.nutrition.fat_g)}g</div>
                            <div className="text-xs text-orange-600/70 dark:text-orange-400/70 font-medium">fat</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border rounded-xl bg-muted/20">
                <Activity className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No meals logged yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start scanning your dishes to track your nutrition
                </p>
              </div>
            )}
          </div>

          {/* Meal Detail Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="overflow-y-auto w-full sm:max-w-lg p-0">
              {selectedMeal && (
                <div className="h-full flex flex-col">
                  {/* Header with Close Button */}
                  <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-start justify-between gap-4 z-10">
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-2xl font-bold mb-2">{selectedMeal.dish_name}</SheetTitle>
                      <SheetDescription className="text-base">
                        <span className="capitalize font-medium">{selectedMeal.meal_type || 'Meal'}</span> 
                        <span className="mx-2">•</span>
                        {new Date(selectedMeal.scanned_at).toLocaleString('en-US', { 
                          weekday: 'short',
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </SheetDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-8 w-8 shrink-0"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Image */}
                    {selectedMeal.image_url && (
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted shadow-lg">
                        <Image
                          src={selectedMeal.image_url}
                          alt={selectedMeal.dish_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Portion Size */}
                    {selectedMeal.portion_size && (
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground">Portion:</span> {selectedMeal.portion_size}
                        </p>
                      </div>
                    )}

                  {/* Main Macros */}
                  <div>
                    <h3 className="font-bold text-lg mb-4">Nutrition Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 p-5 rounded-xl text-center shadow-sm border border-blue-200/50 dark:border-blue-800/50">
                        <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">{Math.round(selectedMeal.nutrition.calories)}</div>
                        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Calories</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 p-5 rounded-xl text-center shadow-sm border border-green-200/50 dark:border-green-800/50">
                        <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">{Math.round(selectedMeal.nutrition.protein_g)}g</div>
                        <div className="text-sm font-medium text-green-700 dark:text-green-300">Protein</div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/50 dark:to-yellow-900/30 p-5 rounded-xl text-center shadow-sm border border-yellow-200/50 dark:border-yellow-800/50">
                        <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{Math.round(selectedMeal.nutrition.carbs_g)}g</div>
                        <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Carbs</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 p-5 rounded-xl text-center shadow-sm border border-orange-200/50 dark:border-orange-800/50">
                        <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-1">{Math.round(selectedMeal.nutrition.fat_g)}g</div>
                        <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Fat</div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Macros */}
                  {(selectedMeal.nutrition.fiber_g != null || selectedMeal.nutrition.sugar_g != null || selectedMeal.nutrition.sodium_mg != null) && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="grid grid-cols-3 gap-3">
                        {selectedMeal.nutrition.fiber_g != null && (
                          <div className="text-center py-2 bg-background rounded-lg">
                            <div className="text-xl font-bold">{Math.round(selectedMeal.nutrition.fiber_g)}g</div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">Fiber</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.sugar_g != null && (
                          <div className="text-center py-2 bg-background rounded-lg">
                            <div className="text-xl font-bold">{Math.round(selectedMeal.nutrition.sugar_g)}g</div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">Sugar</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.sodium_mg != null && (
                          <div className="text-center py-2 bg-background rounded-lg">
                            <div className="text-xl font-bold">{Math.round(selectedMeal.nutrition.sodium_mg)}mg</div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">Sodium</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vitamins Section */}
                  {(selectedMeal.nutrition.vitamin_a_mcg != null || selectedMeal.nutrition.vitamin_c_mg != null || selectedMeal.nutrition.vitamin_d_mcg != null || 
                    selectedMeal.nutrition.vitamin_e_mg != null || selectedMeal.nutrition.vitamin_k_mcg != null || selectedMeal.nutrition.vitamin_b6_mg != null || 
                    selectedMeal.nutrition.vitamin_b12_mcg != null || selectedMeal.nutrition.folate_mcg != null) && (
                    <div>
                      <h4 className="font-bold text-base mb-3 text-purple-700 dark:text-purple-400">Vitamins</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {selectedMeal.nutrition.vitamin_a_mcg != null && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-lg text-center border border-purple-200/50 dark:border-purple-700/50">
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{Math.round(selectedMeal.nutrition.vitamin_a_mcg)}µg</div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Vit A</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.vitamin_c_mg != null && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-lg text-center border border-purple-200/50 dark:border-purple-700/50">
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{Math.round(selectedMeal.nutrition.vitamin_c_mg)}mg</div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Vit C</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.vitamin_d_mcg != null && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-lg text-center border border-purple-200/50 dark:border-purple-700/50">
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{Math.round(selectedMeal.nutrition.vitamin_d_mcg)}µg</div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Vit D</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.vitamin_e_mg != null && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-lg text-center border border-purple-200/50 dark:border-purple-700/50">
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{Math.round(selectedMeal.nutrition.vitamin_e_mg)}mg</div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Vit E</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.vitamin_k_mcg != null && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-lg text-center border border-purple-200/50 dark:border-purple-700/50">
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{Math.round(selectedMeal.nutrition.vitamin_k_mcg)}µg</div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Vit K</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.vitamin_b6_mg != null && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-lg text-center border border-purple-200/50 dark:border-purple-700/50">
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{Math.round(selectedMeal.nutrition.vitamin_b6_mg)}mg</div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Vit B6</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.vitamin_b12_mcg != null && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-lg text-center border border-purple-200/50 dark:border-purple-700/50">
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{Math.round(selectedMeal.nutrition.vitamin_b12_mcg)}µg</div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Vit B12</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.folate_mcg != null && (
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 p-3 rounded-lg text-center border border-purple-200/50 dark:border-purple-700/50">
                            <div className="text-base font-bold text-purple-600 dark:text-purple-400">{Math.round(selectedMeal.nutrition.folate_mcg)}µg</div>
                            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mt-1">Folate</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Minerals Section */}
                  {(selectedMeal.nutrition.calcium_mg != null || selectedMeal.nutrition.iron_mg != null || selectedMeal.nutrition.magnesium_mg != null || 
                    selectedMeal.nutrition.zinc_mg != null || selectedMeal.nutrition.selenium_mcg != null || selectedMeal.nutrition.potassium_mg != null || 
                    selectedMeal.nutrition.cholesterol_mg != null) && (
                    <div>
                      <h4 className="font-bold text-base mb-3 text-emerald-700 dark:text-emerald-400">Minerals</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedMeal.nutrition.calcium_mg != null && (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-3 rounded-lg text-center border border-emerald-200/50 dark:border-emerald-700/50">
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{Math.round(selectedMeal.nutrition.calcium_mg)}mg</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1">Calcium</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.iron_mg != null && (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-3 rounded-lg text-center border border-emerald-200/50 dark:border-emerald-700/50">
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{Math.round(selectedMeal.nutrition.iron_mg)}mg</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1">Iron</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.magnesium_mg != null && (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-3 rounded-lg text-center border border-emerald-200/50 dark:border-emerald-700/50">
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{Math.round(selectedMeal.nutrition.magnesium_mg)}mg</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1">Magnesium</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.zinc_mg != null && (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-3 rounded-lg text-center border border-emerald-200/50 dark:border-emerald-700/50">
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{Math.round(selectedMeal.nutrition.zinc_mg)}mg</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1">Zinc</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.selenium_mcg != null && (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-3 rounded-lg text-center border border-emerald-200/50 dark:border-emerald-700/50">
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{Math.round(selectedMeal.nutrition.selenium_mcg)}µg</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1">Selenium</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.potassium_mg != null && (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-3 rounded-lg text-center border border-emerald-200/50 dark:border-emerald-700/50">
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{Math.round(selectedMeal.nutrition.potassium_mg)}mg</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1">Potassium</div>
                          </div>
                        )}
                        {selectedMeal.nutrition.cholesterol_mg != null && (
                          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/20 p-3 rounded-lg text-center border border-emerald-200/50 dark:border-emerald-700/50">
                            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{Math.round(selectedMeal.nutrition.cholesterol_mg)}mg</div>
                            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-1">Cholesterol</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Weekly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Trends
              </CardTitle>
              <CardDescription>Your nutrition patterns over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyLoading ? (
                <div className="h-[280px] w-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-muted-foreground">Loading weekly trends...</p>
                  </div>
                </div>
              ) : weeklyData && weeklyData.length > 0 && weeklyData.some(day => day.protein > 0 || day.carbs > 0 || day.fat > 0) ? (
                <ChartContainer
                  config={{
                    protein: {
                      label: "Protein",
                      color: "hsl(142, 76%, 36%)",
                    },
                    carbs: {
                      label: "Carbs",
                      color: "hsl(48, 96%, 53%)",
                    },
                    fat: {
                      label: "Fat",
                      color: "hsl(24, 95%, 53%)",
                    },
                  }}
                  className="h-[280px] w-full [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper]:focus:outline-none [&_*]:outline-none [&_*]:focus:outline-none"
                >
                  <BarChart
                    accessibilityLayer
                    data={weeklyData.map(day => ({
                      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                      protein: day.protein,
                      carbs: day.carbs,
                      fat: day.fat,
                    }))}
                  >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-lg">
                              <div className="grid gap-2">
                                <div className="font-semibold text-sm mb-1">{payload[0].payload.date}</div>
                                {payload.reverse().map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between gap-6">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="h-2.5 w-2.5 rounded-full" 
                                        style={{ backgroundColor: entry.fill }}
                                      />
                                      <span className="text-xs text-muted-foreground capitalize">{entry.dataKey}</span>
                                    </div>
                                    <span className="text-sm font-medium">{Math.round(entry.value)}g</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="protein"
                      stackId="a"
                      fill="var(--color-protein)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="carbs"
                      stackId="a"
                      fill="var(--color-carbs)"
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="fat"
                      stackId="a"
                      fill="var(--color-fat)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Not enough data to show trends</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Keep logging your meals to see progress over time
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
