import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Wheat, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RecipeNotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <Wheat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Recipe not found</h2>
          <p className="text-muted-foreground mb-4">
            The recipe you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/recipes">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
