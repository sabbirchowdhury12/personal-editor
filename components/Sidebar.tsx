"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Plus, LogOut, Search, Home, Tag } from "lucide-react";

interface SidebarProps {
  documents: { id: string; title: string }[];
  categories: { id: string; name: string }[];
}

export function Sidebar({ documents, categories }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 h-screen bg-[var(--sidebar)] border-r border-[var(--border)] flex flex-col fixed left-0 top-0">
      <div className="p-4 border-b border-[var(--border)]">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold text-lg"
        >
          <FileText className="w-5 h-5" />
          DocHub
        </Link>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search docs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md ${
              pathname === "/dashboard"
                ? "bg-[var(--accent)] text-white"
                : "hover:bg-[var(--border)]"
            }`}
          >
            <Home className="w-4 h-4" />
            All Documents
          </Link>
        </div>

        {categories.length > 0 && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--muted)]">
              <Tag className="w-4 h-4" />
              Categories
            </div>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/dashboard?category=${cat.id}`}
                className="flex items-center gap-2 px-3 py-2 pl-9 text-sm rounded-md hover:bg-[var(--border)]"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        <div className="px-3 py-2">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[var(--muted)]">
            <FileText className="w-4 h-4" />
            Documents
          </div>
          {filteredDocs.map((doc) => (
            <Link
              key={doc.id}
              href={`/docs/${doc.id}`}
              className={`flex items-center gap-2 px-3 py-2 pl-9 text-sm rounded-md truncate ${
                pathname === `/docs/${doc.id}`
                  ? "bg-[var(--accent)] text-white"
                  : "hover:bg-[var(--border)]"
              }`}
            >
              {doc.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-[var(--border)]">
        <Link
          href="/docs/new"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          New Document
        </Link>
        <button
          onClick={handleSignOut}
          disabled={loggingOut}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 mt-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] rounded-md hover:bg-[var(--border)] disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
