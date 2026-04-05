import { prisma } from "@/lib/prisma";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";
import { Globe, Lock, Calendar, Tag } from "lucide-react";

export default async function PublicDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      category: true,
    },
  });

  if (!document || !document.isPublic) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="max-w-4xl mx-auto p-8">
        <header className="mb-8 pb-8 border-b border-[var(--border)]">
          <h1 className="text-4xl font-semibold mb-4">{document.title}</h1>
          <div className="flex items-center gap-4 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-1">
              {document.isPublic ? (
                <Globe className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {document.isPublic ? "Public" : "Private"}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {document.updatedAt.toLocaleDateString()}
            </div>
            {document.user.name && (
              <span>by {document.user.name}</span>
            )}
          </div>
          {document.category && (
            <div className="flex items-center gap-2 mt-4">
              <Tag className="w-4 h-4 text-[var(--muted)]" />
              <span className="px-2 py-0.5 text-xs bg-[var(--sidebar)] rounded-full">
                {document.category.name}
              </span>
            </div>
          )}
        </header>
        
        <article className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {document.content}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
