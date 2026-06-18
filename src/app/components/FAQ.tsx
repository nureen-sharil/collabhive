import { useState } from "react";
import { useNavigate } from "../router";
import { ArrowLeft, ChevronDown, Search, X, HelpCircle, MessageCircle, Layout, CheckSquare, FileText, Calendar, Bell, User, Wifi } from "lucide-react";
import { motion, AnimatePresence } from "../motion-compat";
import { PhoneFrame } from "./PhoneFrame";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQSection {
  category: string;
  icon: any;
  color: string;
  bg: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQSection[] = [
  {
    category: "Getting Started",
    icon: HelpCircle,
    color: "#2563EB",
    bg: "#DBEAFE",
    items: [
      {
        q: "What is CollabHive?",
        a: "CollabHive is a mobile-first collaborative workspace management platform that lets teams create workspaces, manage tasks, chat, share files, and schedule meetings — all in one place.",
      },
      {
        q: "How do I create an account?",
        a: "Tap 'Sign Up' on the welcome screen, enter your name, email address, and a secure password, then verify your email. You'll be logged in automatically after verification.",
      },
      {
        q: "Can I use CollabHive on multiple devices?",
        a: "Yes! Your data syncs across all devices in real time. Sign in with the same credentials on any device and everything stays up to date.",
      },
      {
        q: "Is CollabHive free to use?",
        a: "CollabHive offers a free tier that includes up to 3 workspaces and 5 team members. Premium plans unlock unlimited workspaces, members, and advanced features.",
      },
    ],
  },
  {
    category: "Workspaces",
    icon: Layout,
    color: "#7C3AED",
    bg: "#F3E8FF",
    items: [
      {
        q: "How do I create a new workspace?",
        a: "From the Dashboard, tap the 'Add Workspace' card or the pencil icon in the search bar. Fill in the workspace name, choose a colour, set an optional deadline, and invite members. Tap 'Create Workspace' to finish.",
      },
      {
        q: "How do I invite members to a workspace?",
        a: "Open the Create or Edit Workspace form, scroll to 'Invite Members', type a team member's email address and tap 'Add'. They'll receive an invitation link via email.",
      },
      {
        q: "Can I rename a workspace after creating it?",
        a: "Yes. On the Dashboard, tap the three-dot (⋮) menu on any workspace card and select 'Rename'. Type the new name and confirm with the checkmark.",
      },
      {
        q: "How do I delete a workspace?",
        a: "Open the Workspace Overview, tap the three-dot menu in the top-right corner, and select 'Delete Workspace'. Note: this permanently removes all tasks, files, and meetings inside it.",
      },
      {
        q: "How do I filter workspaces on the Dashboard?",
        a: "Tap the filter icon (⊟) next to the search bar. Choose a status — All, In Progress, Completed, or Not Started — to narrow down the workspace cards shown.",
      },
      {
        q: "Why does my workspace show 'Not Started'?",
        a: "A workspace is marked 'Not Started' when its overall task progress is 0%. Start adding and completing tasks to move it to 'In Progress'.",
      },
    ],
  },
  {
    category: "Tasks",
    icon: CheckSquare,
    color: "#F97316",
    bg: "#FEF3C7",
    items: [
      {
        q: "How do I create a new task?",
        a: "Inside a workspace, tap 'Tasks' in the bottom navigation, then tap the + button in the top-right. Fill in the task title, description, priority, status, due date, and assignee, then tap 'Create Task'.",
      },
      {
        q: "How do I edit or update a task?",
        a: "Tap any task card in the Task Board. The Edit Task screen opens pre-filled with the current details. Make your changes and tap 'Save Changes'.",
      },
      {
        q: "How do I change a task's status?",
        a: "Open the task by tapping its card. On the Edit Task screen, tap the Status dropdown and choose To Do, In Progress, or Done. Save to apply the change immediately.",
      },
      {
        q: "What do the priority levels mean?",
        a: "High (red) = urgent, must be done soon. Medium (yellow) = important but not critical. Low (blue) = can be done when time permits. Use the filter chips to view tasks by priority.",
      },
      {
        q: "How do I filter tasks by priority or assignee?",
        a: "On the Task Board, use the filter chips at the top: All, Low Priority, Medium Priority, High Priority, or My Tasks. Tapping a chip instantly filters the list.",
      },
      {
        q: "What does 'View All' do in each task section?",
        a: "Tapping 'View All' next to a section header (To Do, In Progress, Done) opens a full-screen view of all tasks with that status, making it easier to browse when there are many tasks.",
      },
      {
        q: "Why can't I create a task without a date?",
        a: "A due date is required to keep tasks trackable and to trigger deadline reminders. Tap the date field, select a future date using the date picker, then tap 'Confirm Date'.",
      },
    ],
  },
  {
    category: "Group Chat",
    icon: MessageCircle,
    color: "#DB2777",
    bg: "#FCE7F3",
    items: [
      {
        q: "How do I send a message?",
        a: "Open a workspace and tap 'Chat' in the bottom navigation. Type your message in the input bar at the bottom and press Send (→) or hit Enter.",
      },
      {
        q: "How do I send an emoji?",
        a: "Tap the smiley face (😊) icon on the left of the input bar. An emoji picker opens with four categories — Smileys, Gestures, Objects, and Nature. Tap any emoji to insert it into your message.",
      },
      {
        q: "How do I attach a file or image?",
        a: "Tap the paperclip (📎) icon next to the message input. Select one or more files from your device. Images appear as photo previews; other files show as named file cards in the chat.",
      },
      {
        q: "How do I send a voice message?",
        a: "When the text input is empty, tap the microphone (🎙) icon. A recording overlay appears with a live timer and waveform. Tap Send to share the recording, or the trash icon to discard it.",
      },
      {
        q: "How do I search for a message?",
        a: "Tap the search icon (🔍) in the top-right of the chat header. Type a keyword — matching messages are highlighted in yellow and a result count appears. Tap 'Cancel' to dismiss the search.",
      },
      {
        q: "How do I see who is in the group?",
        a: "Tap the people icon (👥) in the top-right of the chat header. A panel slides up showing all members split into Online and Offline groups, with their name, role, and presence dot.",
      },
    ],
  },
  {
    category: "Files",
    icon: FileText,
    color: "#16A34A",
    bg: "#DCFCE7",
    items: [
      {
        q: "How do I upload a file?",
        a: "Inside a workspace, go to Files and tap the three-dot (⋮) menu in the header, or tap the dashed 'Upload File' card in the grid. Choose one or more files from your device — they appear instantly.",
      },
      {
        q: "What file types does CollabHive support?",
        a: "CollabHive supports PDFs, Word documents (.doc, .docx), Excel spreadsheets (.xls, .xlsx), PowerPoint presentations (.ppt, .pptx), and images (.png, .jpg, .jpeg, .gif, .webp, .svg).",
      },
      {
        q: "How do I rename a file?",
        a: "Tap the three-dot (⋮) menu on any file card and select 'Rename'. An inline text input appears — type the new name and tap the checkmark to save.",
      },
      {
        q: "How do I delete a file?",
        a: "Tap the three-dot (⋮) menu on the file card and select 'Delete'. The file is removed immediately and a confirmation toast appears at the bottom.",
      },
      {
        q: "How do I search for a file?",
        a: "Use the search bar at the top of the Files screen. Type any part of the file name and the grid filters in real time. Tap the × to clear the search.",
      },
    ],
  },
  {
    category: "Meetings",
    icon: Calendar,
    color: "#0891B2",
    bg: "#CFFAFE",
    items: [
      {
        q: "How do I schedule a new meeting?",
        a: "In a workspace, go to Meetings and tap the + button. Enter the meeting agenda, add at least two time slot options (each with a date and time range), set the poll length, and tap 'Create Meeting'.",
      },
      {
        q: "How do I vote on a meeting time?",
        a: "On the Meeting Scheduler screen, find the meeting poll, tap your preferred time slot to select it, then tap 'Submit Vote'. The button turns green and the participation count updates immediately.",
      },
      {
        q: "Can I change my vote after submitting?",
        a: "No. Once you tap 'Submit Vote', your vote is locked to prevent duplicate voting. If you need to change it, contact the meeting organiser to reset the poll.",
      },
      {
        q: "What does the 'Popular' badge on a time slot mean?",
        a: "The 'Popular' badge (green) appears on the slot with the most votes so far, helping you pick a time that works for the majority of the team.",
      },
      {
        q: "Why does my newly created meeting appear with 'NEW' label?",
        a: "The 'NEW' badge appears on any meeting poll that has 0 votes so far. It disappears once the first team member casts a vote.",
      },
      {
        q: "How do I set the date and time for a meeting slot?",
        a: "Tap 'Select date' to open the inline date picker (Month / Day / Year dropdowns — past dates are disabled). Then tap 'Select time range' to pick a start and end time. Confirm each with the blue button.",
      },
    ],
  },
  {
    category: "Notifications",
    icon: Bell,
    color: "#D97706",
    bg: "#FEF3C7",
    items: [
      {
        q: "What types of notifications will I receive?",
        a: "CollabHive sends notifications for: upcoming deadlines, meeting reminders, new task assignments, overdue tasks, new members joining, new votes on meetings, and comments on your tasks.",
      },
      {
        q: "How do I view all my notifications?",
        a: "Tap the bell icon in the Dashboard header. The panel shows your 4 most recent alerts. Tap 'View All Notifications' to see the full list of all notifications.",
      },
      {
        q: "How do I dismiss a notification?",
        a: "In the notification panel, tap the trash icon on the right side of any notification row. It's removed immediately from both the preview and the full list.",
      },
      {
        q: "How do I mark notifications as read?",
        a: "Tap any notification row to mark it as read (the blue dot disappears and the title returns to normal weight). Tap 'Mark all read' in the header to clear all unread indicators at once.",
      },
      {
        q: "Why does the bell icon have a red dot?",
        a: "The red dot indicates you have unread notifications. It disappears once all notifications are marked as read or dismissed.",
      },
    ],
  },
  {
    category: "Profile & Account",
    icon: User,
    color: "#6B7280",
    bg: "#F3F4F6",
    items: [
      {
        q: "How do I edit my profile?",
        a: "Tap the hamburger menu (☰) on the Dashboard to open the sidebar. Tap 'Edit Profile' to update your name, email, profile photo, and role.",
      },
      {
        q: "How do I change my password?",
        a: "Go to the sidebar → Settings → Account Security → Change Password. Enter your current password, then your new password twice to confirm.",
      },
      {
        q: "How do I sign out?",
        a: "Open the sidebar by tapping the hamburger menu (☰). Scroll to the bottom and tap the red 'Sign Out' button.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings → Account → Delete Account. You'll be asked to confirm with your password. Note: this permanently deletes all your data and cannot be undone.",
      },
    ],
  },
  {
    category: "Technical Issues",
    icon: Wifi,
    color: "#EF4444",
    bg: "#FEE2E2",
    items: [
      {
        q: "The app is not loading. What should I do?",
        a: "Check your internet connection first. If connected, try force-closing the app and reopening it. If the issue persists, clear the app cache in your device settings or reinstall the app.",
      },
      {
        q: "My changes are not saving. What's wrong?",
        a: "This usually happens with a weak internet connection. Make sure you're online, then try again. If offline, some changes are queued and will sync automatically when you reconnect.",
      },
      {
        q: "I'm not receiving notifications. How do I fix this?",
        a: "Go to your device Settings → Notifications → CollabHive and make sure notifications are enabled. Also check that Do Not Disturb mode is not active.",
      },
      {
        q: "The date picker is not working. What should I do?",
        a: "CollabHive uses a custom inline date picker (not the native OS picker) for compatibility. Tap the date row to expand it, adjust Month / Day / Year using the dropdowns, and tap 'Confirm Date'.",
      },
      {
        q: "I uploaded a file but it's not showing. Why?",
        a: "Files appear immediately after upload. If one is missing, check your internet connection and try uploading again. Make sure the file is not larger than 50 MB.",
      },
      {
        q: "How do I report a bug or send feedback?",
        a: "Open the sidebar → Settings → Help & Feedback → Report a Bug. Describe the issue and attach a screenshot if possible. Our team responds within 24 hours.",
      },
    ],
  },
];

export function FAQ() {
  const navigate = useNavigate();
  const [searchQuery,  setSearchQuery]  = useState("");
  const [openItem,     setOpenItem]     = useState<string | null>(null);
  const [openCategory, setOpenCategory] = useState<string | null>(FAQ_DATA[0].category);

  const filtered = FAQ_DATA.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        !searchQuery.trim() ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((s) => s.items.length > 0);

  const totalResults = filtered.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <PhoneFrame indicatorBg="#F5F5F5">
      {/* Header */}
      <div
        className="bg-white flex-shrink-0 flex items-center gap-3 px-5 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}
      >
        <button onClick={() => navigate("/settings")} className="p-1">
          <ArrowLeft size={22} strokeWidth={2} color="#374151" />
        </button>
        <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>Help & FAQ</span>
      </div>

      {/* Hero */}
      <div
        style={{
          background: "linear-gradient(135deg,#1E3A5F,#2563EB)",
          padding: "20px 20px 24px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <HelpCircle size={20} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "white" }}>How can we help?</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Browse answers to common questions</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 12, padding: "10px 14px" }}>
          <Search size={16} color="#9CA3AF" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#111827", background: "transparent" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}><X size={14} color="#9CA3AF" /></button>
          )}
        </div>

        {searchQuery && (
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 8 }}>
            {totalResults} result{totalResults !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ background: "#F5F5F5" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 24px" }}>
            <HelpCircle size={40} color="#D1D5DB" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: "#374151" }}>No results found</p>
            <p style={{ fontSize: 13, color: "#9CA3AF", marginTop: 6 }}>
              Try different keywords or browse the categories below
            </p>
            <button
              onClick={() => setSearchQuery("")}
              style={{ marginTop: 14, padding: "8px 20px", borderRadius: 20, border: "none", cursor: "pointer", background: "#2563EB", color: "white", fontSize: 13, fontWeight: 600 }}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div style={{ padding: "12px 16px 24px" }}>
            {filtered.map((section) => {
              const Icon      = section.icon;
              const isCatOpen = openCategory === section.category || !!searchQuery;

              return (
                <div key={section.category} style={{ marginBottom: 12 }}>
                  {/* Category header */}
                  <button
                    onClick={() => setOpenCategory(isCatOpen && !searchQuery ? null : section.category)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 14, border: "none", cursor: "pointer",
                      background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: isCatOpen ? 8 : 0,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: section.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={17} color={section.color} />
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{section.category}</p>
                        <p style={{ fontSize: 11, color: "#9CA3AF" }}>{section.items.length} questions</p>
                      </div>
                    </div>
                    <ChevronDown
                      size={16} color="#9CA3AF"
                      style={{ transform: isCatOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}
                    />
                  </button>

                  {/* Q&A items */}
                  <AnimatePresence>
                    {isCatOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ background: "white", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                          {section.items.map((item, i) => {
                            const key     = `${section.category}-${i}`;
                            const isOpen  = openItem === key;

                            return (
                              <div key={key} style={{ borderBottom: i < section.items.length - 1 ? "1px solid #F9FAFB" : "none" }}>
                                {/* Question */}
                                <button
                                  onClick={() => setOpenItem(isOpen ? null : key)}
                                  style={{
                                    width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                                    padding: "13px 14px", border: "none", cursor: "pointer",
                                    background: isOpen ? "#FAFBFF" : "white", gap: 10, textAlign: "left",
                                  }}
                                >
                                  <p style={{ fontSize: 13, fontWeight: isOpen ? 700 : 500, color: isOpen ? "#2563EB" : "#111827", flex: 1, lineHeight: 1.4 }}>
                                    {item.q}
                                  </p>
                                  <ChevronDown
                                    size={15} color={isOpen ? "#2563EB" : "#9CA3AF"}
                                    style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginTop: 2 }}
                                  />
                                </button>

                                {/* Answer */}
                                <AnimatePresence>
                                  {isOpen && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      style={{ overflow: "hidden" }}
                                    >
                                      <div style={{ padding: "0 14px 14px", background: "#FAFBFF" }}>
                                        <div style={{ width: 28, height: 2, background: "#2563EB", borderRadius: 1, marginBottom: 8 }} />
                                        <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.6 }}>
                                          {item.a}
                                        </p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Footer */}
            <div style={{ marginTop: 8, padding: "16px", background: "white", borderRadius: 16, textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>Still need help?</p>
              <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>Our support team is here for you</p>
              <button style={{ padding: "9px 24px", borderRadius: 20, border: "none", cursor: "pointer", background: "#2563EB", color: "white", fontSize: 13, fontWeight: 600 }}>
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
