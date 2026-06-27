import { useState, useMemo, useRef, useEffect, type MouseEvent } from "react";
import { useNavigate } from "../router";
import {
  Menu, Bell, Search, Plus, X, Edit3, Trash2,
  MoreVertical, CaseSensitive, Check,
  Settings, UserCircle, LogOut, ChevronRight,
  Home, LayoutGrid, SlidersHorizontal, HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "../motion-compat";
import { NotificationOverlay } from "./NotificationOverlay";
import { PhoneFrame } from "./PhoneFrame";
import { GlobalToast } from "./GlobalToast";
import { useWorkspaces } from "../context/WorkspaceContext";

// ─── Left Sidebar ─────────────────────────────────────────────────────────────
function Sidebar({ onClose, user }: { onClose: () => void, user: { name: string, email: string } }) {
  const navigate = useNavigate();

  const goTo = (path: string) => { onClose(); navigate(path); };

  // Compute initials for the avatar based on the user's name
  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = String(name).trim().split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (String(name)[0] || "U").toUpperCase();
  };

  const navItems = [
    { icon: Home,       label: "Dashboard",  active: true,  path: "/"    },
    { icon: LayoutGrid, label: "Workspaces", active: false, path: "/"    },
    { icon: HelpCircle, label: "Help & FAQ", active: false, path: "/faq" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "absolute", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)",
        borderRadius: 52, overflow: "hidden",
      }}
    >
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        exit={{ x: -280 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        style={{
          position: "absolute", top: 0, left: 0, bottom: 0,
          width: 260, background: "white", display: "flex", flexDirection: "column",
          borderRadius: "52px 0 0 52px",
        }}
      >
        {/* Profile section */}
        <div style={{ padding: "48px 20px 20px", background: "linear-gradient(135deg,#1E3A5F,#2563EB)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "white" }}>
              {/* Display dynamically computed initials */}
              {getInitials(user.name)}
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} color="white" />
            </button>
          </div>
          {/* Display actual logged-in user name and email */}
          <p style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 2 }}>{user.name}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{user.email}</p>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", padding: "8px 8px 6px", letterSpacing: 0.6 }}>MENU</p>
          {navItems.map(({ icon: Icon, label, active, path }) => (
            <button
              key={label}
              onClick={() => goTo(path)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 12px", borderRadius: 12, border: "none", cursor: "pointer",
                background: active ? "#EFF6FF" : "transparent",
                marginBottom: 2,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Icon size={18} color={active ? "#2563EB" : "#6B7280"} strokeWidth={2} />
                <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: active ? "#2563EB" : "#374151" }}>
                  {label}
                </span>
              </div>
              {active && <ChevronRight size={15} color="#2563EB" />}
            </button>
          ))}

          <div style={{ height: 1, background: "#F3F4F6", margin: "12px 8px" }} />

          <p style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", padding: "4px 8px 6px", letterSpacing: 0.6 }}>ACCOUNT</p>

          <button
            onClick={() => goTo("/edit-profile")}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 12px",borderRadius:12,border:"none",cursor:"pointer",background:"transparent",marginBottom:2 }}
          >
            <UserCircle size={18} color="#6B7280" strokeWidth={2} />
            <span style={{ fontSize:14,fontWeight:500,color:"#374151" }}>Edit Profile</span>
          </button>

          <button
            onClick={() => goTo("/settings")}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 12px",borderRadius:12,border:"none",cursor:"pointer",background:"transparent",marginBottom:2 }}
          >
            <Settings size={18} color="#6B7280" strokeWidth={2} />
            <span style={{ fontSize:14,fontWeight:500,color:"#374151" }}>Settings</span>
          </button>
        </div>

        {/* Sign out */}
        <div style={{ padding: "12px 12px 32px", borderTop: "1px solid #F3F4F6" }}>
          <button
            onClick={() => { 
              // Clear current user on sign out
              localStorage.removeItem("currentUser");
              localStorage.removeItem("collabhive.auth.currentUser");
              window.dispatchEvent(new Event("collabhive-auth-change"));
              onClose(); 
              goTo("/login"); 
            }}
            style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 12px",borderRadius:12,border:"none",cursor:"pointer",background:"#FEF2F2" }}
          >
            <LogOut size={18} color="#EF4444" strokeWidth={2} />
            <span style={{ fontSize:14,fontWeight:600,color:"#EF4444" }}>Sign Out</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Card three-dot menu ──────────────────────────────────────────────────────
