/**
 * NutritionDashboard Component
 * 
 * Presentation Component Pattern - Dashboard displaying daily nutrition progress
 * Fetches and displays nutrition goals vs actual consumption with visual progress bars
 */
"use client";
import { useState, useEffect } from "react";
import { getDailyLog } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function NutritionDashboard() {
  const [dailyLog, setDailyLog] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyLog();
  }, []);

  const loadDailyLog = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const today = new Date().toISOString().split('T')[0];
      const data = await getDailyLog(today, token);
      setDailyLog(data);
    } catch (err) {
      console.error("Failed to load daily log:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!dailyLog) {
    return <div className="p-4">No data available</div>;
  }

  const goals = {
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65
  };

  const getProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📊 Today's Nutrition</CardTitle>
          <CardDescription>{new Date(dailyLog.date).toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Calories</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(dailyLog.total_calories)} / {goals.calories} kcal
              </span>
            </div>
            <Progress value={getProgress(dailyLog.total_calories, goals.calories)} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Protein</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(dailyLog.total_protein_g)} / {goals.protein}g
              </span>
            </div>
            <Progress value={getProgress(dailyLog.total_protein_g, goals.protein)} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Carbs</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(dailyLog.total_carbs_g)} / {goals.carbs}g
              </span>
            </div>
            <Progress value={getProgress(dailyLog.total_carbs_g, goals.carbs)} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Fat</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(dailyLog.total_fat_g)} / {goals.fat}g
              </span>
            </div>
            <Progress value={getProgress(dailyLog.total_fat_g, goals.fat)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🍽️ Meal History</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyLog.meals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meals logged yet today</p>
          ) : (
            <div className="space-y-3">
              {dailyLog.meals.map((meal: any) => (
                <div key={meal.id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h4 className="font-semibold">{meal.dish_name}</h4>
                      {meal.meal_type && (
                        <span className="text-xs text-muted-foreground capitalize">{meal.meal_type}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{Math.round(meal.nutrition.calories)} cal</span>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>P: {meal.nutrition.protein_g}g</span>
                    <span>C: {meal.nutrition.carbs_g}g</span>
                    <span>F: {meal.nutrition.fat_g}g</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
