import { useMemo, useState } from "react";
import { useNavigate, useParams } from "../router";
import { ArrowLeft, Flag, Tag, Users, AlignLeft, ChevronDown, Calendar, Clock } from "lucide-react";
import { motion } from "../motion-compat";
import { PhoneFrame } from "./PhoneFrame";
import { useTasks, type Priority, type TaskStatus } from "../context/TaskContext";
import { useWorkspaces } from "../context/WorkspaceContext";
import { LoadingButton } from "./LoadingButton";
import { toastStore } from "../context/ToastStore";
import { CalendarPicker } from "./CalendarPicker";

const PRIORITIES: Priority[]  = ["Low", "Medium", "High"];
const STATUSES: { value: TaskStatus; label: string; dot: string }[] = [
  { value: "todo",       label: "To Do",       dot: "#9CA3AF" },
  { value: "inprogress", label: "In Progress",  dot: "#F97316" },
  { value: "done",       label: "Done",         dot: "#22C55E" },
];
const PRIORITY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Low:    { bg: "#DBEAFE", text: "#1D4ED8", dot: "#3B82F6" },
  Medium: { bg: "#FEF3C7", text: "#B45309", dot: "#F59E0B" },
  High:   { bg: "#FEE2E2", text: "#B91C1C", dot: "#EF4444" },
};

// ─── date helpers ─────────────────────────────────────────────────────────────
const now        = new Date();
const THIS_YEAR  = now.getFullYear();
const THIS_MONTH = now.getMonth();
const THIS_DAY   = now.getDate();
const MONTHS     = ["January","February","March","April","May","June","July","August","September","October","November","December"];

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

