"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new analyze-dish page
    router.replace("/analyze-dish");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg text-muted-foreground">Redirecting...</div>
    </div>
  );
}
