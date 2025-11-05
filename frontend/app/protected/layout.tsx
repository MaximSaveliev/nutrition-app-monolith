import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full border-b border-b-foreground/10">
        <div className="max-w-5xl mx-auto flex justify-between items-center p-4">
          <Link href="/" className="font-bold text-xl">
            🍽️ Nutrition App
          </Link>
          <div className="flex items-center gap-4">
            <AuthButton />
            <ThemeSwitcher />
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-5xl w-full mx-auto p-8">
        {children}
      </main>
      <footer className="w-full border-t p-4 text-center text-sm text-muted-foreground">
        <p>Powered by FastAPI + Supabase + Groq AI</p>
      </footer>
    </div>
  );
}
