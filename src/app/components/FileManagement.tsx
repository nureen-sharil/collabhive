import { useState, useMemo, useRef } from "react";
import { useNavigate, useParams } from "../router";
import {
  ArrowLeft, Search, Plus, FileText, FileSpreadsheet,
  ImageIcon, MoreVertical, X, Pencil, Trash2, Upload,
  Check, Download, Share2, Clock, HardDrive, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "../motion-compat";
import { PhoneFrame } from "./PhoneFrame";

// ─── types ────────────────────────────────────────────────────────────────────
interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "document" | "spreadsheet" | "presentation" | "image";
  size: string;
  lastModified: string;
  owner?: string;
}

// ─── constants ────────────────────────────────────────────────────────────────
const FILE_STYLES: Record<string, { bg: string; color: string; label: string; Icon: any }> = {
  pdf:          { bg: "#FEE2E2", color: "#B91C1C", label: "PDF Document",      Icon: FileText        },
  document:     { bg: "#DBEAFE", color: "#1D4ED8", label: "Word Document",      Icon: FileText        },
  spreadsheet:  { bg: "#DCFCE7", color: "#15803D", label: "Spreadsheet",        Icon: FileSpreadsheet },
  presentation: { bg: "#FEF3C7", color: "#B45309", label: "Presentation",       Icon: FileText        },
  image:        { bg: "#F3E8FF", color: "#7C3AED", label: "Image",              Icon: ImageIcon       },
};

const INITIAL_FILES: FileItem[] = [
  { id: "1", name: "Project Requirements.pdf",  type: "pdf",          size: "2.4 MB",  lastModified: "2 hours ago",  owner: "John Doe"    },
  { id: "2", name: "Meeting Notes.docx",         type: "document",     size: "156 KB",  lastModified: "1 day ago",    owner: "Sara Miller" },
  { id: "3", name: "Budget Analysis.xlsx",       type: "spreadsheet",  size: "512 KB",  lastModified: "3 days ago",   owner: "Alex Brown"  },
  { id: "4", name: "Design Presentation.pptx",  type: "presentation", size: "8.1 MB",  lastModified: "1 week ago",   owner: "John Doe"    },
  { id: "5", name: "Wireframe_v2.png",           type: "image",        size: "1.2 MB",  lastModified: "2 days ago",   owner: "Sara Miller" },
];

function guessType(name: string): FileItem["type"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf")                                              return "pdf";
  if (["doc","docx","txt"].includes(ext))                        return "document";
  if (["xls","xlsx","csv"].includes(ext))                        return "spreadsheet";
  if (["ppt","pptx"].includes(ext))                              return "presentation";
  if (["png","jpg","jpeg","gif","webp","svg"].includes(ext))     return "image";
  return "document";
}

