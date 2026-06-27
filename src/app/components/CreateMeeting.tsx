import { useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "../router";
import { buildApiUrl } from "../../lib/api";
import { ArrowLeft, Plus, Trash2, Calendar, Clock } from "lucide-react";
import { PhoneFrame } from "./PhoneFrame";
import { useMeetings } from "../context/MeetingContext";
import { useWorkspaces } from "../context/WorkspaceContext";
import { toastStore } from "../context/ToastStore";
import { CalendarPicker } from "./CalendarPicker";
import { LoadingButton } from "./LoadingButton";

// ─── date helpers ────────────────────────────────────────────────────────────
const now        = new Date();
const THIS_YEAR  = now.getFullYear();
const THIS_MONTH = now.getMonth();
const THIS_DAY   = now.getDate();

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}
function isPastDate(month: number, day: number, year: number) {
  if (year  < THIS_YEAR)  return true;
  if (year  === THIS_YEAR && month < THIS_MONTH) return true;
  if (year  === THIS_YEAR && month === THIS_MONTH && day < THIS_DAY) return true;
  return false;
}

// ─── shared select style ─────────────────────────────────────────────────────
const SEL: React.CSSProperties = {
  flex: 1, padding: "9px 4px", fontSize: 13, fontWeight: 500,
  color: "#111827", background: "white",
  border: "1.5px solid #E5E7EB", borderRadius: 10,
  outline: "none", cursor: "pointer",
  appearance: "none", WebkitAppearance: "none", textAlign: "center",
};

// ─── DatePicker ──────────────────────────────────────────────────────────────
function DatePicker({ month, day, year, onChange }: {
  month: number; day: number; year: number;
  onChange: (m: number, d: number, y: number) => void;
}) {
  const years     = [THIS_YEAR, THIS_YEAR + 1, THIS_YEAR + 2];
  const totalDays = daysInMonth(month, year);
  const safeDay   = Math.min(day, totalDays);

  const setMonth = (m: number) => onChange(m, Math.min(safeDay, daysInMonth(m, year)), year);
  const setDay   = (d: number) => onChange(month, d, year);
  const setYear  = (y: number) => {
    let m = month, d = safeDay;
    if (isPastDate(m, d, y)) { m = THIS_MONTH; d = THIS_DAY; }
    onChange(m, d, y);
  };

  return (
    <div style={{ display: "flex", gap: 6 }}>
      <select value={month} onChange={(e) => setMonth(+e.target.value)} style={{ ...SEL, flex: 2 }}>
        {MONTHS.map((name, i) => (
          <option key={i} value={i} disabled={year === THIS_YEAR && i < THIS_MONTH}>
            {name.slice(0, 3)}
          </option>
        ))}
      </select>
      <select value={safeDay} onChange={(e) => setDay(+e.target.value)} style={SEL}>
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d} disabled={isPastDate(month, d, year)}>{d}</option>
        ))}
      </select>
      <select value={year} onChange={(e) => setYear(+e.target.value)} style={{ ...SEL, flex: 1.4 }}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

// ─── time row ────────────────────────────────────────────────────────────────
interface TimeVal { hour: number; minute: number; ampm: "AM" | "PM" }

function TimeRow({ label, val, onChange }: {
  label: string; val: TimeVal; onChange: (v: TimeVal) => void;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", display: "block", marginBottom: 5 }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <select value={val.hour} onChange={(e) => onChange({ ...val, hour: +e.target.value })} style={SEL}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
          ))}
        </select>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#374151" }}>:</span>
        <select value={val.minute} onChange={(e) => onChange({ ...val, minute: +e.target.value })} style={SEL}>
          {[0,5,10,15,20,25,30,35,40,45,50,55].map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
          ))}
        </select>
        <select value={val.ampm} onChange={(e) => onChange({ ...val, ampm: e.target.value as "AM"|"PM" })} style={{ ...SEL, flex: 1.2 }}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}

function fmtTime(v: TimeVal) {
  return `${String(v.hour).padStart(2,"0")}:${String(v.minute).padStart(2,"0")} ${v.ampm}`;
}

