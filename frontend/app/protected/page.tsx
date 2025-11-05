"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function ProtectedPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/");
      return;
    }
    
    getUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
        router.push("/");
      });
  }, [router]);

  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-accent p-4 rounded-md flex items-start gap-2">
        <span>ℹ️</span>
        <span>This is your personal data - only you can see this when authenticated</span>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Protected Page Example</h2>
        <p className="text-muted-foreground">
          This demonstrates a protected route. In the full app, pages like this will show:
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 border rounded-lg">
            <div className="text-2xl mb-2">👤</div>
            <h3 className="font-bold mb-1">Profile</h3>
            <p className="text-muted-foreground">Your personal information and dietary preferences</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl mb-2">📖</div>
            <h3 className="font-bold mb-1">My Recipes</h3>
            <p className="text-muted-foreground">Recipes you've saved or generated</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-bold mb-1">Nutrition History</h3>
            <p className="text-muted-foreground">Track your daily nutrition over time</p>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-bold mb-1">Food Scans</h3>
            <p className="text-muted-foreground">History of all your analyzed meals</p>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2 mt-6">
          <h3 className="font-bold">Your Account Info</h3>
          <div className="text-sm space-y-1">
            <div><span className="font-semibold">Email:</span> {user.email}</div>
            <div><span className="font-semibold">User ID:</span> {user.id}</div>
            <div><span className="font-semibold">Verified:</span> {user.email_confirmed_at ? "✓ Yes" : "⏳ Pending"}</div>
          </div>
        </div>

        <Button 
          onClick={() => {
            localStorage.removeItem("access_token");
            router.push("/");
          }}
          variant="destructive" 
          className="w-full"
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
