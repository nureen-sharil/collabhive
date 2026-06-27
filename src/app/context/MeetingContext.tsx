import { useState, useEffect, type ReactNode } from "react";

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

const STORAGE_KEY = "collabhive.meetings";

function readPollsFromStorage(): MeetingPoll[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MeetingPoll[]) : [];
  } catch {
    return [];
  }
}

function writePollsToStorage(polls: MeetingPoll[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(polls));
  } catch {
    // ignore storage write failures
  }
}

let _polls: MeetingPoll[] = readPollsFromStorage();

function _notify() { _listeners.forEach((l) => l()); }

export const meetingStore = {
  getAll: () => _polls,
  add: (poll: Omit<MeetingPoll, "id">) => {
    _polls = [..._polls, { ...poll, id: Date.now().toString() }];
    writePollsToStorage(_polls);
    _notify();
  },
  update: (id: string, patch: Partial<MeetingPoll>) => {
    _polls = _polls.map((p) => (p.id === id ? { ...p, ...patch } : p));
    writePollsToStorage(_polls);
    _notify();
  },
  replacePollsForWorkspace: (workspaceId: string, newPolls: MeetingPoll[]) => {
    _polls = [..._polls.filter((p) => p.workspaceId !== workspaceId), ...newPolls];
    writePollsToStorage(_polls);
    _notify();
  },
};

// ─── hook ─────────────────────────────────────────────────────────────────────
export function useMeetings() {
  const [, rerender] = useState(0);

  useEffect(() => {
    _polls = readPollsFromStorage();
    const listener: Listener = () => rerender((n) => n + 1);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  return {
    polls: _polls,
    addPoll: meetingStore.add,
    updatePoll: meetingStore.update,
    replacePollsForWorkspace: meetingStore.replacePollsForWorkspace,
  };
}

export function MeetingProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
