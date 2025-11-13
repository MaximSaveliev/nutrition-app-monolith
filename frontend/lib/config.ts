/**
 * Application Configuration
 * 
 * Centralized configuration for API endpoints
 * Automatically uses current origin + /api for cleaner deployment
 */

/**
 * Get the API base URL
 * - Client-side: Uses window.location.origin + /api
 * - Server-side: Uses environment variable or localhost fallback
 */
export const getApiUrl = (): string => {
  // Client-side: use current origin (works for both dev and production)
  if (typeof window !== 'undefined') {
    return window.location.origin + "/api";
  }
  
  // Server-side: use environment variable or localhost fallback
  return process.env.NEXT_PUBLIC_BACKEND_URL 
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`
    : "http://localhost:8000/api";
};

/**
 * Get the full backend URL (with /api suffix)
 * Use this for direct backend calls
 */
export const API_URL = typeof window !== 'undefined' 
  ? window.location.origin + "/api" 
  : "";

/**
 * Get the backend base URL (without /api suffix)
 * Use this when you need to append /api yourself
 */
export const getBackendUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
};

export const BACKEND_URL = getBackendUrl();
