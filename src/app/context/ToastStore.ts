import { useState, useEffect } from "react";

interface Toast { id: number; message: string; type: "success" | "info" | "error" }

type Listener = () => void;
const _listeners = new Set<Listener>();
let _toast: Toast | null = null;
let _timer: ReturnType<typeof setTimeout> | null = null;

function _notify() { _listeners.forEach((l) => l()); }

export const toastStore = {
  show(message: string, type: Toast["type"] = "success", ms = 3200) {
    if (_timer) clearTimeout(_timer);
    _toast = { id: Date.now(), message, type };
    _notify();
    _timer = setTimeout(() => { _toast = null; _notify(); }, ms);
  },
  get: () => _toast,
};

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(_toast);
  useEffect(() => {
    const l = () => setToast(_toast ? { ..._toast } : null);
    _listeners.add(l);
    return () => { _listeners.delete(l); };
  }, []);
  return toast;
}
