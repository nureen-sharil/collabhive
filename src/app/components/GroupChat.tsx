import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useParams } from "../router";
import {
  ArrowLeft, Users, Search, Smile, Paperclip, Mic,
  Send, Pin, X, MicOff, FileText, ImageIcon, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "../motion-compat";
import { PhoneFrame } from "./PhoneFrame";

// ─── types ────────────────────────────────────────────────────────────────────
interface Attachment { type: "image" | "file"; name: string; url?: string }

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isOwn: boolean;
  read: boolean;
  attachment?: Attachment;
  voice?: { duration: string };
}

// ─── constants ────────────────────────────────────────────────────────────────
const AVATAR_COLORS: Record<string, string> = {
  Natasha: "#7C3AED", Fiona: "#DB2777", Marcus: "#EA580C",
  Leila: "#0891B2",   You: "#2563EB",
};

const MEMBERS = [
  { name: "Natasha", role: "Project Lead",  color: "#7C3AED", online: true  },
  { name: "Fiona",   role: "UI Designer",   color: "#DB2777", online: true  },
  { name: "Marcus",  role: "Backend Dev",   color: "#EA580C", online: false },
  { name: "Leila",   role: "QA Engineer",   color: "#0891B2", online: true  },
  { name: "You",     role: "Frontend Dev",  color: "#2563EB", online: true  },
  { name: "Ahmed",   role: "Scrum Master",  color: "#16A34A", online: false },
  { name: "Sara",    role: "Data Analyst",  color: "#D97706", online: false },
  { name: "Tom",     role: "DevOps",        color: "#6B7280", online: false },
];

const EMOJI_CATEGORIES = [
  { label: "Smileys", emojis: ["😀","😂","😍","🥰","😎","🤩","😢","😡","🥺","😴","🤔","😇","🙃","😏","🤗","😬","😱","🤯","🥳","😤"] },
  { label: "Gestures", emojis: ["👍","👎","👏","🙌","🤝","✌️","🤞","👌","🤙","💪","🙏","👋","🤚","✋","🖐️","👆","👇","👉","👈","☝️"] },
  { label: "Objects",  emojis: ["💻","📱","📷","🎵","🎉","🔥","⭐","💡","📌","📎","🔗","✅","❌","⚠️","💬","📧","🗂️","📋","🏆","🎯"] },
  { label: "Nature",   emojis: ["🌟","🌈","☀️","🌙","⚡","🌊","🍀","🌸","🌺","🦋","🐱","🐶","🦊","🐧","🦁","🌍","🌴","🍁","❄️","🌻"] },
];

const INITIAL_MESSAGES: Message[] = [
  { id: "1", sender: "Natasha", text: "Hey team! Has everyone reviewed the latest design mockups?",            time: "9:30 AM", isOwn: false, read: true  },
  { id: "2", sender: "You",     text: "Yes, I reviewed them. Looking great! Just a few minor adjustments needed.", time: "9:35 AM", isOwn: true,  read: true  },
  { id: "3", sender: "Fiona",   text: "I agree. The color scheme works well. Should we schedule a call?",     time: "9:40 AM", isOwn: false, read: true  },
  { id: "4", sender: "You",     text: "Sure! How about tomorrow at 2 PM?",                                    time: "9:42 AM", isOwn: true,  read: true  },
  { id: "5", sender: "Natasha", text: "Works for me! I'll send out a calendar invite.",                       time: "9:45 AM", isOwn: false, read: true  },
  { id: "6", sender: "Fiona",   text: "Perfect! See you all then 👍",                                         time: "9:46 AM", isOwn: false, read: false },
];

