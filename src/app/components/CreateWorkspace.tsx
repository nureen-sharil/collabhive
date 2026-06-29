import { useState } from "react";
import { useNavigate } from "../router";
import { ArrowLeft, Briefcase, Users, Calendar } from "lucide-react";
import { motion } from "../motion-compat";
import { PhoneFrame } from "./PhoneFrame";
import { useWorkspaces } from "../context/WorkspaceContext";
import { toastStore } from "../context/ToastStore";
import { CalendarPicker } from "./CalendarPicker";
import { LoadingButton } from "./LoadingButton";
import { buildApiUrl } from "../../lib/api";

// ─── date helpers (same pattern as CreateMeeting / CreateTask) ────────────────
const _now       = new Date();
const THIS_YEAR  = _now.getFullYear();
const THIS_MONTH = _now.getMonth();   // 0-based
const THIS_DAY   = _now.getDate();

const MONTHS_FULL = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(m: number, y: number) { return new Date(y, m + 1, 0).getDate(); }
function isPastDate(m: number, d: number, y: number) {
  if (y < THIS_YEAR) return true;
  if (y === THIS_YEAR && m < THIS_MONTH) return true;
  if (y === THIS_YEAR && m === THIS_MONTH && d < THIS_DAY) return true;
  return false;
}

const SEL: React.CSSProperties = {
  flex: 1, padding: "9px 4px", fontSize: 13, fontWeight: 500,
  color: "#111827", background: "white",
  border: "1.5px solid #E5E7EB", borderRadius: 10,
  outline: "none", cursor: "pointer",
  appearance: "none", WebkitAppearance: "none", textAlign: "center",
};

function DatePicker({ month, day, year, onChange }: {
  month: number; day: number; year: number;
  onChange: (m: number, d: number, y: number) => void;
}) {
  const years = [THIS_YEAR, THIS_YEAR + 1, THIS_YEAR + 2];
  const total = daysInMonth(month, year);
  const safe  = Math.min(day, total);

  const setMonth = (m: number) => onChange(m, Math.min(safe, daysInMonth(m, year)), year);
  const setDay   = (d: number) => onChange(month, d, year);
  const setYear  = (y: number) => {
    let m = month, d = safe;
    if (isPastDate(m, d, y)) { m = THIS_MONTH; d = THIS_DAY; }
    onChange(m, d, y);
  };

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select value={month} onChange={(e) => setMonth(+e.target.value)} style={{ ...SEL, flex: 2 }}>
        {MONTHS_FULL.map((n, i) => (
          <option key={i} value={i} disabled={year === THIS_YEAR && i < THIS_MONTH}>
            {n.slice(0, 3)}
          </option>
        ))}
      </select>
      <select value={safe} onChange={(e) => setDay(+e.target.value)} style={SEL}>
        {Array.from({ length: total }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d} disabled={isPastDate(month, d, year)}>{d}</option>
        ))}
      </select>
      <select value={year} onChange={(e) => setYear(+e.target.value)} style={{ ...SEL, flex: 1.4 }}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

function fmtDate(m: number, d: number, y: number) {
  return `${MONTHS_FULL[m]} ${d}, ${y}`;
}

const COLORS = [
  "#2563EB", "#7C3AED", "#DB2777", "#DC2626",
  "#EA580C", "#D97706", "#16A34A", "#0891B2",
];
const UNREGISTERED_MEMBER_ERROR = "This email is not currently registered as user";

function getStoredCurrentUser() {
  try {
    const raw = localStorage.getItem("currentUser") ?? localStorage.getItem("collabhive.auth.currentUser");
    return raw ? JSON.parse(raw) as { email?: string } : null;
  } catch {
    return null;
  }
}

