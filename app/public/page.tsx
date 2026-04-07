import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Tag, ArrowRight, Lock } from "lucide-react";

export default async function PublicPage() {
  const categories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      documents: {
        where: { isPublic: true },
        orderBy: { order: "asc" },
        select: { id: true, slug: true, title: true },
      },
    },
  });

  const hasContent = categories.some(c => c.documents.length > 0);

  if (!hasContent) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--muted)] opacity-50" />
          <h1 className="text-2xl font-semibold mb-2">No public documents</h1>
          <p className="text-[var(--muted)]">Check back later for documentation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-[var(--sidebar)]">
        <div className="max-w-5xl mx-auto p-6">
          <h1 className="text-2xl font-semibold">Documentation</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Browse all public documentation</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-[var(--sidebar)] border-b border-[var(--border)]">
                <Tag className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-lg font-semibold">{category.name}</h2>
                <span className="text-sm text-[var(--muted)] ml-auto">
                  {category.documents.length} docs
                </span>
              </div>
              {category.documents.length > 0 ? (
                <div className="divide-y divide-[var(--border)]">
                  {category.documents.map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/docs/${doc.id}/public`}
                      className="flex items-center gap-3 p-4 hover:bg-[var(--sidebar)] transition-colors"
                    >
                      <FileText className="w-5 h-5 text-[var(--muted)]" />
                      <span className="flex-1 font-medium">{doc.title}</span>
                      <ArrowRight className="w-4 h-4 text-[var(--muted)]" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-[var(--muted)]">
                  No public documents in this category
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}