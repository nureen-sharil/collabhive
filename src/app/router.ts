/**
 * Minimal custom router — no React context, no react-router.
 * Uses module-level singletons + useState/useEffect subscriptions.
 * Compatible with Figma Make's preview environment.
 */
import { useState, useEffect } from "react";

// ─── state ────────────────────────────────────────────────────────────────────
let _path   = "/login";
let _params : Record<string, string> = {};
const _listeners = new Set<() => void>();
function _notify() { _listeners.forEach((l) => l()); }

// ─── internal: set by App during render ───────────────────────────────────────
export function _setParams(params: Record<string, string>) {
  _params = params;
}
export function _getCurrentPath() { return _path; }

// ─── public navigate ──────────────────────────────────────────────────────────
export function navigate(to: string) {
  _path = to;
  _params = {};
  _notify();
}

// ─── hooks ────────────────────────────────────────────────────────────────────
export function useNavigate() {
  return navigate;
}

export function usePath(): string {
  const [p, setP] = useState(_path);
  useEffect(() => {
    const l = () => setP(_path);
    _listeners.add(l);
    return () => { _listeners.delete(l); };
  }, []);
  return p;
}

export function useParams(): Record<string, string> {
  // Re-reads _params on every render triggered by navigate.
  // Because App sets _params synchronously before rendering children,
  // this always returns the correct params for the current route.
  const [, bump] = useState(0);
  useEffect(() => {
    const l = () => bump((n) => n + 1);
    _listeners.add(l);
    return () => { _listeners.delete(l); };
  }, []);
  return _params;
}

// ─── pattern matching ─────────────────────────────────────────────────────────
export function matchPath(
  pattern: string,
  path: string
): Record<string, string> | null {
  const pp = pattern.split("/");
  const cp = path.split("/");
  if (pp.length !== cp.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) {
      params[pp[i].slice(1)] = decodeURIComponent(cp[i] ?? "");
    } else if (pp[i] !== cp[i]) {
      return null;
    }
  }
  return params;
}
