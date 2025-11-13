/**
 * RecipeGenerator Component
 * 
 * Presentation Component Pattern - Complex stateful component for AI recipe generation
 * Handles both text and image input, dietary restrictions, and recipe publishing
 * Integrates with confetti library for success animations
 */
"use client";
import { useState, useRef } from "react";
import { createRecipe } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { Paperclip, X, Upload, NotebookPen, NotepadText, Clock, ChartColumn, Utensils, Earth, ChefHat } from "lucide-react";
import confetti from "canvas-confetti";
import { API_URL } from "@/lib/config";

const DIETARY_RESTRICTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "gluten_free", label: "Gluten Free" },
  { value: "dairy_free", label: "Dairy Free" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "low_carb", label: "Low Carb" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "nut_free", label: "Nut Free" },
];

export function RecipeGenerator() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ingredientsText, setIngredientsText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [error, setError] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [spiceLevel, setSpiceLevel] = useState("");
  const [dietary, setDietary] = useState<string[]>([]);
  const [cookTime, setCookTime] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setIngredientsText("");
      setRecipe(null);
      setIsPublic(false);
      setSavedRecipeId(null);
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreview("");
    setIngredientsText(" ");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIngredientsText(e.target.value);
  };

  const toggleDietary = (value: string) => {
    setDietary(prev => 
      prev.includes(value) 
        ? prev.filter(d => d !== value)
        : [...prev, value]
    );
  };

  const handleGenerate = async () => {
    if (!ingredientsText.trim() && !file) {
      setError("Please provide ingredients as text or upload an image");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");
      
      let base64Image = "";
      if (file) {
        const reader = new FileReader();
        base64Image = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/recipes/generate-from-input`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ingredients_text: ingredientsText || undefined,
          image_base64: base64Image || undefined,
          cuisine_preference: cuisine || undefined,
          spice_level: spiceLevel || undefined,
          dietary_restrictions: dietary.length > 0 ? dietary : undefined,
          servings: 4,
          cook_time_minutes: cookTime ? parseInt(cookTime) : undefined
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("⚠️ Free trial limit reached (3 requests). Please sign up or log in to continue using AI features!");
        }
        throw new Error(result.detail || "Failed to generate recipe");
      }

      setRecipe(result);
      
      if (token) {
        try {
          const savedRecipe = await createRecipe({ ...result, is_public: false }, token);
          setSavedRecipeId(savedRecipe.id);
          console.log("Recipe auto-saved as private with ID:", savedRecipe.id);
        } catch (saveErr) {
          console.error("Auto-save failed:", saveErr);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (makePublic: boolean) => {
    if (!recipe || isPublic) return;

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("Please log in to save recipes");
        return;
      }

      if (savedRecipeId) {
        const response = await fetch(`${API_URL}/recipes/${savedRecipeId}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...recipe, is_public: true })
        });
        
        if (response.ok) {
          setIsPublic(true);
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#22c55e', '#10b981', '#4ade80', '#86efac'],
          });
        } else {
          throw new Error("Failed to update recipe visibility");
        }
      } else {
        const savedRecipe = await createRecipe({ ...recipe, is_public: makePublic }, token);
        setSavedRecipeId(savedRecipe.id);
        setIsPublic(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#10b981', '#4ade80', '#86efac'],
        });
      }
      
    } catch (err: any) {
      setError(err.message);
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

      {!preview && !ingredientsText && (
        <Card 
          className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer bg-muted/5"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Upload Ingredients Photo</h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Click to browse or drag and drop your ingredients photo here
            </p>
            <div className="flex items-center gap-3 w-full max-w-xs">
              <div className="h-px bg-border flex-1"></div>
              <span className="text-xs text-muted-foreground">OR</span>
              <div className="h-px bg-border flex-1"></div>
            </div>
            <Button 
              variant="outline" 
              className="mt-4 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                setIngredientsText(" ");
              }}
            >
              Type Ingredients Instead
            </Button>
          </CardContent>
        </Card>
      )}

      {(preview || ingredientsText) && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Generate Recipe
              </CardTitle>
              <CardDescription>Upload ingredients photo OR type them - AI will create a recipe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Ingredients</Label>
                
                {preview ? (
                  <div className="relative w-full max-w-sm mx-auto aspect-square rounded-lg overflow-hidden border cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <img 
                      src={preview} 
                      alt="Ingredients" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Click to change</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-background/90 hover:bg-background rounded-full transition-colors z-10"
                      title="Remove image and use text"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Textarea
                      value={ingredientsText}
                      onChange={handleTextChange}
                      placeholder="Enter ingredients or attach a photo..."
                      disabled={loading}
                      rows={3}
                      className="pr-12 resize-none"
                    />
                    <div className="absolute right-2 top-2">
                      <label 
                        className="cursor-pointer p-1.5 hover:bg-muted rounded-md transition-colors inline-block"
                        title="Attach ingredients photo"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                      </label>
                    </div>
                  </div>
                )}
              </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input
                  id="cuisine"
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  placeholder="e.g., Italian, Thai, Mexican"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="spice">Preferences</Label>
                <Input
                  id="spice"
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value)}
                  placeholder="e.g., romantic dinner, baby food, school lunch, spicy"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cookTime">Max Cook Time (minutes)</Label>
              <Input
                id="cookTime"
                type="number"
                min="0"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="Leave empty for any duration"
                disabled={loading}
              />
            </div>

            <div>
              <Label>Dietary Restrictions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {DIETARY_RESTRICTIONS.map((diet) => (
                  <div key={diet.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={diet.value}
                      checked={dietary.includes(diet.value)}
                      onCheckedChange={() => toggleDietary(diet.value)}
                      disabled={loading}
                    />
                    <label htmlFor={diet.value} className="text-sm cursor-pointer">
                      {diet.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading || (!ingredientsText.trim() && !file)} 
              className="w-full rounded-full h-12"
            >
              {loading ? "Generating Recipe..." : "Generate Recipe"}
            </Button>

            {error && (
              <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <CardContent className="p-4">
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
          </CardContent>
        </Card>

        {loading ? (
          <Card className="flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2">Generating Your Recipe...</h3>
              <p className="text-sm text-muted-foreground">Our AI is analyzing your ingredients</p>
            </CardContent>
          </Card>
        ) : recipe ? (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="font-bold text-2xl mb-2">{recipe.title}</h3>
                <p className="text-muted-foreground text-sm">{recipe.description}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {recipe.cuisine_type && <Badge variant="secondary">{recipe.cuisine_type}</Badge>}
                  <Badge variant="outline">{recipe.difficulty}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {recipe.prep_time_minutes + recipe.cook_time_minutes} min
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Utensils className="w-3 h-3" />
                    {recipe.servings} servings
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <NotepadText className="w-5 h-5" />
                  Ingredients
                </h4>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ing: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>
                        <span className="font-medium">{ing.quantity}</span> {ing.name}
                        {ing.optional && <span className="text-muted-foreground italic ml-1">(optional)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <NotebookPen className="w-5 h-5" />
                  Instructions
                </h4>
                <ol className="space-y-3">
                  {recipe.steps.map((step: any) => (
                    <li key={step.step_number} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {step.step_number}
                      </span>
                      <div className="flex-1 pt-0.5">
                        <p className="text-sm">{step.instruction}</p>
                        {step.duration_minutes && (
                          <span className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <ChartColumn className="w-5 h-5" />
                  Nutrition (per serving)
                </h4>
                
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{recipe.nutrition.calories}</div>
                    <div className="text-xs text-muted-foreground mt-1">Calories</div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{recipe.nutrition.protein_g}g</div>
                    <div className="text-xs text-muted-foreground mt-1">Protein</div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-950/50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{recipe.nutrition.carbs_g}g</div>
                    <div className="text-xs text-muted-foreground mt-1">Carbs</div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-950/50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{recipe.nutrition.fat_g}g</div>
                    <div className="text-xs text-muted-foreground mt-1">Fat</div>
                  </div>
                </div>

                {(recipe.nutrition.fiber_g != null || recipe.nutrition.sugar_g != null || recipe.nutrition.sodium_mg != null) && (
                  <div className="grid grid-cols-3 gap-2 text-sm pb-3 border-b">
                    {recipe.nutrition.fiber_g != null && (
                      <div className="text-center py-2">
                        <div className="font-bold">{recipe.nutrition.fiber_g}g</div>
                        <div className="text-xs text-muted-foreground">Fiber</div>
                      </div>
                    )}
                    {recipe.nutrition.sugar_g != null && (
                      <div className="text-center py-2">
                        <div className="font-bold">{recipe.nutrition.sugar_g}g</div>
                        <div className="text-xs text-muted-foreground">Sugar</div>
                      </div>
                    )}
                    {recipe.nutrition.sodium_mg != null && (
                      <div className="text-center py-2">
                        <div className="font-bold">{recipe.nutrition.sodium_mg}mg</div>
                        <div className="text-xs text-muted-foreground">Sodium</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  {isPublic ? (
                    <>
                      <Label className="text-sm font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                        <Earth className="w-4 h-4" />
                        Recipe is now public!
                      </Label>
                      <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                        Published
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Label className="text-sm font-semibold">Recipe saved privately</Label>
                      <Button 
                        onClick={() => handleSaveRecipe(true)} 
                        variant="outline" 
                        size="sm"
                        className="rounded-full flex items-center gap-1.5"
                      >
                        <Earth className="w-4 h-4" />
                        Make Public
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
        </div>
      )}
    </div>
  );
}