// ─── File Detail View ─────────────────────────────────────────────────────────
function FileDetailView({
  file,
  onClose,
  onDelete,
  onRename,
}: {
  file: FileItem;
  onClose: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const { bg, color, label, Icon } = FILE_STYLES[file.type] ?? FILE_STYLES.document;
  const [toast, setToast] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName,  setNewName]  = useState(file.name);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const actions = [
    { icon: Download, label: "Download", color: "#2563EB", bg: "#EFF6FF", onTap: () => showToast("Download started…") },
    { icon: Share2,   label: "Share",    color: "#7C3AED", bg: "#F5F3FF", onTap: () => showToast("Link copied to clipboard!") },
    { icon: Pencil,   label: "Rename",   color: "#D97706", bg: "#FFFBEB", onTap: () => setRenaming(true) },
    { icon: Trash2,   label: "Delete",   color: "#DC2626", bg: "#FEF2F2", onTap: () => { onDelete(file.id); onClose(); } },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: "absolute", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", borderRadius: 52, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "white", borderRadius: "28px 28px 0 0", overflow: "hidden" }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#E5E7EB" }} />
        </div>

        {/* Close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px 0" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>File Details</span>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="#6B7280" />
          </button>
        </div>

        {/* Hero icon */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 20px 16px" }}>
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.08, type: "spring", damping: 18 }}
            style={{ width: 80, height: 80, borderRadius: 22, background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, boxShadow: `0 8px 24px ${color}33` }}
          >
            <Icon size={40} color={color} strokeWidth={1.4} />
          </motion.div>

          {/* Name / rename */}
          {renaming ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center", width: "100%", maxWidth: 260, marginBottom: 4 }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") { onRename(file.id, newName); setRenaming(false); showToast("File renamed."); }
                }}
                style={{ flex: 1, fontSize: 15, fontWeight: 600, textAlign: "center", border: "1.5px solid #2563EB", borderRadius: 8, padding: "6px 10px", outline: "none", color: "#111827" }}
              />
              <button
                onClick={() => { onRename(file.id, newName); setRenaming(false); showToast("File renamed."); }}
                style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563EB", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <Check size={14} color="white" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: 4, maxWidth: 240 }}>{file.name}</p>
          )}
          <span style={{ fontSize: 12, fontWeight: 500, color, background: bg, borderRadius: 20, padding: "3px 12px" }}>{label}</span>
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", justifyContent: "space-around", padding: "10px 16px 16px", borderTop: "1px solid #F9FAFB", borderBottom: "1px solid #F9FAFB", background: "#FAFAFA" }}>
          {[
            { icon: HardDrive, label: "Size",     value: file.size          },
            { icon: Clock,     label: "Modified", value: file.lastModified  },
            { icon: ChevronRight, label: "Owner", value: file.owner ?? "You" },
          ].map(({ icon: Ic, label: lb, value }) => (
            <div key={lb} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Ic size={16} color="#9CA3AF" />
              <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 500 }}>{lb}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, padding: "16px 16px 28px" }}>
          {actions.map(({ icon: Ic, label: lb, color: c, bg: b, onTap }) => (
            <button
              key={lb}
              onClick={onTap}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 4px", borderRadius: 14, background: b, border: "none", cursor: "pointer" }}
            >
              <Ic size={20} color={c} strokeWidth={1.8} />
              <span style={{ fontSize: 11, fontWeight: 600, color: c }}>{lb}</span>
            </button>
          ))}
        </div>

        {/* In-detail toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              style={{ position: "absolute", bottom: 100, left: 16, right: 16, background: "#111827", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, zIndex: 10 }}
            >
              <Check size={14} color="#22C55E" strokeWidth={2.5} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "white" }}>{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function FileManagement() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [files,       setFiles]       = useState<FileItem[]>(INITIAL_FILES);
  const [query,       setQuery]       = useState("");
  const [cardMenuId,  setCardMenuId]  = useState<string | null>(null);
  const [editId,      setEditId]      = useState<string | null>(null);
  const [editName,    setEditName]    = useState("");
  const [toast,       setToast]       = useState<string | null>(null);

  // File detail view
  const [detailFile,  setDetailFile]  = useState<FileItem | null>(null);

  // Header three-dot → select mode
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [selectMode,     setSelectMode]     = useState(false);
  const [selected,       setSelected]       = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;
  }, [files, query]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const handleDelete = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setCardMenuId(null);
    showToast("File deleted.");
  };

  const handleDeleteSelected = () => {
    setFiles((prev) => prev.filter((f) => !selected.has(f.id)));
    setSelected(new Set());
    setSelectMode(false);
    showToast(`${selected.size} file${selected.size > 1 ? "s" : ""} deleted.`);
  };

  const startEdit = (file: FileItem) => { setEditId(file.id); setEditName(file.name); setCardMenuId(null); };

  const confirmEdit = (id?: string, name?: string) => {
    const targetId   = id   ?? editId;
    const targetName = name ?? editName;
    if (!targetName?.trim()) return;
    setFiles((prev) => prev.map((f) => f.id === targetId ? { ...f, name: targetName.trim() } : f));
    setEditId(null);
    showToast("File renamed.");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked) return;
    Array.from(picked).forEach((file) => {
      setFiles((prev) => [{
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: guessType(file.name),
        size: file.size > 1_000_000 ? `${(file.size / 1_000_000).toFixed(1)} MB` : `${Math.round(file.size / 1000)} KB`,
        lastModified: "Just now",
        owner: "You",
      }, ...prev]);
    });
    e.target.value = "";
    showToast("File uploaded successfully.");
  };

  const toggleSelect = (fileId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(fileId) ? next.delete(fileId) : next.add(fileId);
      return next;
    });
  };

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      {/* Header */}
      <div className="bg-white flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}>
        {selectMode ? (
          <>
            <button onClick={exitSelectMode} style={{ fontSize: 14, fontWeight: 500, color: "#2563EB", background: "none", border: "none", cursor: "pointer" }}>Cancel</button>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
              {selected.size > 0 ? `${selected.size} Selected` : "Select Files"}
            </span>
            <button
              onClick={() => { setSelected(new Set(filtered.map((f) => f.id))); }}
              style={{ fontSize: 13, fontWeight: 600, color: "#2563EB", background: "none", border: "none", cursor: "pointer" }}
            >
              All
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/workspace/${id}`)} className="p-1">
                <ArrowLeft size={22} strokeWidth={2} color="#374151" />
              </button>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Files</span>
            </div>

            {/* Header three-dot with dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: headerMenuOpen ? "#F3F4F6" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                className="hover:bg-gray-100"
              >
                <MoreVertical size={20} strokeWidth={2} color="#374151" />
              </button>

              <AnimatePresence>
                {headerMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.12 }}
                    style={{ position: "absolute", top: 42, right: 0, zIndex: 30, background: "white", borderRadius: 14, boxShadow: "0 4px 24px rgba(0,0,0,0.14)", overflow: "hidden", minWidth: 160 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setSelectMode(true); setHeaderMenuOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "none", background: "white", cursor: "pointer", fontSize: 14, color: "#111827", borderBottom: "1px solid #F3F4F6" }}
                    >
                      <Check size={15} color="#374151" strokeWidth={2} /> Select Files
                    </button>
                    <button
                      onClick={() => { fileRef.current?.click(); setHeaderMenuOpen(false); }}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "none", background: "white", cursor: "pointer", fontSize: 14, color: "#111827" }}
                    >
                      <Upload size={15} color="#374151" strokeWidth={2} /> Upload File
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
        <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={handleUpload} />
      </div>

      {/* Search */}
      <div className="bg-white flex-shrink-0 px-4 py-3" style={{ borderBottom: "1px solid #F3F4F6" }}>
        <div className="flex items-center gap-2 px-3 rounded-xl"
          style={{ background: "#F3F4F6", border: query ? "1.5px solid #2563EB" : "1.5px solid transparent", height: 40 }}>
          <Search size={15} color={query ? "#2563EB" : "#9CA3AF"} strokeWidth={2} />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files..."
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 14, color: "#111827" }} />
          {query && <button onClick={() => setQuery("")}><X size={14} color="#9CA3AF" /></button>}
        </div>
      </div>

      {/* Grid */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ background: "#F5F5F5" }}
        onClick={() => { setCardMenuId(null); setHeaderMenuOpen(false); }}
      >
        <div className="flex items-center justify-between mb-3">
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            {query ? `Results for "${query}"` : "All Files"}
          </span>
          <span style={{ fontSize: 12, color: "#9CA3AF" }}>{filtered.length} items</span>
        </div>

        {query && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "white", borderRadius: 16 }}>
            <Search size={32} color="#D1D5DB" style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>No files found</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Try a different keyword</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Upload card */}
          {!query && !selectMode && (
            <div
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
              style={{ background: "white", borderRadius: 16, border: "2px dashed #93C5FD", aspectRatio: "1/1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}
              className="hover:bg-blue-50 transition-colors"
            >
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#DBEAFE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={22} color="#2563EB" strokeWidth={2.5} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#4B5563" }}>Upload File</span>
            </div>
          )}

          {/* File cards */}
          {filtered.map((file) => {
            const { bg, color, Icon } = FILE_STYLES[file.type] ?? FILE_STYLES.document;
            const isEditing  = editId === file.id;
            const isMenuOpen = cardMenuId === file.id;
            const isSelected = selected.has(file.id);

            return (
              <motion.div
                key={file.id}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectMode) { toggleSelect(file.id); return; }
                  if (isEditing || isMenuOpen) return;
                  setDetailFile(file);
                }}
                style={{
                  background: "white", borderRadius: 16, aspectRatio: "1/1",
                  padding: 12, boxShadow: isSelected ? `0 0 0 2.5px #2563EB` : "0 1px 4px rgba(0,0,0,0.08)",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  position: "relative", overflow: "hidden", cursor: "pointer",
                  transition: "box-shadow 0.15s",
                }}
              >
                {/* Checkbox in select mode */}
                {selectMode && (
                  <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: isSelected ? "#2563EB" : "white",
                      border: `2px solid ${isSelected ? "#2563EB" : "#D1D5DB"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                    }}>
                      {isSelected && <Check size={13} color="white" strokeWidth={3} />}
                    </div>
                  </div>
                )}

                {/* Three-dot card menu (hidden in select mode) */}
                {!selectMode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCardMenuId(isMenuOpen ? null : file.id); setEditId(null); }}
                    style={{ position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: "50%", background: isMenuOpen ? "#F3F4F6" : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <MoreVertical size={14} color="#6B7280" />
                  </button>
                )}

                {/* Card dropdown */}
                <AnimatePresence>
                  {isMenuOpen && !selectMode && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -4 }}
                      transition={{ duration: 0.12 }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: "absolute", top: 34, right: 8, zIndex: 20, background: "white", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.14)", overflow: "hidden", minWidth: 120 }}
                    >
                      <button onClick={() => startEdit(file)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: "none", background: "white", cursor: "pointer", fontSize: 13, color: "#111827", borderBottom: "1px solid #F3F4F6" }}>
                        <Pencil size={13} color="#374151" /> Rename
                      </button>
                      <button onClick={() => handleDelete(file.id)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", border: "none", background: "white", cursor: "pointer", fontSize: 13, color: "#EF4444" }}>
                        <Trash2 size={13} color="#EF4444" /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={26} color={color} strokeWidth={1.5} />
                  </div>
                </div>

                {/* Name / rename */}
                <div>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                      <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && confirmEdit()}
                        style={{ flex: 1, fontSize: 12, border: "1.5px solid #2563EB", borderRadius: 6, padding: "3px 6px", outline: "none" }} />
                      <button onClick={() => confirmEdit()}
                        style={{ width: 24, height: 24, borderRadius: "50%", background: "#2563EB", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={12} color="white" strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#111827", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: 2 }}>
                      {file.name}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 11, color: "#6B7280" }}>{file.size}</span>
                    <span style={{ fontSize: 10, color: "#9CA3AF" }}>{file.lastModified}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Select mode bottom action bar */}
      <AnimatePresence>
        {selectMode && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="bg-white flex-shrink-0 px-4 py-3"
            style={{ borderTop: "1px solid #F3F4F6", display: "flex", gap: 12 }}
          >
            <button
              onClick={() => showToast(`${selected.size} file${selected.size !== 1 ? "s" : ""} saved.`)}
              disabled={selected.size === 0}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 14, border: "none", cursor: selected.size > 0 ? "pointer" : "default",
                background: selected.size > 0 ? "#2563EB" : "#E5E7EB",
                color: selected.size > 0 ? "white" : "#9CA3AF",
                fontSize: 14, fontWeight: 700, transition: "background 0.2s",
              }}
            >
              Save{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selected.size === 0}
              style={{
                flex: 1, padding: "13px 0", borderRadius: 14, border: "none", cursor: selected.size > 0 ? "pointer" : "default",
                background: selected.size > 0 ? "#FEF2F2" : "#F3F4F6",
                color: selected.size > 0 ? "#DC2626" : "#9CA3AF",
                fontSize: 14, fontWeight: 700, transition: "background 0.2s",
              }}
            >
              Delete{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", damping: 22, stiffness: 300 }}
            style={{ position: "absolute", bottom: 52, left: 16, right: 16, background: "#111827", borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, zIndex: 60, boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}
          >
            <Check size={16} color="#22C55E" strokeWidth={2.5} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File detail overlay */}
      <AnimatePresence>
        {detailFile && (
          <FileDetailView
            file={detailFile}
            onClose={() => setDetailFile(null)}
            onDelete={(fid) => { handleDelete(fid); setDetailFile(null); }}
            onRename={(fid, name) => confirmEdit(fid, name)}
          />
        )}
      </AnimatePresence>
    </PhoneFrame>
  );
}
