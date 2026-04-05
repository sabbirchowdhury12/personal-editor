"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Signup failed");
      }

      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <FileText className="w-8 h-8 text-[var(--accent)]" />
          <span className="text-2xl font-semibold">DocHub</span>
        </div>
        
        <h1 className="text-xl font-semibold mb-6">Create an account</h1>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2 bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
