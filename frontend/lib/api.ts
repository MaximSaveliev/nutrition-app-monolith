const API_URL = typeof window !== 'undefined' ? window.location.origin + "/api" : "";

export async function login(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || "Login failed");
  return data;
}

export async function signup(email: string, password: string, repeat_password: string) {
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, repeat_password }),
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
