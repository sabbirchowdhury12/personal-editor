"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Save,
  Trash2,
  Eye,
  Edit3,
  Globe,
  Lock,
  X,
  Sparkles,
  Wand2,
  FileText,
  Code,
  Loader2,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Code2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Modal } from "@/components/Modal";

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
}

interface EditorProps {
  params: Promise<{ id: string }>;
}

export default function DocumentEditor({ params }: EditorProps) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [generateTopic, setGenerateTopic] = useState("");
  const [explainCode, setExplainCode] = useState("");
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!isNew) {
      async function fetchDoc() {
        const res = await fetch(`/api/documents/${id}`);
        if (res.ok) {
          const doc: Document = await res.json();
          setTitle(doc.title);
          setContent(doc.content);
          setIsPublic(doc.isPublic);
          setSelectedCategory(doc.categoryId);
        } else {
          toast.error("Document not found");
          router.push("/dashboard");
        }
        setLoading(false);
      }
      fetchDoc();
    }
  }, [id, isNew, router]);

  function insertMarkdown(prefix: string, suffix: string = "", placeholder: string = "") {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || placeholder;
    
    const before = content.substring(0, start);
    const after = content.substring(end);
    
    setContent(before + prefix + selectedText + suffix + after);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  function insertAtLineStart(prefix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const start = textarea.selectionStart;
    const before = content.substring(0, start);
    const after = content.substring(start);
    
    const lastNewline = before.lastIndexOf("\n");
    const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
    
    const newContent = before.substring(0, lineStart) + prefix + before.substring(lineStart) + after;
    setContent(newContent);
    
    setTimeout(() => {
      const newPos = lineStart + prefix.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }

  function insertBlock(prefix: string, suffix: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const before = content.substring(0, start);
    const after = content.substring(end);
    
    setContent(before + prefix + selectedText + suffix + after);
    
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length);
      }
    }, 0);
  }

  async function handleCreateCategory() {
    if (!newCategory.trim()) return;
    
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });

    if (res.ok) {
      const cat = await res.json();
      if (!categories.find((c) => c.id === cat.id)) {
        setCategories([...categories, cat]);
      }
      setSelectedCategory(cat.id);
      setNewCategory("");
      setCategoryModalOpen(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? "/api/documents" : `/api/documents/${id}`;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          isPublic,
          categoryId: selectedCategory,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const doc = await res.json();
      toast.success(isNew ? "Document created!" : "Document saved!");
      
      if (isNew) {
        router.push(`/docs/${doc.id}`);
      }
    } catch {
      toast.error("Failed to save document");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const res = await fetch(`/api/documents/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      toast.success("Document deleted");
      router.push("/dashboard");
    } else {
      toast.error("Failed to delete document");
    }
    setDeleteModalOpen(false);
  }

  async function callAI(action: string, extra?: { text?: string; code?: string; topic?: string }) {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI request failed");
      }

      const data = await res.json();
      return data.result;
    } catch (error: any) {
      toast.error(error.message);
      return null;
    } finally {
      setAiLoading(false);
    }
  }

  async function handleGenerateSubmit() {
    if (!generateTopic.trim()) return;
    
    const result = await callAI("generate", { topic: generateTopic });
    if (result) {
      setContent(result);
      toast.success("Documentation generated!");
    }
    setGenerateModalOpen(false);
    setGenerateTopic("");
  }

  async function handleImprove() {
    const selectedText = window.getSelection()?.toString();
    if (!selectedText) {
      toast.error("Select some text to improve");
      return;
    }

    const result = await callAI("improve", { text: selectedText });
    if (result) {
      setContent(content.replace(selectedText, result));
      toast.success("Text improved!");
    }
  }

  async function handleSummarize() {
    if (!content) {
      toast.error("No content to summarize");
      return;
    }

    const result = await callAI("summarize", { text: content });
    if (result) {
      setContent(result);
      toast.success("Content summarized!");
    }
  }

  async function handleExplainSubmit() {
    if (!explainCode.trim()) return;
    
    const result = await callAI("explain", { code: explainCode });
    if (result) {
      setContent(content + "\n\n**Explanation:**\n" + result);
      toast.success("Code explained!");
    }
    setExplainModalOpen(false);
    setExplainCode("");
  }

  function handleInsertImage() {
    if (imageUrl) {
      insertMarkdown("![Alt text](", ")", imageUrl);
      setImageUrl("");
      setImageModalOpen(false);
    }
  }

  function handleInsertLink() {
    if (linkText && linkUrl) {
      insertMarkdown("[", `](${linkUrl})`, linkText);
      setLinkText("");
      setLinkUrl("");
      setLinkModalOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)]">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="text-xl font-semibold bg-transparent border-none focus:outline-none flex-1"
        />
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(!viewMode)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)]"
          >
            {viewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {viewMode ? "Edit" : "Preview"}
          </button>
          
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm border border-[var(--border)] rounded-md ${
              isPublic ? "bg-green-50 text-green-700" : "hover:bg-[var(--sidebar)]"
            }`}
          >
            {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isPublic ? "Public" : "Private"}
          </button>

          {!isNew && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-1.5 text-sm bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between px-6 py-2 border-b border-[var(--border)] bg-[var(--sidebar)]">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => insertAtLineStart("# ")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Heading 1"
          >
            <Heading1 className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertAtLineStart("## ")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Heading 2"
          >
            <Heading2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertAtLineStart("### ")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Heading 3"
          >
            <Heading3 className="w-3 h-3" />
          </button>
          
          <div className="w-px h-4 bg-[var(--border)] mx-1" />
          
          <button
            onClick={() => insertMarkdown("**", "**", "bold text")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Bold"
          >
            <Bold className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertMarkdown("*", "*", "italic text")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Italic"
          >
            <Italic className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertMarkdown("~~", "~~", "strikethrough")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Strikethrough"
          >
            <Strikethrough className="w-3 h-3" />
          </button>
          
          <div className="w-px h-4 bg-[var(--border)] mx-1" />
          
          <button
            onClick={() => insertAtLineStart("- ")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Bullet List"
          >
            <List className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertAtLineStart("1. ")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Numbered List"
          >
            <ListOrdered className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertAtLineStart("> ")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Quote"
          >
            <Quote className="w-3 h-3" />
          </button>
          
          <div className="w-px h-4 bg-[var(--border)] mx-1" />
          
          <button
            onClick={() => insertMarkdown("`", "`", "code")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Inline Code"
          >
            <Code className="w-3 h-3" />
          </button>
          <button
            onClick={() => insertMarkdown("```\n", "\n```", "code block")}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Code Block"
          >
            <Code2 className="w-3 h-3" />
          </button>
          
          <div className="w-px h-4 bg-[var(--border)] mx-1" />
          
          <button
            onClick={() => setLinkModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Insert Link"
          >
            <LinkIcon className="w-3 h-3" />
          </button>
          <button
            onClick={() => setImageModalOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)]"
            title="Insert Image"
          >
            <ImageIcon className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setGenerateModalOpen(true)}
            disabled={aiLoading}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded hover:bg-[var(--border)] disabled:opacity-50"
            title="Generate documentation"
          >
            <Sparkles className="w-3 h-3" />
            AI
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-6 py-2 border-b border-[var(--border)]">
        <span className="text-sm text-[var(--muted)]">Category:</span>
        <select
          value={selectedCategory || ""}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
          className="px-2 py-1 text-sm border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setCategoryModalOpen(true)}
          className="px-2 py-1 text-xs text-[var(--accent)] hover:underline"
        >
          + New Category
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode ? (
          <div className="h-full overflow-y-auto p-8 prose max-w-4xl mx-auto">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your documentation in markdown..."
            className="w-full h-full p-8 resize-none focus:outline-none font-mono text-sm"
          />
        )}
      </div>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Document">
        <p className="text-sm text-[var(--muted)] mb-4">
          Are you sure you want to delete this document? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setDeleteModalOpen(false)}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)]"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </Modal>

      <Modal isOpen={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} title="New Category">
        <p className="text-sm text-[var(--muted)] mb-4">
          Create a new category for your documents.
        </p>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="Category name"
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setCategoryModalOpen(false)}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)]"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateCategory}
            disabled={!newCategory.trim()}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </Modal>

      <Modal isOpen={generateModalOpen} onClose={() => setGenerateModalOpen(false)} title="Generate Documentation">
        <p className="text-sm text-[var(--muted)] mb-4">
          Enter a topic and AI will generate documentation for you.
        </p>
        <input
          type="text"
          value={generateTopic}
          onChange={(e) => setGenerateTopic(e.target.value)}
          placeholder="Enter topic (e.g., React hooks tutorial)"
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setGenerateModalOpen(false)}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)]"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateSubmit}
            disabled={aiLoading || !generateTopic.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {aiLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Generate
          </button>
        </div>
      </Modal>

      <Modal isOpen={explainModalOpen} onClose={() => setExplainModalOpen(false)} title="Explain Code">
        <p className="text-sm text-[var(--muted)] mb-4">
          Enter the code you want AI to explain.
        </p>
        <textarea
          value={explainCode}
          onChange={(e) => setExplainCode(e.target.value)}
          placeholder="Enter code..."
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mb-4 font-mono text-sm h-32"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setExplainModalOpen(false)}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)]"
          >
            Cancel
          </button>
          <button
            onClick={handleExplainSubmit}
            disabled={aiLoading || !explainCode.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {aiLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Explain
          </button>
        </div>
      </Modal>

      <Modal isOpen={imageModalOpen} onClose={() => setImageModalOpen(false)} title="Insert Image">
        <p className="text-sm text-[var(--muted)] mb-4">
          Enter the image URL.
        </p>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)] mb-4"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setImageModalOpen(false)}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)]"
          >
            Cancel
          </button>
          <button
            onClick={handleInsertImage}
            disabled={!imageUrl.trim()}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            Insert
          </button>
        </div>
      </Modal>

      <Modal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Insert Link">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Link Text</label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Click here"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={() => setLinkModalOpen(false)}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded-md hover:bg-[var(--sidebar)]"
          >
            Cancel
          </button>
          <button
            onClick={handleInsertLink}
            disabled={!linkText.trim() || !linkUrl.trim()}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
          >
            Insert
          </button>
        </div>
      </Modal>
    </div>
  );
}