// ─── slot state ──────────────────────────────────────────────────────────────
interface SlotState {
  id: string;
  dateSet: boolean; month: number; day: number; year: number;
  timeSet: boolean;
  start: TimeVal; end: TimeVal;
}

const DEFAULT_START: TimeVal = { hour: 9,  minute: 0, ampm: "AM" };
const DEFAULT_END:   TimeVal = { hour: 10, minute: 0, ampm: "AM" };

function makeSlot(id: string): SlotState {
  return {
    id, dateSet: false, month: THIS_MONTH, day: THIS_DAY, year: THIS_YEAR,
    timeSet: false, start: { ...DEFAULT_START }, end: { ...DEFAULT_END },
  };
}

function slotDateLabel(s: SlotState) {
  return `${MONTHS[s.month].slice(0,3)} ${s.day}, ${s.year}`;
}
function slotTimeLabel(s: SlotState) {
  return `${fmtTime(s.start)} – ${fmtTime(s.end)}`;
}

// ─── deadline helper: 3 days from now ────────────────────────────────────────
function deadlineFromPollLength(pl: string): string {
  const days = pl === "1 day" ? 1 : pl === "3 days" ? 3 : pl === "1 week" ? 7 : 14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function getWorkspaceMemberCount(workspaceMembers: string[]) {
  const members = new Set(workspaceMembers.filter(Boolean));
  return Math.max(members.size, 1);
}

function getStoredUserId(): number | null {
  const keys = ["currentUser", "collabhive.auth.currentUser", "ch_auth_user", "user"];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { id?: unknown; user_id?: unknown };
      const rawId = parsed?.id ?? parsed?.user_id;
      const n = Number(rawId);
      if (Number.isFinite(n) && n > 0) return n;
    } catch { /* ignore */ }
  }
  return null;
}