export function CreateWorkspace() {
  const navigate = useNavigate();
  const { addWorkspace } = useWorkspaces();

  const [title,         setTitle]         = useState("");
  const [description,   setDescription]   = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [memberInput,   setMemberInput]   = useState("");
  const [members,       setMembers]       = useState<string[]>([]);
  const [memberError,   setMemberError]   = useState("");
  const [checkingMember, setCheckingMember] = useState(false);

  // Custom date picker state
  const [dateSet,  setDateSet]  = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [month,    setMonth]    = useState(THIS_MONTH);
  const [day,      setDay]      = useState(THIS_DAY);
  const [year,     setYear]     = useState(THIS_YEAR);

  const isValid = title.trim().length > 0;

  const validateRegisteredMember = async (email: string) => {
    if (!email || members.includes(email)) {
      setMemberError("");
      return true;
    }

    setCheckingMember(true);
    try {
      const response = await fetch(buildApiUrl(`/api/users/by-email/${encodeURIComponent(email)}`));
      if (!response.ok) {
        setMemberError(UNREGISTERED_MEMBER_ERROR);
        return false;
      }

      setMemberError("");
      return true;
    } catch (error) {
      console.error(error);
      setMemberError(UNREGISTERED_MEMBER_ERROR);
      return false;
    } finally {
      setCheckingMember(false);
    }
  };

  const addMember = async () => {
    const email = memberInput.trim().toLowerCase();
    if (!email) return;
    if (!(await validateRegisteredMember(email))) return;

    if (!members.includes(email)) {
      setMembers([...members, email]);
    }
    setMemberInput("");
    setMemberError("");
  };

  const removeMember = (email: string) => setMembers(members.filter((m) => m !== email));

  const handleCreate = async () => {
    if (!isValid) return;
    const currentUser = getStoredCurrentUser();
    const normalizedMembers = Array.from(new Set([
      ...members,
      ...(currentUser?.email ? [currentUser.email.trim()] : []),
    ].filter(Boolean)));
    await addWorkspace({
      title:       title.trim(),
      description: description.trim(),
      color:       selectedColor,
      members:     normalizedMembers,
      deadline:    dateSet ? fmtDate(month, day, year) : "TBD",
    });
    toastStore.show("Workspace created successfully!");
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
          Create Workspace
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
              <button
                key={c}
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

          {/* Project Deadline — custom picker, consistent with Meeting Scheduler */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 10 }}>
              <span className="flex items-center gap-1.5">
                <Calendar size={13} color="#374151" />
                Project Deadline
              </span>
            </label>

            {/* Toggle row */}
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

            {/* Inline calendar picker */}
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

          {/* Invite Members */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                Invite Members
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={memberInput}
                onChange={(e) => {
                  setMemberInput(e.target.value);
                  if (memberError) setMemberError("");
                }}
                onBlur={() => {
                  const email = memberInput.trim().toLowerCase();
                  if (email) void validateRegisteredMember(email);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void addMember();
                  }
                }}
                placeholder="Enter email address"
                style={{ ...inputBase, flex: 1, borderColor: memberError ? "#EF4444" : "#E5E7EB" }}
              />
              <button
                onClick={() => void addMember()}
                disabled={checkingMember}
                style={{
                  padding: "11px 16px", borderRadius: 12,
                  background: checkingMember ? "#93C5FD" : "#2563EB", color: "white",
                  fontSize: 13, fontWeight: 600,
                  border: "none", cursor: checkingMember ? "default" : "pointer", flexShrink: 0,
                }}
              >
                {checkingMember ? "Checking" : "Add"}
              </button>
            </div>
            {memberError && (
              <p style={{ fontSize: 12, color: "#EF4444", marginTop: 6 }}>
                {memberError}
              </p>
            )}

            {members.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {members.map((email) => (
                  <div
                    key={email}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "#EFF6FF", borderRadius: 20,
                      padding: "4px 10px 4px 8px",
                    }}
                  >
                    <div
                      style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: selectedColor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "white",
                      }}
                    >
                      {email.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: 12, color: "#1D4ED8", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {email}
                    </span>
                    <button
                      onClick={() => removeMember(email)}
                      style={{ fontSize: 16, color: "#93C5FD", lineHeight: 1, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ height: 4 }} />
        </div>
      </div>

      {/* Create button */}
      <div className="bg-white flex-shrink-0 px-4 py-3" style={{ borderTop: "1px solid #F3F4F6" }}>
        <LoadingButton
          disabled={!isValid}
          onComplete={handleCreate}
          label="Create Workspace"
          successLabel="Workspace Created!"
          style={{
            background: isValid ? selectedColor : "#E5E7EB",
            boxShadow: isValid ? `0 4px 14px ${selectedColor}55` : "none",
          }}
        />
      </div>
    </PhoneFrame>
  );
}
