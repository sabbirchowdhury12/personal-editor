"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText, Globe, Lock, ChevronRight, Search, Loader2, Tag } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  categoryId: string | null;
  category: Category | null;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory, search]);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (selectedCategory) params.set("category", selectedCategory);
      
      const res = await fetch(`/api/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/dashboard?q=${search}`);
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <Link
          href="/docs/new"
          className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:opacity-90"
        >
          New Document
        </Link>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No documents found</p>
          <Link
            href="/docs/new"
            className="text-[var(--accent)] hover:underline mt-2 inline-block"
          >
            Create your first document
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/docs/${doc.id}`}
              className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg hover:bg-[var(--sidebar)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--muted)]" />
                <div>
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-sm text-[var(--muted)] flex items-center gap-1">
                    {doc.category ? (
                      <>
                        <Tag className="w-3 h-3" />
                        {doc.category.name}
                      </>
                    ) : (
                      "No category"
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {doc.isPublic ? (
                  <Globe className="w-4 h-4 text-[var(--muted)]" />
                ) : (
                  <Lock className="w-4 h-4 text-[var(--muted)]" />
                )}
                <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