function DatePicker({ month, day, year, onChange }: { month: number; day: number; year: number; onChange: (m: number, d: number, y: number) => void }) {
  const years = [THIS_YEAR, THIS_YEAR + 1, THIS_YEAR + 2];
  const total = daysInMonth(month, year);
  const safe  = Math.min(day, total);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select value={month} onChange={(e) => onChange(+e.target.value, Math.min(safe, daysInMonth(+e.target.value, year)), year)} style={{ ...SEL, flex: 2 }}>
        {MONTHS.map((n, i) => <option key={i} value={i} disabled={year === THIS_YEAR && i < THIS_MONTH}>{n.slice(0,3)}</option>)}
      </select>
      <select value={safe} onChange={(e) => onChange(month, +e.target.value, year)} style={SEL}>
        {Array.from({ length: total }, (_, i) => i + 1).map((d) => <option key={d} value={d} disabled={isPastDate(month, d, year)}>{d}</option>)}
      </select>
      <select value={year} onChange={(e) => { const y = +e.target.value; const m2 = isPastDate(month, safe, y) ? THIS_MONTH : month; const d2 = isPastDate(m2, safe, y) ? THIS_DAY : safe; onChange(m2, d2, y); }} style={{ ...SEL, flex: 1.4 }}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

interface TimeVal { hour: number; minute: number; ampm: "AM" | "PM" }
function TimeRow({ val, onChange }: { val: TimeVal; onChange: (v: TimeVal) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <select value={val.hour} onChange={(e) => onChange({ ...val, hour: +e.target.value })} style={SEL}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
      </select>
      <span style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>:</span>
      <select value={val.minute} onChange={(e) => onChange({ ...val, minute: +e.target.value })} style={SEL}>
        {[0,5,10,15,20,25,30,35,40,45,50,55].map((m) => <option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
      </select>
      <select value={val.ampm} onChange={(e) => onChange({ ...val, ampm: e.target.value as "AM"|"PM" })} style={{ ...SEL, flex: 1.2 }}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}
function fmtDate(m: number, d: number, y: number) { return `${MONTHS[m].slice(0,3)} ${d}, ${y}`; }
function fmtTime(v: TimeVal) { return `${String(v.hour).padStart(2,"0")}:${String(v.minute).padStart(2,"0")} ${v.ampm}`; }

// ─── main ─────────────────────────────────────────────────────────────────────
export function CreateTask() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const { addTask } = useTasks();
  const { getWorkspace } = useWorkspaces();
  const workspace = getWorkspace(id ?? "");

  const assignees = useMemo(() => {
    const palette = ["#2563EB", "#7C3AED", "#DB2777", "#16A34A", "#EA580C", "#0891B2", "#D97706", "#DC2626"];
    const toInitials = (name: string) => {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return "U";
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    };
    const members = workspace?.members.filter(Boolean) ?? [];
    if (members.length > 0) {
      return members.map((name, index) => ({
        initials: toInitials(String(name)),
        name: String(name),
        color: palette[index % palette.length],
      }));
    }
    return [{ initials: "U", name: "Unassigned", color: "#9CA3AF" }];
  }, [workspace]);

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [priority,    setPriority]    = useState<Priority>("Medium");
  const [status,      setStatus]      = useState<TaskStatus>("todo");
  const [assigneeIdx, setAssigneeIdx] = useState(0);

  const [dateSet,  setDateSet]  = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [month,    setMonth]    = useState(THIS_MONTH);
  const [day,      setDay]      = useState(THIS_DAY);
  const [year,     setYear]     = useState(THIS_YEAR);

  const [timeSet,  setTimeSet]  = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [timeVal,  setTimeVal]  = useState<TimeVal>({ hour: 9, minute: 0, ampm: "AM" });

  const [showPriority, setShowPriority] = useState(false);
  const [showStatus,   setShowStatus]   = useState(false);
  const [showAssignee, setShowAssignee] = useState(false);

  const isValid = title.trim().length > 0 && dateSet;

  const handleCreate = async () => {
    if (!isValid) return;
    const a = assignees[assigneeIdx] ?? assignees[0];
    try {
      await addTask({
        title:         title.trim(),
        description:   description.trim(),
        priority,
        status,
        dueDate:       fmtDate(month, day, year),
        dueTime:       timeSet ? fmtTime(timeVal) : "",
        assignee:      a.initials,
        assigneeName:  a.name,
        assigneeColor: a.color,
        workspaceId:   id ?? "1",
      });
      toastStore.show("Task added successfully!");
      navigate(`/workspace/${id}/tasks`);
    } catch {
      toastStore.show("Failed to create task. Please try again.");
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12,
    padding: "11px 14px", fontSize: 14, color: "#111827",
    background: "#FAFAFA", outline: "none", fontFamily: "inherit",
  };

  const pc = PRIORITY_COLORS[priority];
  const statusInfo = STATUSES.find((s) => s.value === status)!;

  const DropDown = ({ open, onToggle, preview, children }: { open: boolean; onToggle: () => void; preview: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <button onClick={onToggle} style={{ ...inputBase, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", gap: 8 }}>
        {preview}
        <ChevronDown size={15} color="#6B7280" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, border: "1.5px solid #E5E7EB", borderRadius: 12, overflow: "hidden", background: "white", zIndex: 30, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
          {children}
        </motion.div>
      )}
    </div>
  );

  const rowBtn = (active: boolean, confirmed: boolean): React.CSSProperties => ({
    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
    background: confirmed ? "#EFF6FF" : "white",
    outline: active ? "2px solid #2563EB" : "1.5px solid #E5E7EB",
  });

  const confirmBtn: React.CSSProperties = {
    width: "100%", marginTop: 10, padding: "9px 0", borderRadius: 10,
    border: "none", cursor: "pointer", background: "#2563EB", color: "white", fontSize: 13, fontWeight: 600,
  };

  return (
    <PhoneFrame indicatorBg="#ffffff">
      {/* Header */}
      <div className="bg-white flex-shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={() => navigate(`/workspace/${id}/tasks`)} className="p-1">
          <ArrowLeft size={22} strokeWidth={2} color="#374151" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Create New Task</span>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "#F5F5F5" }}
        onClick={() => { setShowPriority(false); setShowStatus(false); setShowAssignee(false); }}>
        <div className="space-y-4">

          {/* Title */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2"><AlignLeft size={13} color="#374151" /><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Task Title <span style={{ color: "#EF4444" }}>*</span></span></div>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Design system documentation" style={inputBase} />
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2"><AlignLeft size={13} color="#374151" /><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Description</span></div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add task details or notes..." rows={3} style={{ ...inputBase, resize: "none", lineHeight: 1.5 }} />
          </div>

          {/* Priority + Status */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2"><Flag size={13} color="#374151" /><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Priority</span></div>
              <DropDown open={showPriority} onToggle={() => { setShowPriority(!showPriority); setShowStatus(false); setShowAssignee(false); }}
                preview={<div className="flex items-center gap-2"><div style={{ width: 8, height: 8, borderRadius: "50%", background: pc.dot }} /><span style={{ fontSize: 13, fontWeight: 600, color: pc.text }}>{priority}</span></div>}>
                {PRIORITIES.map((p, i) => { const c = PRIORITY_COLORS[p]; return (
                  <button key={p} onClick={() => { setPriority(p); setShowPriority(false); }}
                    style={{ width: "100%", padding: "10px 14px", textAlign: "left", fontSize: 13, fontWeight: p === priority ? 700 : 400, color: c.text, background: p === priority ? c.bg : "white", border: "none", borderTop: i > 0 ? "1px solid #F3F4F6" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot }} />{p}
                  </button>
                );})}
              </DropDown>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-1.5 mb-2"><Tag size={13} color="#374151" /><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Status</span></div>
              <DropDown open={showStatus} onToggle={() => { setShowStatus(!showStatus); setShowPriority(false); setShowAssignee(false); }}
                preview={<div className="flex items-center gap-2"><div style={{ width: 8, height: 8, borderRadius: "50%", background: statusInfo.dot }} /><span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{statusInfo.label}</span></div>}>
                {STATUSES.map((s, i) => (
                  <button key={s.value} onClick={() => { setStatus(s.value); setShowStatus(false); }}
                    style={{ width: "100%", padding: "10px 14px", textAlign: "left", fontSize: 13, fontWeight: s.value === status ? 700 : 400, color: "#111827", background: s.value === status ? "#F3F4F6" : "white", border: "none", borderTop: i > 0 ? "1px solid #F3F4F6" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.dot }} />{s.label}
                  </button>
                ))}
              </DropDown>
            </div>
          </div>

          {/* Due Date */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3"><Calendar size={13} color="#374151" /><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Due Date <span style={{ color: "#EF4444" }}>*</span></span></div>
            <button onClick={() => { setDateOpen(!dateOpen); setTimeOpen(false); }} style={rowBtn(dateOpen, dateSet)}>
              <div className="flex items-center gap-2">
                <Calendar size={14} color={dateSet ? "#2563EB" : "#9CA3AF"} />
                <span style={{ fontSize: 13, fontWeight: dateSet ? 500 : 400, color: dateSet ? "#111827" : "#9CA3AF" }}>
                  {dateSet ? fmtDate(month, day, year) : "Select date"}
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
          </div>


          {/* Due Time */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-3"><Clock size={13} color="#374151" /><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Due Time</span></div>
            <button onClick={() => { setTimeOpen(!timeOpen); setDateOpen(false); }} style={rowBtn(timeOpen, timeSet)}>
              <div className="flex items-center gap-2">
                <Clock size={14} color={timeSet ? "#2563EB" : "#9CA3AF"} />
                <span style={{ fontSize: 13, fontWeight: timeSet ? 500 : 400, color: timeSet ? "#111827" : "#9CA3AF" }}>
                  {timeSet ? fmtTime(timeVal) : "Select time"}
                </span>
              </div>
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>{timeOpen ? "▲" : "▼"}</span>
            </button>
            {timeOpen && (
              <div style={{ marginTop: 8, background: "white", border: "1.5px solid #E5E7EB", borderRadius: 12, padding: 12 }}>
                <TimeRow val={timeVal} onChange={setTimeVal} />
                <button style={confirmBtn} onClick={() => { setTimeSet(true); setTimeOpen(false); }}>Confirm Time</button>
              </div>
            )}
          </div>

          {/* Assignee */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2"><Users size={13} color="#374151" /><span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Assignee</span></div>
            <DropDown open={showAssignee} onToggle={() => { setShowAssignee(!showAssignee); setShowPriority(false); setShowStatus(false); }}
              preview={<div className="flex items-center gap-2"><div style={{ width: 22, height: 22, borderRadius: "50%", background: (assignees[assigneeIdx] ?? assignees[0]).color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "white" }}>{(assignees[assigneeIdx] ?? assignees[0]).initials}</div><span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{(assignees[assigneeIdx] ?? assignees[0]).name}</span></div>}>
              {assignees.map((a, i) => (
                <button key={a.initials} onClick={() => { setAssigneeIdx(i); setShowAssignee(false); }}
                  style={{ width: "100%", padding: "10px 14px", textAlign: "left", fontSize: 13, fontWeight: assigneeIdx === i ? 700 : 400, color: "#111827", background: assigneeIdx === i ? "#F3F4F6" : "white", border: "none", borderTop: i > 0 ? "1px solid #F3F4F6" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: a.color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{a.initials}</div>
                  {a.name}
                </button>
              ))}
            </DropDown>
          </div>

          <div style={{ height: 4 }} />
        </div>
      </div>

      {/* Create button */}
      <div className="bg-white flex-shrink-0 px-4 pt-2 pb-3" style={{ borderTop: "1px solid #F3F4F6" }}>
        {!isValid && title.trim() !== "" && (
          <p style={{ fontSize: 11, color: "#EF4444", textAlign: "center", marginBottom: 6 }}>
            Please confirm a due date.
          </p>
        )}
        <LoadingButton
          disabled={!isValid}
          onComplete={handleCreate}
          label="Create Task"
          successLabel="Task Created!"
          style={{ background: isValid ? "#111827" : "#E5E7EB" }}
        />
      </div>
    </PhoneFrame>
  );
}
