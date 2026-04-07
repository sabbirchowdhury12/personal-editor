"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  FileText,
  Tag,
  Loader2,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FileX,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface Doc {
  id: string;
  title: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  order: number;
}

interface CategoryWithDocs {
  id: string;
  name: string;
  order: number;
  docs: Doc[];
}

interface SortableDocProps {
  id: string;
  doc: Doc;
  onDragEnd: (activeId: string, overId: string) => void;
  docs: Doc[];
}

function SortableDocItem({ id, doc, onDragEnd, docs }: SortableDocProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-[var(--card)] border border-[var(--border)] rounded-lg mb-2 hover:border-[var(--accent)] transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-[var(--muted)] hover:text-[var(--foreground)] active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </button>
      <FileText className="w-5 h-5 text-[var(--accent)]" />
      <Link
        href={`/docs/${doc.id}`}
        className="flex-1 text-sm font-medium hover:text-[var(--accent)] truncate"
      >
        {doc.title}
      </Link>
      <span className="text-xs text-[var(--muted)] bg-[var(--sidebar)] px-2 py-1 rounded">#{doc.order}</span>
    </div>
  );
}

export default function DocumentOrderPage() {
  const [categories, setCategories] = useState<CategoryWithDocs[]>([]);
  const [uncategorizedDocs, setUncategorizedDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/documents?all=true");
      if (res.ok) {
        const allDocs: Doc[] = await res.json();
        
        const categorized: CategoryWithDocs[] = [];
        const uncategorized: Doc[] = [];
        
        allDocs.forEach((doc: any) => {
          if (doc.categoryId) {
            const existingCat = categorized.find(c => c.id === doc.categoryId);
            if (existingCat) {
              existingCat.docs.push(doc);
            } else {
              categorized.push({
                id: doc.categoryId,
                name: doc.category?.name || 'Unknown',
                order: doc.category?.order ?? 0,
                docs: [doc]
              });
            }
          } else {
            uncategorized.push(doc);
          }
        });

        categorized.sort((a, b) => a.order - b.order);
        categorized.forEach(cat => cat.docs.sort((a, b) => a.order - b.order));
        uncategorized.sort((a, b) => a.order - b.order);

        setCategories(categorized);
        setUncategorizedDocs(uncategorized);
      }
    } catch (err) {
      console.error('Failed to load:', err);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(id: string) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDragEnd(catId: string | 'uncategorized') {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      if (catId === 'uncategorized') {
        setUncategorizedDocs((docs) => {
          const oldIndex = docs.findIndex((d) => d.id === active.id);
          const newIndex = docs.findIndex((d) => d.id === over.id);
          return arrayMove(docs, oldIndex, newIndex);
        });
      } else {
        setCategories((cats) =>
          cats.map((cat) => {
            if (cat.id !== catId) return cat;
            const oldIndex = cat.docs.findIndex((d) => d.id === active.id);
            const newIndex = cat.docs.findIndex((d) => d.id === over.id);
            return { ...cat, docs: arrayMove(cat.docs, oldIndex, newIndex) };
          })
        );
      }
    };
  }

  async function saveOrder() {
    setSaving(true);
    try {
      for (const cat of categories) {
        if (cat.docs.length > 0) {
          const ids = cat.docs.map((d) => d.id);
          await fetch("/api/documents", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, categoryId: cat.id }),
          });
        }
      }
      if (uncategorizedDocs.length > 0) {
        const ids = uncategorizedDocs.map((d) => d.id);
        await fetch("/api/documents", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, categoryId: null }),
        });
      }
      toast.success("Document order saved");
    } catch {
      toast.error("Failed to save order");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const totalDocs = categories.reduce((sum, cat) => sum + cat.docs.length, 0) + uncategorizedDocs.length;

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Document Order</h1>
          <p className="text-sm text-[var(--muted)]">Drag and drop to reorder documents • {totalDocs} total documents</p>
        </div>
        <button
          onClick={saveOrder}
          disabled={saving}
          className="px-5 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2 font-medium"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save Order
        </button>
      </div>

      {totalDocs === 0 ? (
        <div className="text-center py-16 bg-[var(--card)] border border-[var(--border)] rounded-lg">
          <FileX className="w-16 h-16 mx-auto mb-4 text-[var(--muted)] opacity-50" />
          <p className="text-lg font-medium mb-2">No documents found</p>
          <p className="text-sm text-[var(--muted)] mb-4">Create your first document to get started</p>
          <Link href="/docs/new" className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Create Document
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {uncategorizedDocs.length > 0 && (
            <div className="border border-[var(--border)] rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory('uncategorized')}
                className="w-full flex items-center gap-3 p-4 bg-[var(--sidebar)] hover:bg-[var(--border)] transition-colors"
              >
                {expandedCats.has('uncategorized') ? (
                  <ChevronDown className="w-5 h-5 text-[var(--muted)]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
                )}
                <FolderOpen className="w-5 h-5 text-[var(--muted)]" />
                <span className="font-medium flex-1 text-left">Uncategorized</span>
                <span className="text-sm text-[var(--muted)] bg-[var(--background)] px-3 py-1 rounded-full">{uncategorizedDocs.length} docs</span>
              </button>
              {expandedCats.has('uncategorized') && (
                <div className="p-4 bg-[var(--background)]">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd('uncategorized')}
                  >
                    <SortableContext items={uncategorizedDocs.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                      {uncategorizedDocs.map((doc) => (
                        <SortableDocItem 
                          key={doc.id} 
                          id={doc.id} 
                          doc={doc} 
                          onDragEnd={() => {}}
                          docs={uncategorizedDocs}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          )}

          {categories.map((cat) => (
            <div key={cat.id} className="border border-[var(--border)] rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center gap-3 p-4 bg-[var(--sidebar)] hover:bg-[var(--border)] transition-colors"
              >
                {expandedCats.has(cat.id) ? (
                  <ChevronDown className="w-5 h-5 text-[var(--muted)]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[var(--muted)]" />
                )}
                <Tag className="w-5 h-5 text-[var(--accent)]" />
                <span className="font-medium flex-1 text-left">{cat.name}</span>
                <span className="text-sm text-[var(--muted)] bg-[var(--background)] px-3 py-1 rounded-full">{cat.docs.length} docs</span>
              </button>
              {expandedCats.has(cat.id) && (
                <div className="p-4 bg-[var(--background)]">
                  {cat.docs.length > 0 ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd(cat.id)}
                    >
                      <SortableContext items={cat.docs.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                        {cat.docs.map((doc) => (
                          <SortableDocItem 
                            key={doc.id} 
                            id={doc.id} 
                            doc={doc} 
                            onDragEnd={() => {}}
                            docs={cat.docs}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-8 text-[var(--muted)]">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No documents in this category</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}