function CardMenu({
  wsId, onEdit, onRename, onDelete, onClose,
}: {
  wsId: string; onEdit: () => void; onRename: () => void;
  onDelete: () => void; onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: -4 }}
      transition={{ duration: 0.12 }}
      onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      style={{
        position: "absolute", top: 30, right: 6, zIndex: 20,
        background: "white", borderRadius: 12,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        overflow: "hidden", minWidth: 140,
      }}
    >
      <button
        onClick={() => { onEdit(); onClose(); }}
        style={{ width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",border:"none",background:"white",cursor:"pointer",fontSize:13,color:"#111827",borderBottom:"1px solid #F3F4F6" }}
      >
        <Edit3 size={13} color="#374151" /> Edit
      </button>
      <button
        onClick={() => { onRename(); onClose(); }}
        style={{ width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",border:"none",background:"white",cursor:"pointer",fontSize:13,color:"#111827",borderBottom:"1px solid #F3F4F6" }}
      >
        <CaseSensitive size={14} color="#374151" /> Rename
      </button>
      <button
        onClick={() => { onDelete(); onClose(); }}
        style={{ width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 14px",border:"none",background:"#FEF2F2",cursor:"pointer",fontSize:13,color:"#DC2626" }}
      >
        <Trash2 size={13} color="#DC2626" /> Delete
      </button>
    </motion.div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{
        position: "absolute", inset: 0, zIndex: 60,
        background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)",
        borderRadius: 52, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 24px",
      }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 340 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 20, width: "100%",
          overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Icon */}
        <div style={{ padding: "28px 24px 16px", textAlign: "center" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#FEE2E2", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 16px",
          }}>
            <Trash2 size={24} color="#DC2626" />
          </div>
          <p style={{ fontSize: 17, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Delete Workspace?
          </p>
          <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600, color: "#374151" }}>"{title}"</span>
            {" "}will be permanently deleted along with all its tasks, files, and meetings. This cannot be undone.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#F3F4F6" }} />

        {/* Actions */}
        <div style={{ display: "flex" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "16px 0", border: "none", borderRight: "1px solid #F3F4F6",
              background: "white", cursor: "pointer",
              fontSize: 15, fontWeight: 600, color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "16px 0", border: "none",
              background: "white", cursor: "pointer",
              fontSize: 15, fontWeight: 700, color: "#DC2626",
            }}
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const navigate = useNavigate();
  const { workspaces, removeWorkspace } = useWorkspaces();

  // State to hold the current user details, default to placeholder if nothing in localStorage
  const [currentUser, setCurrentUser] = useState({ name: "User", email: "" });

  useEffect(() => {
    // Retrieve the authenticated user from localStorage when component mounts
    try {
      const userStr = localStorage.getItem("currentUser");
      if (userStr) {
        const parsed = JSON.parse(userStr);
        if (parsed && typeof parsed === "object") {
          setCurrentUser({
            name: parsed.name || "User",
            email: parsed.email || ""
          });
        }
      }
    } catch (error) {
      console.error("Failed to parse user details:", error);
    }
  }, []);

  const [showNotification, setShowNotification] = useState(false);
  const [showSidebar,      setShowSidebar]      = useState(false);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [openMenu,         setOpenMenu]         = useState<string | null>(null);
  const [showFilter,       setShowFilter]       = useState(false);
  const [activeFilter,     setActiveFilter]     = useState<"All" | "In Progress" | "Completed" | "Not Started">("All");

  const FILTER_OPTIONS = ["All", "In Progress", "Completed", "Not Started"] as const;

  // Rename state
  const [renamingId,  setRenamingId]  = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamedMap,  setRenamedMap]  = useState<Record<string, string>>({});

  // Delete confirmation state: holds the id of the workspace pending deletion
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = workspaces;
    if (activeFilter !== "All") result = result.filter((ws) => ws.status === activeFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) result = result.filter((ws) => ws.title.toLowerCase().includes(q));
    return result;
  }, [workspaces, searchQuery, activeFilter]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "In Progress": return { bg: "#DBEAFE", text: "#1D4ED8" };
      case "Completed":   return { bg: "#DCFCE7", text: "#15803D" };
      default:            return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  const confirmRename = () => {
    if (renamingId && renameValue.trim()) {
      setRenamedMap((prev) => ({ ...prev, [renamingId]: renameValue.trim() }));
    }
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      {/* App Header */}
      <div
        className="bg-white flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}
      >
        {/* Hamburger */}
        <button className="p-1" onClick={() => setShowSidebar(true)}>
          <Menu size={22} strokeWidth={2} color="#374151" />
        </button>

        <span style={{ fontSize: 17, fontWeight: 600, color: "#111827" }}>Dashboard</span>

        {/* Only bell — three-dot removed */}
        <button className="relative p-1" onClick={() => setShowNotification(true)}>
          <Bell size={20} strokeWidth={2} color="#374151" />
          <span style={{ position:"absolute",top:2,right:2,width:8,height:8,borderRadius:"50%",background:"#EF4444",border:"1.5px solid white" }} />
        </button>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto px-5 pt-5 pb-4"
        style={{ background: "#F5F5F5" }}
        onClick={() => setOpenMenu(null)}
      >
        {/* Greeting */}
        <h2 style={{ fontSize:22,fontWeight:700,color:"#1E3A5F",lineHeight:1.2,marginBottom:20 }}>
          {/* Display actual logged-in user name */}
          Good Evening, {currentUser.name}
        </h2>

        {/* Search bar */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="flex-1 flex items-center gap-2 px-3 bg-white rounded-xl"
            style={{ border:searchQuery?"1.5px solid #2563EB":"1px solid #E5E7EB", boxShadow:"0 1px 3px rgba(0,0,0,0.06)", height:46 }}
          >
            <Search size={17} color={searchQuery?"#2563EB":"#9CA3AF"} strokeWidth={2} />
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspace..."
              style={{ flex:1,border:"none",outline:"none",fontSize:14,color:"#111827",background:"transparent" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}><X size={15} color="#9CA3AF" /></button>
            )}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center justify-center rounded-xl"
            style={{
              width: 46, height: 46, flexShrink: 0, border: "none", cursor: "pointer",
              background: activeFilter !== "All" ? "#2563EB" : showFilter ? "#EFF6FF" : "white",
              boxShadow: activeFilter !== "All"
                ? "0 2px 8px rgba(37,99,235,0.35)"
                : "0 1px 3px rgba(0,0,0,0.08)",
              outline: showFilter && activeFilter === "All" ? "1.5px solid #2563EB" : "none",
            }}
          >
            <SlidersHorizontal
              size={18}
              color={activeFilter !== "All" ? "white" : showFilter ? "#2563EB" : "#6B7280"}
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Filter dropdown */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              style={{ background: "white", borderRadius: 16, padding: "12px 12px", marginBottom: 14, boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Filter by Status</span>
                {activeFilter !== "All" && (
                  <button
                    onClick={() => setActiveFilter("All")}
                    style={{ fontSize: 11, color: "#2563EB", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {FILTER_OPTIONS.map((opt) => {
                  const isActive = activeFilter === opt;
                  const chipColor =
                    opt === "In Progress" ? { bg: "#DBEAFE", text: "#1D4ED8", activeBg: "#2563EB" } :
                    opt === "Completed"   ? { bg: "#DCFCE7", text: "#15803D", activeBg: "#16A34A" } :
                    opt === "Not Started" ? { bg: "#F3F4F6", text: "#6B7280", activeBg: "#4B5563" } :
                                           { bg: "#F3F4F6", text: "#374151", activeBg: "#111827" };
                  return (
                    <button
                      key={opt}
                      onClick={() => { setActiveFilter(opt); setShowFilter(false); }}
                      style={{
                        padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                        fontSize: 12, fontWeight: 600,
                        background: isActive ? chipColor.activeBg : chipColor.bg,
                        color: isActive ? "white" : chipColor.text,
                        transition: "background 0.15s",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty search state */}
        {searchQuery && filtered.length === 0 && (
          <div style={{ textAlign:"center",padding:"40px 20px",background:"white",borderRadius:16 }}>
            <Search size={32} color="#D1D5DB" style={{ margin:"0 auto 10px" }} />
            <p style={{ fontSize:14,fontWeight:600,color:"#374151" }}>No workspaces found</p>
            <p style={{ fontSize:13,color:"#9CA3AF",marginTop:4 }}>Try a different keyword</p>
          </div>
        )}

        {/* Grid */}
        {(!searchQuery || filtered.length > 0) && (
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>

            {/* Add Workspace card */}
            {!searchQuery && activeFilter === "All" && (
              <motion.div
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate("/workspace/new")}
                style={{ background:"white",borderRadius:16,border:"2px dashed #93C5FD",aspectRatio:"1/1",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:8,cursor:"pointer" }}
                className="hover:bg-blue-50 transition-colors"
              >
                <div style={{ width:44,height:44,borderRadius:"50%",background:"#DBEAFE",display:"flex",alignItems:"center",justifyContent:"center" }}>
                  <Plus size={22} color="#2563EB" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize:13,fontWeight:600,color:"#4B5563" }}>Add Workspace</span>
              </motion.div>
            )}

            {/* Workspace cards */}
            {filtered.map((ws) => {
              const ss        = getStatusStyle(ws.status);
              const isMenuOpen = openMenu === ws.id;
              const isRenaming = renamingId === ws.id;
              const displayTitle = renamedMap[ws.id] ?? ws.title;

              return (
                <motion.div
                  key={ws.id}
                  whileTap={{ scale: isMenuOpen || isRenaming ? 1 : 0.97 }}
                  onClick={() => { if (!isMenuOpen && !isRenaming) navigate(`/workspace/${ws.id}`); }}
                  style={{
                    background: "white", borderRadius: 16, aspectRatio: "1/1",
                    padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                    cursor: "pointer", borderTop: `3px solid ${ws.color}`,
                    position: "relative",
                  }}
                >
                  {/* Three-dot button */}
                  <button
                    onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setOpenMenu(isMenuOpen ? null : ws.id); }}
                    style={{
                      position: "absolute", top: 8, right: 8,
                      width: 24, height: 24, borderRadius: "50%",
                      background: isMenuOpen ? "#F3F4F6" : "transparent",
                      border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <MoreVertical size={14} color="#6B7280" />
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {isMenuOpen && (
                      <CardMenu
                        wsId={ws.id}
                        onEdit={() => navigate(`/workspace/${ws.id}`)}
                        onRename={() => { setRenamingId(ws.id); setRenameValue(displayTitle); }}
                        onDelete={() => { setOpenMenu(null); setConfirmingDelete(ws.id); }}
                        onClose={() => setOpenMenu(null)}
                      />
                    )}
                  </AnimatePresence>

                  {/* Card body */}
                  <div style={{ paddingTop: 8 }}>
                    {/* Inline rename input */}
                    {isRenaming ? (
                      <div style={{ display:"flex",gap:4,alignItems:"center",marginBottom:10 }} onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && confirmRename()}
                          style={{ flex:1,fontSize:12,fontWeight:600,color:"#111827",border:"1.5px solid #2563EB",borderRadius:6,padding:"4px 6px",outline:"none",background:"white" }}
                        />
                        <button
                          onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); confirmRename(); }}
                          style={{ width:24,height:24,borderRadius:"50%",background:"#2563EB",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}
                        >
                          <Check size={12} color="white" strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <p style={{ fontSize:13,fontWeight:700,color:"#111827",lineHeight:1.35,marginBottom:12,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden",paddingRight:18 }}>
                        {displayTitle}
                      </p>
                    )}

                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between" style={{ marginBottom:5 }}>
                        <span style={{ fontSize:11,color:"#6B7280" }}>Progress</span>
                        <span style={{ fontSize:11,fontWeight:700,color:ws.color }}>{ws.progress}%</span>
                      </div>
                      <div style={{ width:"100%",height:7,borderRadius:4,background:"#EFF6FF",overflow:"hidden" }}>
                        <div style={{ width:`${ws.progress}%`,height:"100%",borderRadius:4,background:ws.progress>0?ws.color:"transparent" }} />
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <span style={{ display:"inline-block",padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:ss.bg,color:ss.text }}>
                    {ws.status}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Success toast */}
      <GlobalToast />

      {/* Notification overlay */}
      <AnimatePresence>
        {showNotification && (
          <NotificationOverlay onClose={() => setShowNotification(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && <Sidebar onClose={() => setShowSidebar(false)} user={currentUser} />}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {confirmingDelete && (() => {
          const ws = workspaces.find((w) => w.id === confirmingDelete);
          const title = ws ? (renamedMap[ws.id] ?? ws.title) : "this workspace";
          return (
            <DeleteConfirmModal
              title={title}
              onConfirm={() => { removeWorkspace(confirmingDelete); setConfirmingDelete(null); }}
              onCancel={() => setConfirmingDelete(null)}
            />
          );
        })()}
      </AnimatePresence>
    </PhoneFrame>
  );
}
