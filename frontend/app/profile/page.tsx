"use client";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User, Mail, UtensilsCrossed, AlertTriangle, Loader2, Globe, Target } from "lucide-react";
import { updateDietaryPreferences, updatePreferredCuisines, updateNutritionGoals, deleteAccount } from "@/lib/api-client";

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

const PREFERRED_CUISINES = [
  { value: "italian", label: "Italian" },
  { value: "chinese", label: "Chinese" },
  { value: "japanese", label: "Japanese" },
  { value: "mexican", label: "Mexican" },
  { value: "indian", label: "Indian" },
  { value: "french", label: "French" },
  { value: "thai", label: "Thai" },
  { value: "greek", label: "Greek" },
  { value: "spanish", label: "Spanish" },
  { value: "korean", label: "Korean" },
  { value: "vietnamese", label: "Vietnamese" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "american", label: "American" },
  { value: "mediterranean", label: "Mediterranean" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, refreshUser } = useAuth();
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [calorieGoal, setCalorieGoal] = useState<string>("2000");
  const [proteinGoal, setProteinGoal] = useState<string>("150");
  const [carbsGoal, setCarbsGoal] = useState<string>("250");
  const [fatGoal, setFatGoal] = useState<string>("70");
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [savingCuisines, setSavingCuisines] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [cuisineMessage, setCuisineMessage] = useState("");
  const [goalsMessage, setGoalsMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.dietary_restrictions) {
      setSelectedRestrictions(user.dietary_restrictions);
    }
    if (user?.preferred_cuisines) {
      setSelectedCuisines(user.preferred_cuisines);
    }
    if (user?.daily_calorie_goal) {
      setCalorieGoal(user.daily_calorie_goal.toString());
    }
    if (user?.daily_protein_goal) {
      setProteinGoal(user.daily_protein_goal.toString());
    }
    if (user?.daily_carbs_goal) {
      setCarbsGoal(user.daily_carbs_goal.toString());
    }
    if (user?.daily_fat_goal) {
      setFatGoal(user.daily_fat_goal.toString());
    }
  }, [user]);

  const handleRestrictionToggle = (value: string) => {
    setSelectedRestrictions(prev =>
      prev.includes(value)
        ? prev.filter(r => r !== value)
        : [...prev, value]
    );
  };

  const handleCuisineToggle = (value: string) => {
    setSelectedCuisines(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    );
  };

  const handleSavePreferences = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setSavingPreferences(true);
    setPreferenceMessage("");

    try {
      await updateDietaryPreferences(selectedRestrictions, token);
      setPreferenceMessage("✓ Dietary preferences saved successfully!");
      await refreshUser();
      
      setTimeout(() => setPreferenceMessage(""), 3000);
    } catch (error: any) {
      setPreferenceMessage(`✗ ${error.message}`);
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleSaveCuisines = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setSavingCuisines(true);
    setCuisineMessage("");

    try {
      await updatePreferredCuisines(selectedCuisines, token);
      setCuisineMessage("✓ Preferred cuisines saved successfully!");
      await refreshUser();
      
      setTimeout(() => setCuisineMessage(""), 3000);
    } catch (error: any) {
      setCuisineMessage(`✗ ${error.message}`);
    } finally {
      setSavingCuisines(false);
    }
  };

  const handleSaveGoals = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setSavingGoals(true);
    setGoalsMessage("");

    try {
      await updateNutritionGoals({
        daily_calorie_goal: parseInt(calorieGoal),
        daily_protein_goal: parseInt(proteinGoal),
        daily_carbs_goal: parseInt(carbsGoal),
        daily_fat_goal: parseInt(fatGoal),
      }, token);
      setGoalsMessage("✓ Nutrition goals saved successfully!");
      await refreshUser();
      
      setTimeout(() => setGoalsMessage(""), 3000);
    } catch (error: any) {
      setGoalsMessage(`✗ ${error.message}`);
    } finally {
      setSavingGoals(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    setDeletingAccount(true);

    try {
      await deleteAccount(token);
      localStorage.removeItem("access_token");
      router.push("/auth/login");
    } catch (error: any) {
      alert(`Failed to delete account: ${error.message}`);
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

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

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your account information and preferences
            </p>
          </div>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nickname
                </Label>
                <Input
                  id="nickname"
                  value={user?.nickname || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your nickname cannot be changed after registration
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label>Account Status</Label>
                <div className="flex gap-2">
                  <Badge variant="default" className="bg-green-600 pointer-events-none select-none">
                    ✓ Email Confirmed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Daily Nutrition Goals Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Daily Nutrition Goals
              </CardTitle>
              <CardDescription>
                Set your daily calorie and macro targets for personalized tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calories">Calories (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(e.target.value)}
                    placeholder="2000"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={proteinGoal}
                    onChange={(e) => setProteinGoal(e.target.value)}
                    placeholder="150"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carbs">Carbs (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={carbsGoal}
                    onChange={(e) => setCarbsGoal(e.target.value)}
                    placeholder="250"
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fat">Fat (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={fatGoal}
                    onChange={(e) => setFatGoal(e.target.value)}
                    placeholder="70"
                    min="0"
                  />
                </div>
              </div>

              {goalsMessage && (
                <p className={`text-sm ${goalsMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {goalsMessage}
                </p>
              )}

              <Button 
                onClick={handleSaveGoals} 
                disabled={savingGoals}
                className="w-full"
              >
                {savingGoals ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Goals"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Dietary Preferences Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5" />
                Dietary Preferences
              </CardTitle>
              <CardDescription>
                Set your dietary restrictions for personalized recipe recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <div key={restriction.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={restriction.value}
                      checked={selectedRestrictions.includes(restriction.value)}
                      onCheckedChange={() => handleRestrictionToggle(restriction.value)}
                    />
                    <label
                      htmlFor={restriction.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {restriction.label}
                    </label>
                  </div>
                ))}
              </div>

              {preferenceMessage && (
                <p className={`text-sm ${preferenceMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {preferenceMessage}
                </p>
              )}

              <Button 
                onClick={handleSavePreferences} 
                disabled={savingPreferences}
                className="w-full"
              >
                {savingPreferences ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Preferred Cuisines Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Preferred Cuisines
              </CardTitle>
              <CardDescription>
                Select your favorite cuisines to get tailored recipe suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {PREFERRED_CUISINES.map((cuisine) => (
                  <div key={cuisine.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={cuisine.value}
                      checked={selectedCuisines.includes(cuisine.value)}
                      onCheckedChange={() => handleCuisineToggle(cuisine.value)}
                    />
                    <label
                      htmlFor={cuisine.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {cuisine.label}
                    </label>
                  </div>
                ))}
              </div>

              {cuisineMessage && (
                <p className={`text-sm ${cuisineMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                  {cuisineMessage}
                </p>
              )}

              <Button 
                onClick={handleSaveCuisines} 
                disabled={savingCuisines}
                className="w-full"
              >
                {savingCuisines ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Cuisines"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showDeleteConfirm ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete Account
                  </Button>
                </>
              ) : (
                <div className="space-y-4 p-4 border border-destructive/50 rounded-md bg-destructive/5">
                  <p className="text-sm font-medium">
                    Are you absolutely sure? This will permanently delete:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Your account and profile</li>
                    <li>All your saved recipes</li>
                    <li>All your scanned dishes history</li>
                    <li>All your nutrition data</li>
                  </ul>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount}
                    >
                      {deletingAccount ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Yes, Delete My Account"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deletingAccount}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