// ─── helpers ──────────────────────────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Members Panel ────────────────────────────────────────────────────────────
function MembersPanel({ onClose }: { onClose: () => void }) {
  const online  = MEMBERS.filter((m) => m.online);
  const offline = MEMBERS.filter((m) => !m.online);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position:"absolute",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(2px)",zIndex:50,borderRadius:52,overflow:"hidden",display:"flex",flexDirection:"column",justifyContent:"flex-end" }}>
      <motion.div initial={{ y:80,opacity:0 }} animate={{ y:0,opacity:1 }} exit={{ y:80,opacity:0 }}
        transition={{ type:"spring",damping:26,stiffness:320 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background:"white",borderRadius:"20px 20px 0 0",overflow:"hidden",maxHeight:"70%" }}>
        <div style={{ display:"flex",justifyContent:"center",padding:"10px 0 0" }}>
          <div style={{ width:40,height:4,borderRadius:2,background:"#E5E7EB" }} />
        </div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px 12px" }}>
          <p style={{ fontSize:15,fontWeight:700,color:"#111827" }}>Group Members ({MEMBERS.length})</p>
          <button onClick={onClose} style={{ width:28,height:28,borderRadius:"50%",background:"#F3F4F6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <X size={14} color="#6B7280" />
          </button>
        </div>
        <div style={{ overflowY:"auto",maxHeight:380,paddingBottom:16 }}>
          <p style={{ fontSize:11,fontWeight:700,color:"#9CA3AF",padding:"4px 16px 8px",letterSpacing:0.5 }}>ONLINE — {online.length}</p>
          {online.map((m) => (
            <div key={m.name} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 16px" }}>
              <div style={{ position:"relative" }}>
                <div style={{ width:40,height:40,borderRadius:"50%",background:m.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700 }}>{m.name.charAt(0)}</div>
                <div style={{ position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:"#22C55E",border:"2px solid white" }} />
              </div>
              <div><p style={{ fontSize:14,fontWeight:600,color:"#111827" }}>{m.name}</p><p style={{ fontSize:12,color:"#6B7280" }}>{m.role}</p></div>
            </div>
          ))}
          <p style={{ fontSize:11,fontWeight:700,color:"#9CA3AF",padding:"12px 16px 8px",letterSpacing:0.5 }}>OFFLINE — {offline.length}</p>
          {offline.map((m) => (
            <div key={m.name} style={{ display:"flex",alignItems:"center",gap:12,padding:"8px 16px",opacity:0.65 }}>
              <div style={{ position:"relative" }}>
                <div style={{ width:40,height:40,borderRadius:"50%",background:m.color,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700 }}>{m.name.charAt(0)}</div>
                <div style={{ position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:"#D1D5DB",border:"2px solid white" }} />
              </div>
              <div><p style={{ fontSize:14,fontWeight:600,color:"#111827" }}>{m.name}</p><p style={{ fontSize:12,color:"#6B7280" }}>{m.role}</p></div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) {
  const [tab, setTab] = useState(0);
  return (
    <motion.div initial={{ y:20,opacity:0 }} animate={{ y:0,opacity:1 }} exit={{ y:20,opacity:0 }}
      transition={{ type:"spring",damping:24,stiffness:300 }}
      style={{ position:"absolute",bottom:70,left:8,right:8,background:"white",borderRadius:20,boxShadow:"0 -4px 32px rgba(0,0,0,0.15)",zIndex:40,overflow:"hidden" }}>
      {/* Tab bar */}
      <div style={{ display:"flex",borderBottom:"1px solid #F3F4F6" }}>
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flex:1,padding:"10px 0",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,
            color: tab===i ? "#2563EB" : "#9CA3AF",
            background:"white",
            borderBottom: tab===i ? "2px solid #2563EB" : "2px solid transparent",
          }}>
            {cat.label}
          </button>
        ))}
        <button onClick={onClose} style={{ padding:"10px 12px",border:"none",background:"white",cursor:"pointer" }}>
          <X size={16} color="#9CA3AF" />
        </button>
      </div>
      {/* Emoji grid */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:2,padding:"8px 10px 12px",maxHeight:180,overflowY:"auto" }}>
        {EMOJI_CATEGORIES[tab].emojis.map((emoji) => (
          <button key={emoji} onClick={() => onSelect(emoji)}
            style={{ fontSize:22,padding:"6px 0",background:"none",border:"none",cursor:"pointer",borderRadius:8,lineHeight:1 }}
            className="hover:bg-gray-100">
            {emoji}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Voice Recording Overlay ──────────────────────────────────────────────────
function VoiceRecorder({ onSend, onCancel }: { onSend: (duration: string) => void; onCancel: () => void }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  return (
    <motion.div initial={{ y:40,opacity:0 }} animate={{ y:0,opacity:1 }} exit={{ y:40,opacity:0 }}
      transition={{ type:"spring",damping:24,stiffness:300 }}
      style={{ position:"absolute",bottom:0,left:0,right:0,background:"white",borderRadius:"20px 20px 0 0",padding:"20px 20px 32px",boxShadow:"0 -8px 32px rgba(0,0,0,0.12)",zIndex:40,display:"flex",flexDirection:"column",alignItems:"center",gap:16 }}>

      {/* Pulsing mic */}
      <div style={{ position:"relative",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <motion.div animate={{ scale:[1,1.35,1],opacity:[0.3,0,0.3] }} transition={{ repeat:Infinity,duration:1.4,ease:"easeInOut" }}
          style={{ position:"absolute",width:72,height:72,borderRadius:"50%",background:"#EF4444" }} />
        <motion.div animate={{ scale:[1,1.2,1],opacity:[0.5,0,0.5] }} transition={{ repeat:Infinity,duration:1.4,ease:"easeInOut",delay:0.15 }}
          style={{ position:"absolute",width:60,height:60,borderRadius:"50%",background:"#EF4444" }} />
        <div style={{ width:52,height:52,borderRadius:"50%",background:"#EF4444",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1 }}>
          <Mic size={24} color="white" />
        </div>
      </div>

      <p style={{ fontSize:13,fontWeight:600,color:"#374151" }}>Recording…</p>
      <p style={{ fontSize:22,fontWeight:700,color:"#EF4444",fontVariantNumeric:"tabular-nums" }}>{fmt(secs)}</p>

      {/* Waveform animation */}
      <div style={{ display:"flex",alignItems:"center",gap:3,height:32 }}>
        {Array.from({length:18}).map((_,i) => (
          <motion.div key={i}
            animate={{ scaleY:[0.3,1,0.3] }}
            transition={{ repeat:Infinity,duration:0.8,delay:i*0.06,ease:"easeInOut" }}
            style={{ width:3,height:24,borderRadius:2,background:"#EF4444",opacity:0.7,transformOrigin:"center" }} />
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:"flex",gap:24,alignItems:"center" }}>
        <button onClick={onCancel}
          style={{ width:48,height:48,borderRadius:"50%",background:"#FEE2E2",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <Trash2 size={20} color="#EF4444" />
        </button>
        <button onClick={() => onSend(fmt(secs))}
          style={{ width:56,height:56,borderRadius:"50%",background:"#2563EB",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 14px rgba(37,99,235,0.4)" }}>
          <Send size={22} color="white" />
        </button>
        <button onClick={onCancel}
          style={{ width:48,height:48,borderRadius:"50%",background:"#F3F4F6",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
          <MicOff size={20} color="#6B7280" />
        </button>
      </div>
      <p style={{ fontSize:11,color:"#9CA3AF" }}>Tap send to share · trash to discard · stop to cancel</p>
    </motion.div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, searchQuery }: { msg: Message; searchQuery: string }) {
  const own = msg.isOwn;

  const highlight = (text: string) => {
    if (!searchQuery.trim()) return <>{text}</>;
    const q = searchQuery.trim();
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return <>{text.slice(0,idx)}<mark style={{ background:"#FEF08A",borderRadius:2,padding:"0 1px" }}>{text.slice(idx,idx+q.length)}</mark>{text.slice(idx+q.length)}</>;
  };

  return (
    <div style={{ display:"flex",flexDirection:own?"row-reverse":"row",gap:10,alignItems:"flex-end" }}>
      {!own && (
        <div style={{ width:32,height:32,borderRadius:"50%",background:AVATAR_COLORS[msg.sender]??"#6B7280",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0 }}>
          {msg.sender.charAt(0)}
        </div>
      )}
      <div style={{ display:"flex",flexDirection:"column",alignItems:own?"flex-end":"flex-start",maxWidth:"75%" }}>
        {!own && <span style={{ fontSize:11,color:"#6B7280",marginBottom:4,paddingLeft:4 }}>{msg.sender}</span>}

        {/* Voice message */}
        {msg.voice && (
          <div style={{ borderRadius:own?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",background:own?"#2563EB":"white",boxShadow:own?"none":"0 1px 3px rgba(0,0,0,0.08)",display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:32,height:32,borderRadius:"50%",background:own?"rgba(255,255,255,0.25)":"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <Mic size={15} color={own?"white":"#2563EB"} />
            </div>
            <div>
              <div style={{ display:"flex",gap:2,alignItems:"center",marginBottom:3 }}>
                {Array.from({length:14}).map((_,i)=>(
                  <div key={i} style={{ width:2,height:Math.random()*12+4,borderRadius:1,background:own?"rgba(255,255,255,0.7)":"#93C5FD" }} />
                ))}
              </div>
              <p style={{ fontSize:11,color:own?"rgba(255,255,255,0.75)":"#6B7280" }}>{msg.voice.duration}</p>
            </div>
          </div>
        )}

        {/* Attachment */}
        {msg.attachment && (
          <div style={{ borderRadius:own?"18px 18px 4px 18px":"18px 18px 18px 4px",overflow:"hidden",maxWidth:180,boxShadow:"0 1px 4px rgba(0,0,0,0.1)" }}>
            {msg.attachment.type === "image" && msg.attachment.url ? (
              <img src={msg.attachment.url} alt={msg.attachment.name} style={{ width:"100%",display:"block",objectFit:"cover",maxHeight:160 }} />
            ) : (
              <div style={{ padding:"12px 14px",background:own?"#2563EB":"white",display:"flex",alignItems:"center",gap:10 }}>
                <div style={{ width:36,height:36,borderRadius:10,background:own?"rgba(255,255,255,0.2)":"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                  <FileText size={18} color={own?"white":"#2563EB"} />
                </div>
                <div>
                  <p style={{ fontSize:12,fontWeight:600,color:own?"white":"#111827",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:100 }}>{msg.attachment.name}</p>
                  <p style={{ fontSize:11,color:own?"rgba(255,255,255,0.7)":"#6B7280" }}>File</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text */}
        {msg.text && (
          <div style={{ borderRadius:own?"18px 18px 4px 18px":"18px 18px 18px 4px",padding:"10px 14px",background:own?"#2563EB":"white",color:own?"white":"#111827",boxShadow:own?"none":"0 1px 3px rgba(0,0,0,0.08)" }}>
            <p style={{ fontSize:13,lineHeight:1.45 }}>{highlight(msg.text)}</p>
          </div>
        )}

        <div style={{ display:"flex",alignItems:"center",gap:4,marginTop:4,paddingLeft:4,paddingRight:4 }}>
          <span style={{ fontSize:10,color:"#9CA3AF" }}>{msg.time}</span>
          {own && <div style={{ width:12,height:12,borderRadius:"50%",background:msg.read?"#2563EB":"transparent",border:`2px solid ${msg.read?"#2563EB":"#9CA3AF"}` }} />}
        </div>
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export function GroupChat() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [messages,     setMessages]     = useState<Message[]>(INITIAL_MESSAGES);
  const [messageInput, setMessageInput] = useState("");
  const [showMembers,  setShowMembers]  = useState(false);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [showEmoji,    setShowEmoji]    = useState(false);
  const [recording,    setRecording]    = useState(false);

  const filteredMessages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return q ? messages.filter((m) => m.text.toLowerCase().includes(q)) : messages;
  }, [messages, searchQuery]);

  const pushMessage = (patch: Partial<Message>) => {
    setMessages((prev) => [...prev, {
      id: Date.now().toString(), sender: "You", text: "",
      time: nowTime(), isOwn: true, read: false, ...patch,
    }]);
  };

  const handleSend = () => {
    if (!messageInput.trim()) return;
    pushMessage({ text: messageInput.trim() });
    setMessageInput("");
    setShowEmoji(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput((prev) => prev + emoji);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const url = isImage ? URL.createObjectURL(file) : undefined;
      pushMessage({
        attachment: { type: isImage ? "image" : "file", name: file.name, url },
      });
    });
    e.target.value = "";
  };

  const handleVoiceSend = (duration: string) => {
    setRecording(false);
    pushMessage({ voice: { duration } });
  };

  return (
    <PhoneFrame indicatorBg="#ffffff">
      {/* Header */}
      <div className="bg-white flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid #F3F4F6" }}>
        {searchOpen ? (
          <div style={{ flex:1,display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ flex:1,display:"flex",alignItems:"center",gap:8,background:"#F3F4F6",borderRadius:20,padding:"7px 12px",border:searchQuery?"1.5px solid #2563EB":"1.5px solid transparent" }}>
              <Search size={14} color={searchQuery?"#2563EB":"#9CA3AF"} />
              <input autoFocus type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,color:"#111827" }} />
              {searchQuery && <button onClick={() => setSearchQuery("")}><X size={13} color="#9CA3AF" /></button>}
            </div>
            <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              style={{ fontSize:13,color:"#2563EB",fontWeight:500,background:"none",border:"none",cursor:"pointer",flexShrink:0 }}>
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(`/workspace/${id}`)} className="p-1">
                <ArrowLeft size={22} strokeWidth={2} color="#374151" />
              </button>
              <div>
                <p style={{ fontSize:16,fontWeight:600,color:"#111827",lineHeight:1.2 }}>Group Chat</p>
                <p style={{ fontSize:11,color:"#22C55E",fontWeight:500 }}>
                  {MEMBERS.filter((m) => m.online).length} members online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowMembers(true)} className="p-1.5 rounded-full hover:bg-gray-100">
                <Users size={19} strokeWidth={2} color="#374151" />
              </button>
              <button onClick={() => setSearchOpen(true)} className="p-1.5 rounded-full hover:bg-gray-100">
                <Search size={19} strokeWidth={2} color="#374151" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Pinned */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5"
        style={{ background:"#EFF6FF",borderBottom:"1px solid #DBEAFE" }}>
        <Pin size={13} color="#2563EB" style={{ flexShrink:0 }} />
        <p style={{ fontSize:12,color:"#1E40AF",flex:1 }}>
          Project deadline: June 20, 2026. All deliverables must be submitted by EOD.
        </p>
      </div>

      {/* Search result count */}
      {searchOpen && searchQuery && (
        <div style={{ background:"#FFFBEB",borderBottom:"1px solid #FEF3C7",padding:"6px 16px" }}>
          <p style={{ fontSize:12,color:"#B45309",fontWeight:500 }}>
            {filteredMessages.length} result{filteredMessages.length!==1?"s":""} for "{searchQuery}"
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3"
        style={{ background:"#F8FAFC",display:"flex",flexDirection:"column",gap:14 }}
        onClick={() => { if (showEmoji) setShowEmoji(false); }}>
        {filteredMessages.length===0 && searchQuery ? (
          <div style={{ textAlign:"center",paddingTop:40 }}>
            <Search size={32} color="#D1D5DB" style={{ margin:"0 auto 10px" }} />
            <p style={{ fontSize:14,fontWeight:600,color:"#374151" }}>No messages found</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <Bubble key={msg.id} msg={msg} searchQuery={searchQuery} />
          ))
        )}
      </div>

      {/* Emoji picker */}
      <AnimatePresence>
        {showEmoji && (
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
        )}
      </AnimatePresence>

      {/* Voice recorder */}
      <AnimatePresence>
        {recording && (
          <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setRecording(false)} />
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="bg-white flex-shrink-0 flex items-center gap-2 px-3 py-2.5"
        style={{ borderTop:"1px solid #F3F4F6" }}>

        {/* Emoji toggle */}
        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="p-1.5 rounded-full hover:bg-gray-100"
          style={{ background: showEmoji ? "#EFF6FF" : "transparent" }}
        >
          <Smile size={20} strokeWidth={2} color={showEmoji ? "#2563EB" : "#6B7280"} />
        </button>

        {/* Text input */}
        <div style={{ flex:1 }}>
          <input type="text" value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key==="Enter" && handleSend()}
            placeholder="Type your message here..."
            style={{ width:"100%",background:"#F3F4F6",borderRadius:24,padding:"9px 16px",fontSize:13,color:"#111827",border:"none",outline:"none" }}
          />
        </div>

        {/* Attachment */}
        <button
          onClick={() => fileRef.current?.click()}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <Paperclip size={18} strokeWidth={2} color="#6B7280" />
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          style={{ display:"none" }} onChange={handleFileChange} />

        {/* Mic / Send */}
        {messageInput.trim() ? (
          <button onClick={handleSend}
            style={{ width:36,height:36,borderRadius:"50%",background:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",flexShrink:0 }}>
            <Send size={16} color="white" />
          </button>
        ) : (
          <button
            onClick={() => { setShowEmoji(false); setRecording(true); }}
            style={{ width:36,height:36,borderRadius:"50%",background:recording?"#EF4444":"transparent",display:"flex",alignItems:"center",justifyContent:"center",border:"none",cursor:"pointer",flexShrink:0 }}
            className="hover:bg-gray-100"
          >
            <Mic size={18} strokeWidth={2} color={recording?"white":"#6B7280"} />
          </button>
        )}
      </div>

      {/* Members panel */}
      <AnimatePresence>
        {showMembers && <MembersPanel onClose={() => setShowMembers(false)} />}
      </AnimatePresence>
    </PhoneFrame>
  );
}
