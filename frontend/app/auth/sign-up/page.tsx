import { SignUpForm } from "@/components/sign-up-form";
import Link from "next/link";
import { Apple } from "lucide-react";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-background to-muted/20">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold mb-2">
            <Apple className="h-8 w-8 text-primary" />
            <span>
              NutriSnap
            </span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Create your free account
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  );
}