// ─── main component ──────────────────────────────────────────────────────────
export function CreateMeeting() {
  const navigate    = useNavigate();
  const { id }      = useParams();
  const { addPoll, polls } = useMeetings();
  const { getWorkspace } = useWorkspaces();
  const workspace = getWorkspace(id ?? "");
  const workspaceMemberCount = workspace ? getWorkspaceMemberCount(workspace.members) : 1;

  // Build a set of dates that already have meetings for dot markers
  const existingMeetingDates = new Set<string>();
  polls.filter((p) => p.workspaceId === id).forEach((p) => {
    p.timeSlots.forEach((s) => {
      // Slot date format: "June 15" — convert to "YYYY-M-D" for lookup
      const parts = s.date.split(" ");
      const monthIdx = ["January","February","March","April","May","June","July","August","September","October","November","December"].indexOf(parts[0]);
      if (monthIdx >= 0 && parts[1]) {
        const now2 = new Date();
        existingMeetingDates.add(`${now2.getFullYear()}-${monthIdx + 1}-${parseInt(parts[1])}`);
      }
    });
  });

  const [agenda,        setAgenda]        = useState("");
  const [pollLength,    setPollLength]     = useState("3 days");
  const [allowMultiple, setAllowMultiple]  = useState(false);
  const [slots,         setSlots]          = useState<SlotState[]>([makeSlot("1"), makeSlot("2")]);
  const [expandedDate,  setExpandedDate]   = useState<string | null>(null);
  const [expandedTime,  setExpandedTime]   = useState<string | null>(null);

  const patchSlot = (slotId: string, patch: Partial<SlotState>) =>
    setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, ...patch } : s));

  const addSlot    = () => setSlots([...slots, makeSlot(Date.now().toString())]);
  const removeSlot = (slotId: string) => {
    if (slots.length > 1) setSlots(slots.filter((s) => s.id !== slotId));
    if (expandedDate === slotId) setExpandedDate(null);
    if (expandedTime === slotId) setExpandedTime(null);
  };

  const isFormValid =
    agenda.trim() !== "" &&
    slots.length >= 2 &&
    slots.every((s) => s.dateSet && s.timeSet);

  const handleCreate = async () => {
    if (!isFormValid) return;
    const userId = getStoredUserId();
    const numericId = id ? parseInt(id) : null;
    if (userId && numericId) {
      try {
        await axios.post(buildApiUrl(`/api/workspaces/${id}/meetings`), {
          workspace_id: numericId,
          agenda: agenda.trim(),
          deadline: deadlineFromPollLength(pollLength),
          slots: slots.map((s) => ({ date: slotDateLabel(s), time: slotTimeLabel(s) })),
        });
      } catch {
        toastStore.show("Failed to create meeting. Please try again.");
        return;
      }
    } else {
      // Local fallback when no active user session
      addPoll({
        workspaceId: id ?? "",
        agenda: agenda.trim(),
        totalVotes: workspaceMemberCount,
        votedCount: 0,
        deadline: deadlineFromPollLength(pollLength),
        timeSlots: slots.map((s, i) => ({
          id: `new-${i}`,
          date: slotDateLabel(s),
          time: slotTimeLabel(s),
          votes: 0,
        })),
      });
    }
    toastStore.show("Meeting scheduled successfully!");
    navigate(`/workspace/${id}/meetings`);
  };

  const inputBase: React.CSSProperties = {
    width: "100%", border: "1.5px solid #E5E7EB", borderRadius: 12,
    padding: "11px 14px", fontSize: 14, color: "#111827",
    background: "#FAFAFA", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  };

  const confirmBtn: React.CSSProperties = {
    width: "100%", marginTop: 10, padding: "9px 0", borderRadius: 10,
    border: "none", cursor: "pointer", background: "#2563EB",
    color: "white", fontSize: 13, fontWeight: 600,
  };

  const rowBtn = (active: boolean, confirmed: boolean): React.CSSProperties => ({
    width: "100%", display: "flex", alignItems: "center",
    justifyContent: "space-between", padding: "10px 12px",
    borderRadius: 10, border: "none", cursor: "pointer",
    background: confirmed ? "#EFF6FF" : "white",
    outline: active ? "2px solid #2563EB" : "1.5px solid #E5E7EB",
  });

  return (
    <PhoneFrame indicatorBg="#ffffff">
      {/* Header */}
      <div className="bg-white flex-shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={() => navigate(`/workspace/${id}/meetings`)} className="p-1">
          <ArrowLeft size={22} strokeWidth={2} color="#374151" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Create New Meeting</span>
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "#F5F5F5" }}>
        <div className="space-y-4">

          {/* Agenda */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              Meeting Agenda
            </label>
            <input type="text" value={agenda} onChange={(e) => setAgenda(e.target.value)}
              placeholder="Enter meeting agenda..." style={inputBase} />
          </div>

          {/* Time Slot Options */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Time Options</span>
              <button onClick={addSlot} style={{
                display: "flex", alignItems: "center", gap: 4, fontSize: 13,
                fontWeight: 500, color: "#2563EB", background: "none", border: "none", cursor: "pointer", padding: 0,
              }}>
                <Plus size={15} strokeWidth={2.5} /> Add Option
              </button>
            </div>

            <div className="space-y-3">
              {slots.map((slot, index) => {
                const dateOpen = expandedDate === slot.id;
                const timeOpen = expandedTime === slot.id;
                return (
                  <div key={slot.id} style={{ border: "1.5px solid #E5E7EB", borderRadius: 14, padding: 12, background: "#FAFAFA" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Option {index + 1}</span>
                      {slots.length > 1 && (
                        <button onClick={() => removeSlot(slot.id)} style={{
                          width: 28, height: 28, borderRadius: "50%",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "#FEE2E2", border: "none", cursor: "pointer",
                        }}>
                          <Trash2 size={13} color="#B91C1C" />
                        </button>
                      )}
                    </div>

                    {/* Date */}
                    <div style={{ marginBottom: 8 }}>
                      <button onClick={() => { setExpandedDate(dateOpen ? null : slot.id); setExpandedTime(null); }}
                        style={rowBtn(dateOpen, slot.dateSet)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Calendar size={14} color={slot.dateSet ? "#2563EB" : "#9CA3AF"} />
                          <span style={{ fontSize: 13, fontWeight: slot.dateSet ? 500 : 400, color: slot.dateSet ? "#111827" : "#9CA3AF" }}>
                            {slot.dateSet ? slotDateLabel(slot) : "Select date"}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{dateOpen ? "▲" : "▼"}</span>
                      </button>
                      {dateOpen && (
                        <div style={{ marginTop: 8 }}>
                          <CalendarPicker
                            selected={slot.dateSet ? { month: slot.month, day: slot.day, year: slot.year } : null}
                            dotDates={existingMeetingDates}
                            onChange={(m, d, y) => {
                              patchSlot(slot.id, { month: m, day: d, year: y, dateSet: true });
                              setExpandedDate(null);
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div>
                      <button onClick={() => { setExpandedTime(timeOpen ? null : slot.id); setExpandedDate(null); }}
                        style={rowBtn(timeOpen, slot.timeSet)}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Clock size={14} color={slot.timeSet ? "#2563EB" : "#9CA3AF"} />
                          <span style={{ fontSize: 13, fontWeight: slot.timeSet ? 500 : 400, color: slot.timeSet ? "#111827" : "#9CA3AF" }}>
                            {slot.timeSet ? slotTimeLabel(slot) : "Select time range"}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: "#9CA3AF" }}>{timeOpen ? "▲" : "▼"}</span>
                      </button>
                      {timeOpen && (
                        <div style={{ marginTop: 8, background: "white", borderRadius: 12, border: "1.5px solid #E5E7EB", padding: 12 }}>
                          <TimeRow label="Start Time" val={slot.start} onChange={(v) => patchSlot(slot.id, { start: v })} />
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600 }}>TO</span>
                            <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                          </div>
                          <TimeRow label="End Time" val={slot.end} onChange={(v) => patchSlot(slot.id, { end: v })} />
                          <button style={confirmBtn}
                            onClick={() => { patchSlot(slot.id, { timeSet: true }); setExpandedTime(null); }}>
                            Confirm Time Range
                          </button>
                        </div>
                      )}
                    </div>

                    {((slot.dateSet && !slot.timeSet) || (!slot.dateSet && slot.timeSet)) && (
                      <p style={{ fontSize: 11, color: "#EF4444", marginTop: 6 }}>Both a date and a time range are required.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Poll Length */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Poll Length</label>
            <select value={pollLength} onChange={(e) => setPollLength(e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
              <option value="1 day">1 day</option>
              <option value="3 days">3 days</option>
              <option value="1 week">1 week</option>
              <option value="2 weeks">2 weeks</option>
            </select>
          </div>

          {/* Allow Multiple */}
          <div className="bg-white rounded-2xl p-4 shadow-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Allow Multiple Answers</p>
              <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>Members can select multiple time slots</p>
            </div>
            <button onClick={() => setAllowMultiple(!allowMultiple)} style={{
              width: 48, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
              background: allowMultiple ? "#2563EB" : "#D1D5DB", position: "relative", flexShrink: 0, transition: "background 0.2s",
            }}>
              <span style={{
                position: "absolute", top: 3, left: allowMultiple ? 23 : 3,
                width: 22, height: 22, borderRadius: "50%", background: "white",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s",
              }} />
            </button>
          </div>

          <div style={{ height: 4 }} />
        </div>
      </div>

      {/* Create button */}
      <div className="bg-white flex-shrink-0 px-4 pt-2 pb-3" style={{ borderTop: "1px solid #F3F4F6" }}>
        {!isFormValid && (agenda.trim() !== "" || slots.some((s) => s.dateSet || s.timeSet)) && (
          <p style={{ fontSize: 11, color: "#EF4444", textAlign: "center", marginBottom: 6 }}>
            {!agenda.trim() ? "Please enter a meeting agenda." : "Every option needs a confirmed date and time range."}
          </p>
        )}
        <LoadingButton
          disabled={!isFormValid}
          onComplete={handleCreate}
          label="Create Meeting"
          successLabel="Meeting Created!"
          style={{ background: isFormValid ? "#111827" : "#E5E7EB" }}
        />
      </div>
    </PhoneFrame>
  );
}
