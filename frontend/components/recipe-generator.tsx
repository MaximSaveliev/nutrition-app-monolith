'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface RecipeStep {
  step_number: number;
  instruction: string;
  duration_minutes?: number;
}

interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  steps: RecipeStep[];
  nutrition_info: NutritionInfo;
  dietary_restrictions: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: string;
}

const dietaryRestrictions = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'dairy_free', label: 'Dairy Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
];

export function RecipeGenerator() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [ingredientText, setIngredientText] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState('');
  const [maxTime, setMaxTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestrictionChange = (value: string) => {
    setRestrictions(prev =>
      prev.includes(value)
        ? prev.filter(r => r !== value)
        : [...prev, value]
    );
  };

  const generateRecipe = async () => {
    if (!selectedImage && !ingredientText) {
      setError('Please provide either an image or list of ingredients');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ingredients = ingredientText
        ? ingredientText.split(',').map(i => i.trim()).filter(i => i)
        : undefined;

      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: selectedImage,
          ingredients,
          dietary_restrictions: restrictions,
          preferred_cuisine: cuisine || undefined,
          cooking_time_max: maxTime ? parseInt(maxTime) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recipe');
      }

      const data = await response.json();
      setRecipe(data.recipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Recipe</CardTitle>
          <CardDescription>
            Upload ingredients photo or enter them manually to get a custom recipe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="image-upload">Upload Ingredients Photo (Optional)</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="mt-2"
            />
          </div>

          {selectedImage && (
            <div className="mt-4">
              <img
                src={selectedImage}
                alt="Ingredients"
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}

          <div>
            <Label htmlFor="ingredients">Or Enter Ingredients (comma-separated)</Label>
            <Input
              id="ingredients"
              type="text"
              placeholder="e.g., chicken, rice, broccoli, garlic"
              value={ingredientText}
              onChange={(e) => setIngredientText(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cuisine">Preferred Cuisine (Optional)</Label>
              <Input
                id="cuisine"
                type="text"
                placeholder="e.g., Italian, Asian"
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="max-time">Max Cooking Time (minutes)</Label>
              <Input
                id="max-time"
                type="number"
                placeholder="e.g., 45"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label>Dietary Restrictions</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {dietaryRestrictions.map(restriction => (
                <div key={restriction.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`gen-${restriction.value}`}
                    checked={restrictions.includes(restriction.value)}
                    onCheckedChange={() => handleRestrictionChange(restriction.value)}
                  />
                  <label
                    htmlFor={`gen-${restriction.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {restriction.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={generateRecipe}
            disabled={loading || (!selectedImage && !ingredientText)}
            className="w-full"
          >
            {loading ? 'Generating Recipe...' : 'Generate Recipe'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {recipe && (
        <Card>
          <CardHeader>
            <CardTitle>{recipe.title}</CardTitle>
            <CardDescription>{recipe.description}</CardDescription>
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              <span>⏱️ Prep: {recipe.prep_time_minutes} min</span>
              <span>🍳 Cook: {recipe.cook_time_minutes} min</span>
              <span>👥 Servings: {recipe.servings}</span>
              <span>📊 {recipe.difficulty}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Nutrition (per serving)</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Calories</div>
                  <div className="text-xl font-bold">{recipe.nutrition_info.calories}</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Protein</div>
                  <div className="text-xl font-bold">{recipe.nutrition_info.protein}g</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Carbs</div>
                  <div className="text-xl font-bold">{recipe.nutrition_info.carbohydrates}g</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <div className="text-sm text-gray-600">Fat</div>
                  <div className="text-xl font-bold">{recipe.nutrition_info.fat}g</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Ingredients</h3>
              <ul className="list-disc list-inside space-y-1">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Instructions</h3>
              <div className="space-y-4">
                {recipe.steps.map((step) => (
                  <div key={step.step_number} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      {step.step_number}
                    </div>
                    <div className="flex-1">
                      <p>{step.instruction}</p>
                      {step.duration_minutes && (
                        <p className="text-sm text-gray-600 mt-1">
                          ⏱️ {step.duration_minutes} minutes
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {recipe.dietary_restrictions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Dietary Information</h3>
                <div className="flex flex-wrap gap-2">
                  {recipe.dietary_restrictions.map((restriction, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {restriction.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
