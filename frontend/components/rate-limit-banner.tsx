/**
 * RateLimitBanner Component
 * 
 * Status Display Component - Shows AI request rate limit status for non-authenticated users
 * Encourages sign-up when nearing or reaching free trial limit
 */
"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";

interface RateLimitStatus {
  authenticated: boolean;
  unlimited: boolean;
  remaining: number;
  total_limit: number;
  used?: number;
  reset_at?: string;
}

export function RateLimitBanner() {
  const router = useRouter();
  const [status, setStatus] = useState<RateLimitStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRateLimit();
  }, []);

  const checkRateLimit = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("http://localhost:8000/api/nutrition/rate-limit-status", {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to check rate limit:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) return null;
  if (status.authenticated) return null;
  if (status.used === 0) return null;

  return (
    <div className="mb-4 p-3 md:p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium">Free Trial:</span>
          </div>
          <Badge variant={status.remaining > 0 ? "secondary" : "destructive"} className="text-xs">
            {status.remaining} / {status.total_limit} requests remaining
          </Badge>
        </div>
        {status.remaining === 0 && (
          <button
            onClick={() => router.push("/auth/sign-up")}
            className="text-sm font-medium text-amber-700 dark:text-amber-400 hover:underline text-left sm:text-right whitespace-nowrap"
          >
            Sign up for unlimited →
          </button>
        )}
      </div>
      {status.remaining > 0 && status.remaining <= 1 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          Sign up or log in to get unlimited AI requests!
        </p>
      )}
    </div>
  );
}
