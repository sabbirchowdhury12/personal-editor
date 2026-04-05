import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)]">
      <div className="text-center max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-6">
          <FileText className="w-12 h-12 text-[var(--accent)]" />
        </div>
        <h1 className="text-4xl font-semibold mb-4">DocHub</h1>
        <p className="text-lg text-[var(--muted)] mb-8">
          A minimal, developer-friendly documentation platform with AI-powered features
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-md hover:opacity-90"
          >
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-2 px-6 py-3 border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
