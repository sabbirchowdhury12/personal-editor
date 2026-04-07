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
  Pencil,
  Trash2,
  Plus,
  Loader2,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  _count?: { documents: number };
}

interface CategoryDoc {
  id: string;
  name: string;
  order: number;
}

interface SortableItemProps {
  id: string;
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (id: string) => void;
  documents: Map<string, CategoryDoc[]>;
  expandedCategories: Set<string>;
  toggleCategory: (id: string) => void;
}

function SortableCategoryItem({
  id,
  category,
  onEdit,
  onDelete,
  documents,
  expandedCategories,
  toggleCategory,
}: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const categoryDocs = documents.get(category.id) || [];
  const isExpanded = expandedCategories.has(category.id);

  return (
    <div ref={setNodeRef} style={style} className="bg-[var(--card)] border border-[var(--border)] rounded-lg mb-2">
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleCategory(category.id)}
          className="text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <span className="flex-1 font-medium">{category.name}</span>
        <span className="text-xs text-[var(--muted)]">Order: {category.order}</span>
        <button
          onClick={() => onEdit(category)}
          className="p-1 text-[var(--muted)] hover:text-[var(--accent)]"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(category.id)}
          className="p-1 text-[var(--muted)] hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {isExpanded && categoryDocs.length > 0 && (
        <div className="px-3 pb-3 pl-10">
          <div className="bg-[var(--sidebar)] rounded-md p-2">
            <div className="text-xs font-medium text-[var(--muted)] mb-2">Documents in this category</div>
            {categoryDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 py-1 text-sm text-[var(--foreground)]"
              >
                <FileText className="w-3 h-3 text-[var(--muted)]" />
                {doc.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [documentsByCategory, setDocumentsByCategory] = useState<Map<string, CategoryDoc[]>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories?includeDocs=true");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
        const map = new Map<string, { id: string; name: string; order: number }[]>();
        Object.entries(data.documentsByCategory).forEach(([key, value]) => {
          map.set(key, value as { id: string; name: string; order: number }[]);
        });
        setDocumentsByCategory(map);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setCategories((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  async function saveOrder() {
    setSaving(true);
    try {
      const ids = categories.map((c) => c.id);
      await fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      toast.success("Order saved");
    } catch {
      toast.error("Failed to save order");
    } finally {
      setSaving(false);
    }
  }

  function openModal(category?: Category) {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name);
    } else {
      setEditingCategory(null);
      setCategoryName("");
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCategory(null);
    setCategoryName("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      if (editingCategory) {
        await fetch(`/api/categories?id=${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName }),
        });
        toast.success("Category updated");
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryName }),
        });
        toast.success("Category created");
      }
      closeModal();
      fetchCategories();
    } catch {
      toast.error("Something went wrong");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      toast.success("Category deleted");
      fetchCategories();
    } catch {
      toast.error("Failed to delete");
    }
  }

  function toggleCategory(id: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <div className="flex gap-2">
          <button
            onClick={saveOrder}
            disabled={saving}
            className="px-4 py-2 border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)] disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Order"}
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:opacity-90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          <p>No categories yet</p>
          <button onClick={() => openModal()} className="text-[var(--accent)] hover:underline mt-2">
            Create your first category
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {categories.map((category) => (
              <SortableCategoryItem
                key={category.id}
                id={category.id}
                category={category}
                onEdit={openModal}
                onDelete={handleDelete}
                documents={documentsByCategory}
                expandedCategories={expandedCategories}
                toggleCategory={toggleCategory}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
              <button onClick={closeModal} className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 rounded hover:bg-[var(--sidebar)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category name"
                className="w-full px-3 py-2.5 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] mb-4 bg-[var(--background)]"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)] text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:opacity-90 text-sm font-medium"
                >
                  {editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}