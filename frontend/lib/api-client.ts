/**
 * Pattern: Adapter (Structural)
 * Adapts native fetch API to typed, application-specific interface
 * Provides consistent error handling and request/response transformation
 */

const API_URL = "http://localhost:8000/api";

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: any;
}

/**
 * Pattern: Adapter (Structural)
 * Authentication API adapter functions
 */

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Login failed");
  return data;
}

export async function signup(email: string, password: string, repeat_password: string, nickname: string) {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, repeat_password, nickname }),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Signup failed");
  return data;
}

export async function getUser(token: string) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    },
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to get user");
  return data;
}

export async function logout(token: string) {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` 
    },
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Logout failed");
  return data;
}

export async function forgotPassword(email: string) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Request failed");
  return data;
}

export async function resetPassword(token: string, password: string, repeat_password: string) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password, repeat_password }),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Password reset failed");
  return data;
}

/**
 * Pattern: Adapter (Structural)
 * Nutrition API adapter functions
 */

export async function analyzeAndLogDish(file: File, mealType: string, token?: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("meal_type", mealType);

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:8000/api/nutrition/analyze-and-log-dish`, {
    method: "POST",
    headers,
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(data.detail?.message || "Rate limit exceeded. Please sign up or log in to continue.");
    }
    throw new Error(data.detail || "Analysis and logging failed");
  }
  return data;
}

export async function uploadDishImage(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/nutrition/upload-dish-image`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Upload failed");
  return data;
}

export async function analyzeDish(imageUrl: string, token: string) {
  const response = await fetch(`${API_URL}/nutrition/analyze-dish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Analysis failed");
  return data;
}

export async function logMeal(mealData: any, token: string) {
  const response = await fetch(`${API_URL}/nutrition/log-meal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(mealData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to log meal");
  return data;
}

export async function getDailyLog(date: string, token: string) {
  const response = await fetch(`${API_URL}/nutrition/daily-log?target_date=${date}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to get daily log");
  return data;
}

export async function getDailyStats(date: string, token: string) {
  const response = await fetch(`${API_URL}/nutrition/daily-stats?target_date=${date}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to get daily stats");
  return data;
}

export async function getWeeklyStats(token: string, days: number = 7) {
  const response = await fetch(`${API_URL}/nutrition/weekly-stats?days=${days}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to get weekly stats");
  
  return data.stats.map((stat: any) => ({
    date: stat.date,
    protein: Math.round(stat.total_protein_g || 0),
    carbs: Math.round(stat.total_carbs_g || 0),
    fat: Math.round(stat.total_fat_g || 0),
  }));
}

export async function getWeeklyData(token: string) {
  return getWeeklyStats(token, 7);
}

export async function getNotifications(token: string, unreadOnly: boolean = true) {
  const response = await fetch(`${API_URL}/nutrition/notifications?unread_only=${unreadOnly}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to get notifications");
  return data;
}

export async function markNotificationRead(notificationId: string, token: string) {
  const response = await fetch(`${API_URL}/nutrition/notifications/${notificationId}/read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to mark notification as read");
  return data;
}

export async function clearNotifications(token: string) {
  const response = await fetch(`${API_URL}/nutrition/notifications`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to clear notifications");
  return data;
}

/**
 * Pattern: Adapter (Structural)
 * Recipe API adapter functions
 */

export async function generateRecipe(data: {
  ingredients_text: string;
  cuisine_preference?: string;
  dietary_restrictions?: string[];
  spice_level?: string;
  servings?: number;
}, token: string) {
  const response = await fetch(`${API_URL}/recipes/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || "Failed to generate recipe");
  return result;
}

export async function createRecipe(recipeData: any, token: string) {
  const response = await fetch(`${API_URL}/recipes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(recipeData),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to create recipe");
  return data;
}

export async function getRecipes(filters: any = {}, token: string) {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) params.append(key, filters[key]);
  });

  const response = await fetch(`${API_URL}/recipes?${params}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to get recipes");
  return data;
}

export async function getRecipe(id: string, token: string) {
  const response = await fetch(`${API_URL}/recipes/${id}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to get recipe");
  return data;
}

export async function uploadRecipeImage(file: File, token: string): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/recipes/upload-image`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Upload failed");
  return data;
}

/**
 * Pattern: Adapter (Structural)
 * User profile API adapter functions
 */

export async function updateDietaryPreferences(restrictions: string[], token: string) {
  const response = await fetch(`${API_URL}/auth/dietary-preferences`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ dietary_restrictions: restrictions }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to update dietary preferences");
  return data;
}

export async function updatePreferredCuisines(cuisines: string[], token: string) {
  const response = await fetch(`${API_URL}/auth/preferred-cuisines`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ preferred_cuisines: cuisines }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to update preferred cuisines");
  return data;
}

export async function updateNutritionGoals(goals: {
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carbs_goal: number;
  daily_fat_goal: number;
}, token: string) {
  const response = await fetch(`${API_URL}/auth/nutrition-goals`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(goals),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to update nutrition goals");
  return data;
}

export async function deleteAccount(token: string) {
  const response = await fetch(`${API_URL}/auth/account`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Failed to delete account");
  return data;
}
