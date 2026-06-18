import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const now = new Date();
const TODAY_Y = now.getFullYear();
const TODAY_M = now.getMonth();
const TODAY_D = now.getDate();

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function isPast(m: number, d: number, y: number) {
  if (y < TODAY_Y) return true;
  if (y === TODAY_Y && m < TODAY_M) return true;
  if (y === TODAY_Y && m === TODAY_M && d < TODAY_D) return true;
  return false;
}

interface Props {
  /** Currently selected date (null = nothing selected) */
  selected: { month: number; day: number; year: number } | null;
  onChange: (month: number, day: number, year: number) => void;
  /** Set of "YYYY-M-D" strings that get a dot marker */
  dotDates?: Set<string>;
}

export function CalendarPicker({ selected, onChange, dotDates }: Props) {
  const [viewMonth, setViewMonth] = useState(selected?.month ?? TODAY_M);
  const [viewYear,  setViewYear]  = useState(selected?.year  ?? TODAY_Y);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isSelected = (d: number) =>
    selected !== null &&
    selected.month === viewMonth &&
    selected.day   === d &&
    selected.year  === viewYear;

  const isToday = (d: number) =>
    viewMonth === TODAY_M && viewYear === TODAY_Y && d === TODAY_D;

  const hasDot = (d: number) =>
    dotDates?.has(`${viewYear}-${viewMonth + 1}-${d}`) ?? false;

  // Build cells: nulls for leading empty days, then day numbers
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to a multiple of 7
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #E5E7EB", overflow: "hidden" }}>
      {/* Month navigation header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid #F3F4F6" }}>
        <button
          onClick={prevMonth}
          style={{ width: 30, height: 30, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={16} color="#374151" />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          style={{ width: 30, height: 30, borderRadius: "50%", background: "#F3F4F6", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronRight size={16} color="#374151" />
        </button>
      </div>

      {/* Day-of-week labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "8px 8px 4px" }}>
        {DAY_LABELS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#9CA3AF", paddingBottom: 4 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 8px 10px", gap: "2px 0" }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const past     = isPast(viewMonth, day, viewYear);
          const sel      = isSelected(day);
          const today    = isToday(day);
          const dot      = hasDot(day);

          return (
            <button
              key={i}
              onClick={() => !past && onChange(viewMonth, day, viewYear)}
              disabled={past}
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1",
                borderRadius: "50%",
                border: "none",
                cursor: past ? "default" : "pointer",
                background: sel ? "#2563EB" : "transparent",
                color: sel ? "white" : past ? "#D1D5DB" : today ? "#2563EB" : "#111827",
                fontSize: 13,
                fontWeight: sel || today ? 700 : 400,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                outline: today && !sel ? "1.5px solid #2563EB" : "none",
                outlineOffset: "-1px",
              }}
            >
              {day}
              {/* Dot for meetings/events */}
              {dot && (
                <div style={{
                  position: "absolute",
                  bottom: 3,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: sel ? "rgba(255,255,255,0.8)" : "#2563EB",
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
