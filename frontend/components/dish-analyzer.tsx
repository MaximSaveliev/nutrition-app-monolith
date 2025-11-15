/**
 * DishAnalyzer Component
 * 
 * Presentation Component Pattern - Stateful component handling dish image analysis
 * Manages user interaction for uploading dish photos, selecting meal types, and displaying nutrition analysis
 */
"use client";
import { useState, useRef } from "react";
import { analyzeAndLogDish } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";

export function DishAnalyzer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showMealButtons, setShowMealButtons] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<string>("");
  const [imageChanged, setImageChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setSelectedMeal("");
      setImageChanged(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setShowMealButtons(true);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAnalyzeAndLog = async (mealType: string) => {
    if (!file) return;
    
    setResult(null);
    setLoading(true);
    setError("");
    setSelectedMeal(mealType);
    setImageChanged(false);
    
    try {
      const token = localStorage.getItem("access_token");
      const data = await analyzeAndLogDish(file, mealType, token || undefined);
      setResult(data);
    } catch (err: any) {
      console.error("Analysis error:", err);
      if (err.message.includes("Rate limit exceeded") || err.message.includes("sign up or log in")) {
        setError("⚠️ Free trial limit reached (3 requests). Please sign up or log in to continue using AI features!");
      } else {
        setError(`AI analysis failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
    setShowMealButtons(false);
    setSelectedMeal("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={loading}
      />

      {!preview && (
        <Card 
          className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer bg-muted/5"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Your Dish Photo</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Click to browse or drag and drop your food photo here to analyze nutrition
            </p>
          </CardContent>
        </Card>
      )}

      {preview && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div 
                className="relative w-full aspect-square cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <img 
                  src={preview} 
                  alt="Dish preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white text-center">
                    <Upload className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm font-medium">Click to change image</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {result && selectedMeal && !imageChanged ? "Meal type:" : "Select meal type to analyze:"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant={selectedMeal === "breakfast" ? "default" : "outline"}
                    className="h-12 rounded-full font-medium"
                    onClick={() => !loading && imageChanged && handleAnalyzeAndLog("breakfast")}
                    disabled={loading || (result && !imageChanged)}
                  >
                    Breakfast
                  </Button>
                  <Button 
                    variant={selectedMeal === "lunch" ? "default" : "outline"}
                    className="h-12 rounded-full font-medium"
                    onClick={() => !loading && imageChanged && handleAnalyzeAndLog("lunch")}
                    disabled={loading || (result && !imageChanged)}
                  >
                    Lunch
                  </Button>
                  <Button 
                    variant={selectedMeal === "dinner" ? "default" : "outline"}
                    className="h-12 rounded-full font-medium"
                    onClick={() => !loading && imageChanged && handleAnalyzeAndLog("dinner")}
                    disabled={loading || (result && !imageChanged)}
                  >
                    Dinner
                  </Button>
                  <Button 
                    variant={selectedMeal === "snack" ? "default" : "outline"}
                    className="h-12 rounded-full font-medium"
                    onClick={() => !loading && imageChanged && handleAnalyzeAndLog("snack")}
                    disabled={loading || (result && !imageChanged)}
                  >
                    Snack
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="px-6 pb-6 flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analyzing...</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <CardContent className="p-6">
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
                  {error.includes("Free trial limit reached") && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => router.push("/auth/sign-up")}
                        className="flex-1 rounded-full"
                      >
                        Sign Up Free
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push("/auth/login")}
                        className="flex-1 rounded-full"
                      >
                        Log In
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {result && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{result.dish_name}</h2>
                    {result.portion_size && (
                      <p className="text-sm text-muted-foreground">Portion: {result.portion_size}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-950/50 p-4 rounded-xl text-center">
                      <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.nutrition.calories}</div>
                      <div className="text-sm text-muted-foreground mt-1">Calories</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/50 p-4 rounded-xl text-center">
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">{result.nutrition.protein_g}g</div>
                      <div className="text-sm text-muted-foreground mt-1">Protein</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-950/50 p-4 rounded-xl text-center">
                      <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{result.nutrition.carbs_g}g</div>
                      <div className="text-sm text-muted-foreground mt-1">Carbs</div>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/50 p-4 rounded-xl text-center">
                      <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{result.nutrition.fat_g}g</div>
                      <div className="text-sm text-muted-foreground mt-1">Fat</div>
                    </div>
                  </div>

                  {(result.nutrition.fiber_g != null || result.nutrition.sugar_g != null || result.nutrition.sodium_mg != null) && (
                    <div className="bg-muted/30 rounded-xl p-4">
                      <div className="grid grid-cols-3 gap-3">
                        {result.nutrition.fiber_g != null && (
                          <div className="text-center py-2 bg-background rounded-lg">
                            <div className="font-bold">{result.nutrition.fiber_g}g</div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">Fiber</div>
                          </div>
                        )}
                        {result.nutrition.sugar_g != null && (
                          <div className="text-center py-2 bg-background rounded-lg">
                            <div className="font-bold">{result.nutrition.sugar_g}g</div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">Sugar</div>
                          </div>
                        )}
                        {result.nutrition.sodium_mg != null && (
                          <div className="text-center py-2 bg-background rounded-lg">
                            <div className="font-bold">{result.nutrition.sodium_mg}mg</div>
                            <div className="text-xs text-muted-foreground font-medium mt-1">Sodium</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(result.nutrition.vitamin_a_mcg != null || result.nutrition.vitamin_c_mg != null || result.nutrition.vitamin_d_mcg != null || 
                    result.nutrition.vitamin_e_mg != null || result.nutrition.vitamin_k_mcg != null || result.nutrition.vitamin_b6_mg != null || 
                    result.nutrition.vitamin_b12_mcg != null || result.nutrition.folate_mcg != null) && (
                    <div className="border-t pt-4">
                      <h4 className="font-bold text-base mb-3 text-purple-700 dark:text-purple-400">Vitamins</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {result.nutrition.vitamin_a_mcg != null && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.nutrition.vitamin_a_mcg}µg</div>
                            <div className="text-xs text-muted-foreground">Vit A</div>
                          </div>
                        )}
                        {result.nutrition.vitamin_c_mg != null && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.nutrition.vitamin_c_mg}mg</div>
                            <div className="text-xs text-muted-foreground">Vit C</div>
                          </div>
                        )}
                        {result.nutrition.vitamin_d_mcg != null && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.nutrition.vitamin_d_mcg}µg</div>
                            <div className="text-xs text-muted-foreground">Vit D</div>
                          </div>
                        )}
                        {result.nutrition.vitamin_e_mg != null && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.nutrition.vitamin_e_mg}mg</div>
                            <div className="text-xs text-muted-foreground">Vit E</div>
                          </div>
                        )}
                        {result.nutrition.vitamin_k_mcg != null && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.nutrition.vitamin_k_mcg}µg</div>
                            <div className="text-xs text-muted-foreground">Vit K</div>
                          </div>
                        )}
                        {result.nutrition.vitamin_b6_mg != null && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.nutrition.vitamin_b6_mg}mg</div>
                            <div className="text-xs text-muted-foreground">Vit B6</div>
                          </div>
                        )}
                        {result.nutrition.vitamin_b12_mcg != null && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.nutrition.vitamin_b12_mcg}µg</div>
                            <div className="text-xs text-muted-foreground">Vit B12</div>
                          </div>
                        )}
                        {result.nutrition.folate_mcg != null && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{result.nutrition.folate_mcg}µg</div>
                            <div className="text-xs text-muted-foreground">Folate</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {(result.nutrition.calcium_mg != null || result.nutrition.iron_mg != null || result.nutrition.magnesium_mg != null || 
                    result.nutrition.zinc_mg != null || result.nutrition.selenium_mcg != null || result.nutrition.potassium_mg != null || 
                    result.nutrition.cholesterol_mg != null) && (
                    <div className="border-t pt-4">
                      <h4 className="font-bold text-base mb-3 text-emerald-700 dark:text-emerald-400">Minerals</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {result.nutrition.calcium_mg != null && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.nutrition.calcium_mg}mg</div>
                            <div className="text-xs text-muted-foreground">Calcium</div>
                          </div>
                        )}
                        {result.nutrition.iron_mg != null && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.nutrition.iron_mg}mg</div>
                            <div className="text-xs text-muted-foreground">Iron</div>
                          </div>
                        )}
                        {result.nutrition.magnesium_mg != null && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.nutrition.magnesium_mg}mg</div>
                            <div className="text-xs text-muted-foreground">Magnesium</div>
                          </div>
                        )}
                        {result.nutrition.zinc_mg != null && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.nutrition.zinc_mg}mg</div>
                            <div className="text-xs text-muted-foreground">Zinc</div>
                          </div>
                        )}
                        {result.nutrition.selenium_mcg != null && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.nutrition.selenium_mcg}µg</div>
                            <div className="text-xs text-muted-foreground">Selenium</div>
                          </div>
                        )}
                        {result.nutrition.potassium_mg != null && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.nutrition.potassium_mg}mg</div>
                            <div className="text-xs text-muted-foreground">Potassium</div>
                          </div>
                        )}
                        {result.nutrition.cholesterol_mg != null && (
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
                            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{result.nutrition.cholesterol_mg}mg</div>
                            <div className="text-xs text-muted-foreground">Cholesterol</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
