'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

interface DishAnalysisResult {
  dish_name: string;
  nutrition_info: NutritionInfo;
  ingredients_detected: string[];
  confidence_score: number;
  warnings: string[];
}

const dietaryRestrictions = [
  { value: 'vegan', label: 'Vegan' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'gluten_free', label: 'Gluten Free' },
  { value: 'dairy_free', label: 'Dairy Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
];

export function DishAnalyzer() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DishAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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

  const analyzeDish = async () => {
    if (!selectedImage) {
      setError('Please select an image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-dish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_data: selectedImage,
          dietary_restrictions: restrictions,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze dish');
      }

      const data = await response.json();
      setResult(data);
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
          <CardTitle>Analyze Your Dish</CardTitle>
          <CardDescription>
            Upload a photo of your meal to get detailed nutritional information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="image-upload">Upload Image</Label>
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
                alt="Selected dish"
                className="max-w-full h-auto rounded-lg"
                style={{ maxHeight: '300px' }}
              />
            </div>
          )}

          <div>
            <Label>Dietary Restrictions</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              {dietaryRestrictions.map(restriction => (
                <div key={restriction.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={restriction.value}
                    checked={restrictions.includes(restriction.value)}
                    onCheckedChange={() => handleRestrictionChange(restriction.value)}
                  />
                  <label
                    htmlFor={restriction.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {restriction.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={analyzeDish} disabled={loading || !selectedImage} className="w-full">
            {loading ? 'Analyzing...' : 'Analyze Dish'}
          </Button>

          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>{result.dish_name}</CardTitle>
            <CardDescription>
              Confidence: {(result.confidence_score * 100).toFixed(0)}%
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Nutrition Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">Calories</div>
                  <div className="text-2xl font-bold">{result.nutrition_info.calories}</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600">Protein</div>
                  <div className="text-2xl font-bold">{result.nutrition_info.protein}g</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-gray-600">Carbs</div>
                  <div className="text-2xl font-bold">{result.nutrition_info.carbohydrates}g</div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm text-gray-600">Fat</div>
                  <div className="text-2xl font-bold">{result.nutrition_info.fat}g</div>
                </div>
              </div>
            </div>

            {result.ingredients_detected.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Detected Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {result.ingredients_detected.map((ingredient, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.warnings.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-red-600">Warnings</h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="text-red-600">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
