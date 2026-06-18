import { useState, useEffect } from "react";

export interface TimeSlot {
  id: string;
  date: string;
  time: string;
  votes: number;
}

export interface MeetingPoll {
  id: string;
  agenda: string;
  totalVotes: number;
  votedCount: number;
  timeSlots: TimeSlot[];
  deadline: string;
  selectedSlot?: string;
  workspaceId: string;
}

// ─── module-level singleton ───────────────────────────────────────────────────
type Listener = () => void;
const _listeners = new Set<Listener>();

let _polls: MeetingPoll[] = [
  {
    id: "1", workspaceId: "1",
    agenda: "Sprint Planning & Retrospective",
    totalVotes: 5, votedCount: 4, deadline: "June 14, 2026",
    timeSlots: [
      { id: "1a", date: "June 15", time: "10:00 AM – 11:00 AM", votes: 3 },
      { id: "1b", date: "June 15", time: "2:00 PM – 3:00 PM",   votes: 2 },
      { id: "1c", date: "June 16", time: "9:00 AM – 10:00 AM",  votes: 4 },
      { id: "1d", date: "June 16", time: "3:00 PM – 4:00 PM",   votes: 1 },
    ],
  },
  {
    id: "2", workspaceId: "1",
    agenda: "Design System Review Meeting",
    totalVotes: 5, votedCount: 3, deadline: "June 15, 2026",
    timeSlots: [
      { id: "2a", date: "June 17", time: "11:00 AM – 12:00 PM", votes: 2 },
      { id: "2b", date: "June 17", time: "1:00 PM – 2:00 PM",   votes: 3 },
      { id: "2c", date: "June 18", time: "10:00 AM – 11:00 AM", votes: 1 },
      { id: "2d", date: "June 18", time: "4:00 PM – 5:00 PM",   votes: 1 },
    ],
  },
];

function _notify() { _listeners.forEach((l) => l()); }

export const meetingStore = {
  getAll: () => _polls,
  add: (poll: Omit<MeetingPoll, "id">) => {
    _polls = [..._polls, { ...poll, id: Date.now().toString() }];
    _notify();
  },
  update: (id: string, patch: Partial<MeetingPoll>) => {
    _polls = _polls.map((p) => (p.id === id ? { ...p, ...patch } : p));
    _notify();
  },
};

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useMeetings() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  return {
    polls: _polls,
    addPoll: meetingStore.add,
    updatePoll: meetingStore.update,
  };
}
