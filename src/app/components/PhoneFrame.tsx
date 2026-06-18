import { ReactNode } from "react";
import { Wifi } from "lucide-react";

function StatusBar() {
  return (
    <div
      className="flex items-center justify-between px-5 bg-white flex-shrink-0"
      style={{ height: 44, paddingTop: 8, paddingBottom: 6 }}
    >
      {/* Clock */}
      <span
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#111827",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        9:41
      </span>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5">
        {/* Cellular signal bars */}
        <div className="flex items-end gap-px" style={{ height: 13 }}>
          {[5, 8, 11, 13].map((h, i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: h,
                borderRadius: 1.5,
                background: i < 3 ? "#111827" : "#D1D5DB",
              }}
            />
          ))}
        </div>
        {/* Wi-Fi */}
        <Wifi size={14} strokeWidth={2.5} color="#111827" />
        {/* Battery */}
        <div className="flex items-center">
          <div
            style={{
              width: 24,
              height: 12,
              borderRadius: 3,
              border: "1.5px solid #111827",
              padding: "1.5px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "75%",
                height: "100%",
                borderRadius: 1.5,
                background: "#111827",
              }}
            />
          </div>
          <div
            style={{
              width: 2,
              height: 5,
              borderRadius: 1,
              background: "#111827",
              marginLeft: 1.5,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function HomeIndicator({ bg = "#F5F5F5" }: { bg?: string }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{ height: 34, background: bg, paddingBottom: 6 }}
    >
      <div
        style={{
          width: 134,
          height: 5,
          borderRadius: 3,
          background: "#1a1a1a",
          opacity: 0.18,
        }}
      />
    </div>
  );
}

interface PhoneFrameProps {
  children: ReactNode;
  /** Background colour shown behind the device frame */
  outerBg?: string;
  /** Background colour of the home indicator strip */
  indicatorBg?: string;
  /** Override status bar background (defaults to white) */
  statusBarBg?: string;
}

export function PhoneFrame({
  children,
  outerBg = "#D1D5DB",
  indicatorBg = "#F5F5F5",
  statusBarBg = "#ffffff",
}: PhoneFrameProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: outerBg,
        padding: "24px 16px",
      }}
    >
      {/* Physical device shell */}
      <div
        style={{
          width: 393,
          height: 852,
          borderRadius: 52,
          background: "#ffffff",
          boxShadow:
            "0 0 0 2px #4B5563, 0 0 0 8px #1F2937, 0 0 0 10px #374151, 0 40px 100px rgba(0,0,0,0.55)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {/* Dynamic Island notch */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 34,
            borderRadius: 20,
            background: "#000",
            zIndex: 20,
          }}
        />

        {/* Status bar */}
        <div style={{ background: statusBarBg, flexShrink: 0 }}>
          <StatusBar />
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {children}
        </div>

        {/* Home indicator */}
        <HomeIndicator bg={indicatorBg} />
      </div>
    </div>
  );
}
