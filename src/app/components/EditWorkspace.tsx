import { useState } from "react";
import { useNavigate, useParams } from "../router";
import { ArrowLeft, Briefcase, Calendar } from "lucide-react";
import { motion } from "../motion-compat";
import { PhoneFrame } from "./PhoneFrame";
import { useWorkspaces } from "../context/WorkspaceContext";
import { toastStore } from "../context/ToastStore";
import { CalendarPicker } from "./CalendarPicker";
import { LoadingButton } from "./LoadingButton";

// ─── date helpers ─────────────────────────────────────────────────────────────
const _now       = new Date();
const THIS_YEAR  = _now.getFullYear();
const THIS_MONTH = _now.getMonth();
const THIS_DAY   = _now.getDate();

const MONTHS_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function fmtDate(m: number, d: number, y: number) {
  return `${MONTHS_FULL[m]} ${d}, ${y}`;
}

/** Parse the deadline string (from backend or previously saved) back to m/d/y */
function parseDeadline(deadline: string): { month: number; day: number; year: number } | null {
  if (!deadline || deadline === "TBD" || deadline === "No Deadline") return null;

  // Try "January 1, 2025" format
  const longMatch = deadline.match(/^(\w+)\s+(\d+),\s+(\d{4})$/);
  if (longMatch) {
    const monthIdx = MONTHS_FULL.indexOf(longMatch[1]);
    if (monthIdx !== -1) {
      return { month: monthIdx, day: parseInt(longMatch[2], 10), year: parseInt(longMatch[3], 10) };
    }
  }

  // Try ISO "2025-01-01" or "2025-01-01T..." format
  const isoStr = deadline.split("T")[0];
  const d = new Date(isoStr + "T00:00:00");
  if (!Number.isNaN(d.getTime())) {
    return { month: d.getMonth(), day: d.getDate(), year: d.getFullYear() };
  }

  return null;
}

const COLORS = [
  "#2563EB", "#7C3AED", "#DB2777", "#DC2626",
  "#EA580C", "#D97706", "#16A34A", "#0891B2",
];

export function EditWorkspace() {
  const navigate  = useNavigate();
  const { id }    = useParams();
  const { getWorkspace, updateWorkspace } = useWorkspaces();

  const workspace = getWorkspace(id ?? "");

  // Initialise form from existing workspace data
  const parsed = parseDeadline(workspace?.deadline ?? "");
  const [title,         setTitle]         = useState(workspace?.title ?? "");
  const [description,   setDescription]   = useState(workspace?.description ?? "");
  const [selectedColor, setSelectedColor] = useState(workspace?.color ?? COLORS[0]);
  const [dateSet,       setDateSet]       = useState(parsed !== null);
  const [dateOpen,      setDateOpen]      = useState(false);
  const [month,         setMonth]         = useState(parsed?.month  ?? THIS_MONTH);
  const [day,           setDay]           = useState(parsed?.day    ?? THIS_DAY);
  const [year,          setYear]          = useState(parsed?.year   ?? THIS_YEAR);

  const isValid = title.trim().length > 0;

  const handleSave = async () => {
    if (!isValid || !id) return;
    await updateWorkspace(id, {
      title:       title.trim(),
      description: description.trim(),
      color:       selectedColor,
      deadline:    dateSet ? fmtDate(month, day, year) : "TBD",
    });
    toastStore.show("Workspace updated successfully!");
    navigate("/");
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    border: "1.5px solid #E5E7EB",
    borderRadius: 12,
    padding: "11px 14px",
    fontSize: 14,
    color: "#111827",
    background: "#FAFAFA",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <PhoneFrame indicatorBg="#ffffff">
      {/* Header */}
      <div
        className="bg-white flex-shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}
      >
        <button onClick={() => navigate("/")} className="p-1">
          <ArrowLeft size={22} strokeWidth={2} color="#374151" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
          Edit Workspace
        </span>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "#F5F5F5" }}>

        {/* Colour preview icon */}
        <div className="flex justify-center mb-5">
          <div
            style={{
              width: 80, height: 80, borderRadius: 24,
              background: selectedColor,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 8px 24px ${selectedColor}55`,
            }}
          >
            <Briefcase size={36} color="white" strokeWidth={1.8} />
          </div>
        </div>

        {/* Colour picker */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
            Workspace Colour
          </p>
          <div className="flex gap-3 flex-wrap">
            {COLORS.map((c) => (
              <motion.button
                key={c}
                whileTap={{ scale: 0.85 }}
                onClick={() => setSelectedColor(c)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: c,
                  border: selectedColor === c ? `3px solid ${c}` : "3px solid transparent",
                  outline: selectedColor === c ? "2px solid white" : "none",
                  outlineOffset: -4,
                  cursor: "pointer",
                  boxShadow: selectedColor === c ? `0 0 0 3px ${c}66` : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* Workspace Name */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              Workspace Name <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter workspace name"
              style={inputBase}
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              rows={3}
              style={{ ...inputBase, resize: "none", lineHeight: 1.5 }}
            />
          </div>

          {/* Project Deadline */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 10 }}>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} color="#374151" />
                Project Deadline
              </span>
            </label>

            <button
              onClick={() => setDateOpen(!dateOpen)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "10px 12px",
                borderRadius: 10, border: "none", cursor: "pointer",
                background: dateSet ? "#EFF6FF" : "white",
                outline: dateOpen ? "2px solid #2563EB" : "1.5px solid #E5E7EB",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={14} color={dateSet ? "#2563EB" : "#9CA3AF"} />
                <span style={{
                  fontSize: 13,
                  fontWeight: dateSet ? 500 : 400,
                  color: dateSet ? "#111827" : "#9CA3AF",
                }}>
                  {dateSet ? fmtDate(month, day, year) : "Select deadline date"}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{dateOpen ? "▲" : "▼"}</span>
            </button>

            {dateOpen && (
              <div style={{ marginTop: 8 }}>
                <CalendarPicker
                  selected={dateSet ? { month, day, year } : null}
                  onChange={(m, d, y) => {
                    setMonth(m); setDay(d); setYear(y);
                    setDateSet(true); setDateOpen(false);
                  }}
                />
              </div>
            )}

            {dateSet && (
              <button
                onClick={() => { setDateSet(false); setDateOpen(false); }}
                style={{
                  marginTop: 6, fontSize: 11, color: "#9CA3AF",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                Clear date
              </button>
            )}
          </div>

          <div style={{ height: 4 }} />
        </div>
      </div>

      {/* Save button */}
      <div className="bg-white flex-shrink-0 px-4 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
        <LoadingButton
          disabled={!isValid}
          onComplete={handleSave}
          label="Save Changes"
          successLabel="Changes Saved!"
          style={{
            background: isValid ? selectedColor : "#E5E7EB",
            boxShadow: isValid ? `0 4px 14px ${selectedColor}55` : "none",
          }}
        />
      </div>
    </PhoneFrame>
  );
}
