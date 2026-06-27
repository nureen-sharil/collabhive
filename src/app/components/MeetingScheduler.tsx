import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "../router";
import { buildApiUrl } from "../../lib/api";
import { ArrowLeft, Plus, Clock, Users, Calendar, CheckCircle, PartyPopper } from "lucide-react";
import { motion, AnimatePresence } from "../motion-compat";
import { GlobalToast } from "./GlobalToast";

// Inline spinner for the vote button
function VoteSpinner() {
  return (
    <svg width={17} height={17} viewBox="0 0 17 17"
      style={{ animation: "collabhive-spin 0.8s linear infinite", flexShrink: 0 }}>
      <circle cx={8.5} cy={8.5} r={6.5} fill="none" stroke="white" strokeWidth={2} strokeOpacity={0.3} />
      <path d="M8.5 2 a6.5 6.5 0 0 1 6.5 6.5" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" />
      <style>{`@keyframes collabhive-spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  );
}
import { PhoneFrame } from "./PhoneFrame";
import { useMeetings } from "../context/MeetingContext";
import { useWorkspaces } from "../context/WorkspaceContext";

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

export function MeetingScheduler() {
  const navigate        = useNavigate();
  const { id }          = useParams();
  const { polls, updatePoll, replacePollsForWorkspace } = useMeetings();
  const { getWorkspace } = useWorkspaces();

  const workspacePolls = polls.filter((p) => p.workspaceId === id);
  const workspace = getWorkspace(id ?? "");
  const workspaceMemberCount = workspace ? getWorkspaceMemberCount(workspace.members) : 1;

  const [votedPolls,     setVotedPolls]     = useState<Set<string>>(new Set());
  const [submittingPoll, setSubmittingPoll] = useState<string | null>(null);
  const [toast,          setToast]          = useState<string | null>(null);

  // Fetch polls from backend on mount; restores the current user's vote state across refreshes
  useEffect(() => {
    if (!id) return;
    const userId = getStoredUserId();
    const url = buildApiUrl(`/api/workspaces/${id}/meetings${userId ? `?current_user_id=${userId}` : ""}`);
    axios.get(url).then((res) => {
      const backendPolls = (res.data as any[]).map((p) => ({
        id: String(p.id),
        workspaceId: String(p.workspace_id),
        agenda: p.agenda as string,
        totalVotes: p.totalVotes as number,
        votedCount: p.votedCount as number,
        deadline: (p.deadline as string) || "",
        selectedSlot: p.selectedSlot != null ? String(p.selectedSlot) : undefined,
        timeSlots: (p.timeSlots as any[]).map((s) => ({
          id: String(s.id),
          date: s.date as string,
          time: s.time as string,
          votes: s.votes as number,
        })),
      }));
      replacePollsForWorkspace(id, backendPolls);
      setVotedPolls(new Set(
        backendPolls.filter((p) => p.selectedSlot != null).map((p) => p.id)
      ));
    }).catch(() => { /* fall back to localStorage data */ });
  }, [id]);

  const handleSlotSelect = (pollId: string, slotId: string) => {
    if (votedPolls.has(pollId)) return;
    updatePoll(pollId, {
      selectedSlot: workspacePolls.find((p) => p.id === pollId)?.selectedSlot === slotId
        ? undefined
        : slotId,
    });
  };

  const handleVote = (pollId: string) => {
    const poll = workspacePolls.find((p) => p.id === pollId);
    if (!poll?.selectedSlot || submittingPoll) return;

    setSubmittingPoll(pollId);
    setTimeout(() => {
      void (async () => {
        const userId = getStoredUserId();
        try {
          if (userId) {
            const res = await axios.post(buildApiUrl(`/api/meetings/${pollId}/vote`), {
              user_id: userId,
              slot_id: parseInt(poll.selectedSlot!),
            });
            const p = res.data as any;
            updatePoll(pollId, {
              votedCount: p.votedCount as number,
              totalVotes: p.totalVotes as number,
              timeSlots: (p.timeSlots as any[]).map((s) => ({
                id: String(s.id),
                date: s.date as string,
                time: s.time as string,
                votes: s.votes as number,
              })),
            });
          } else {
            // No user session — local-only fallback
            const maxVotes = workspace ? getWorkspaceMemberCount(workspace.members) : Math.max(poll.totalVotes, 1);
            const updatedSlots = poll.timeSlots.map((s) =>
              s.id === poll.selectedSlot ? { ...s, votes: s.votes + 1 } : s
            );
            updatePoll(pollId, {
              votedCount: Math.min(poll.votedCount + 1, maxVotes),
              timeSlots: updatedSlots,
            });
          }
          setVotedPolls((prev) => new Set(prev).add(pollId));
          setToast("Vote submitted successfully!");
        } catch {
          setToast("Failed to submit vote. Please try again.");
        }
        setSubmittingPoll(null);
        setTimeout(() => setToast(null), 2800);
      })();
    }, 1400);
  };

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      {/* Header */}
      <div className="bg-white flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/workspace/${id}`)} className="p-1">
            <ArrowLeft size={22} strokeWidth={2} color="#374151" />
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Meeting Scheduler</span>
        </div>
        <button onClick={() => navigate(`/workspace/${id}/meetings/create`)} className="p-1">
          <Plus size={22} strokeWidth={2} color="#2563EB" />
        </button>
      </div>

      {/* Polls */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ background: "#F5F5F5" }}>
        {workspacePolls.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <Calendar size={40} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No meetings yet</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>Tap + to create a new meeting poll</p>
          </div>
        )}
        <div className="space-y-4">
          {workspacePolls.map((poll) => {
            const totalParticipants = workspace ? workspaceMemberCount : Math.max(poll.totalVotes ?? 1, 1);
            const voteRatio = poll.votedCount / Math.max(totalParticipants, 1);
            const maxVotes  = Math.max(...poll.timeSlots.map((s) => s.votes), 0);
            const isVoted   = votedPolls.has(poll.id);
            const isNew     = poll.votedCount === 0;

            return (
              <div key={poll.id} className="bg-white rounded-2xl p-4 shadow-sm"
                style={{ border: "1px solid #F3F4F6" }}>

                {/* Title row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111827", flex: 1 }}>
                    {poll.agenda}
                  </h3>
                  {isNew && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, background: "#DBEAFE", color: "#1D4ED8",
                      borderRadius: 10, padding: "2px 8px", flexShrink: 0, marginTop: 2,
                    }}>NEW</span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} color="#6B7280" />
                    <span style={{ fontSize: 12, color: "#6B7280" }}>{poll.votedCount}/{totalParticipants} voted</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} color="#F97316" />
                    <span style={{ fontSize: 12, color: "#F97316", fontWeight: 500 }}>Closes {poll.deadline}</span>
                  </div>
                </div>

                {/* Participation bar */}
                <div style={{ height: 6, borderRadius: 3, background: "#EFF6FF", overflow: "hidden", marginBottom: 14 }}>
                  <div style={{ width: `${voteRatio * 100}%`, height: "100%", borderRadius: 3, background: "#2563EB", transition: "width 0.4s" }} />
                </div>

                {/* Slots */}
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Select Your Available Slot</p>
                <div className="space-y-2 mb-4">
                  {poll.timeSlots.map((slot) => {
                    const isSelected = poll.selectedSlot === slot.id;
                    const isTop      = slot.votes > 0 && slot.votes === maxVotes;
                    return (
                      <button key={slot.id} onClick={() => handleSlotSelect(poll.id, slot.id)}
                        style={{
                          width: "100%", textAlign: "left",
                          border: `2px solid ${isSelected ? "#2563EB" : "#E5E7EB"}`,
                          borderRadius: 12, background: isSelected ? "#EFF6FF" : "#FAFAFA",
                          padding: "10px 12px", cursor: isVoted ? "default" : "pointer",
                          display: "flex", alignItems: "center", gap: 10,
                          opacity: isVoted && !isSelected ? 0.55 : 1,
                        }}
                      >
                        <div style={{
                          width: 18, height: 18, borderRadius: "50%",
                          border: `2px solid ${isSelected ? "#2563EB" : "#D1D5DB"}`,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB" }} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={12} color="#6B7280" />
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{slot.date}</span>
                            {isTop && (
                              <span style={{ fontSize: 10, fontWeight: 600, background: "#DCFCE7", color: "#15803D", borderRadius: 10, padding: "1px 6px" }}>
                                Popular
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock size={12} color="#6B7280" />
                            <span style={{ fontSize: 12, color: "#6B7280" }}>{slot.time}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users size={12} color="#9CA3AF" />
                          <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}>{slot.votes}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Submit */}
                {(() => {
                  const isSubmitting = submittingPoll === poll.id;
                  const bg = isVoted ? "#22C55E" : isSubmitting ? "#1D4ED8" : poll.selectedSlot ? "#2563EB" : "#E5E7EB";
                  const canClick = !!poll.selectedSlot && !isVoted && !isSubmitting;
                  return (
                    <button
                      onClick={() => handleVote(poll.id)}
                      disabled={!canClick}
                      style={{
                        width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
                        background: bg,
                        color: (poll.selectedSlot || isVoted || isSubmitting) ? "white" : "#9CA3AF",
                        fontSize: 14, fontWeight: 600,
                        cursor: canClick ? "pointer" : "default",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "background 0.25s",
                        transform: isSubmitting ? "scale(0.98)" : "scale(1)",
                      }}
                    >
                      {isSubmitting
                        ? <><VoteSpinner /> Processing…</>
                        : isVoted
                        ? <><CheckCircle size={16} color="white" /> Vote Submitted ✓</>
                        : <><CheckCircle size={16} color={poll.selectedSlot ? "white" : "#9CA3AF"} /> Submit Vote</>
                      }
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", damping: 22, stiffness: 300 }}
            style={{
              position: "absolute", bottom: 52, left: 16, right: 16,
              background: "#111827", borderRadius: 14, padding: "12px 16px",
              display: "flex", alignItems: "center", gap: 10,
              zIndex: 60, boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}
          >
            <PartyPopper size={18} color="#22C55E" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <GlobalToast />
    </PhoneFrame>
  );
}
