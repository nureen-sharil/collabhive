import { ReactNode } from "react";

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
  indicatorBg: _indicatorBg = "#F5F5F5",
  statusBarBg: _statusBarBg = "#ffffff",
}: PhoneFrameProps) {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: outerBg,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}
