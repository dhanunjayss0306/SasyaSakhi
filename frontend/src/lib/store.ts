import { useSyncExternalStore } from "react";
import type { SoilReport } from "@/types/soil";
import type { MockUser } from "./mock-auth";

/**
 * Tiny localStorage-backed session store for the prototype. No backend.
 * Method-based API (the React hooks lint treats imported bindings as immutable,
 * so all writes go through explicit setter functions).
 */
const REPORT_KEY = "soilsaathi.report";
const USER_KEY = "soilsaathi.user";
const LANG_KEY = "soilsaathi.lang";

export type Lang = "en" | "te";

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    emit();
  } catch {
    /* storage unavailable — prototype continues in memory */
  }
}

function remove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
    emit();
  } catch {
    /* ignore */
  }
}

export const store = {
  getReport(): SoilReport | null {
    return read<SoilReport>(REPORT_KEY);
  },
  setReport(r: SoilReport | null) {
    write(REPORT_KEY, r);
  },
  getUser(): MockUser | null {
    return read<MockUser>(USER_KEY);
  },
  setUser(u: MockUser | null) {
    write(USER_KEY, u);
  },
  getLang(): Lang {
    return read<Lang>(LANG_KEY) ?? "en";
  },
  setLang(l: Lang) {
    write(LANG_KEY, l);
  },
  clear() {
    remove(USER_KEY);
  },
};

/* ---------------------------------------------------------------------------
 * Hydration-safe reads.
 *
 * Problem: `store.getReport()` / `getUser()` / `getLang()` return null (or
 * "en") on the server but the stored value on the client's first render, so
 * any component that read them during render produced a React hydration
 * mismatch whenever a value was stored (logged-in user, saved report, Telugu).
 * useSyncExternalStore is the supported fix: React renders with the server
 * snapshot during hydration, then re-renders with the client snapshot —
 * without a hydration error. getSnapshot must return the same reference
 * while the stored value is unchanged, so object snapshots are cached
 * against the raw localStorage string. Same-tab writes notify subscribers
 * via emit(); cross-tab writes arrive via the "storage" event.
 * ------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

let storageListening = false;
function subscribe(onChange: () => void) {
  if (typeof window !== "undefined" && !storageListening) {
    storageListening = true;
    window.addEventListener("storage", () => emit());
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

let reportRaw: string | null | undefined;
let reportCache: SoilReport | null = null;
function getReportSnapshot(): SoilReport | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(REPORT_KEY);
  if (raw !== reportRaw) {
    reportRaw = raw;
    try {
      reportCache = raw ? (JSON.parse(raw) as SoilReport) : null;
    } catch {
      reportCache = null;
    }
  }
  return reportCache;
}

let userRaw: string | null | undefined;
let userCache: MockUser | null = null;
function getUserSnapshot(): MockUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (raw !== userRaw) {
    userRaw = raw;
    try {
      userCache = raw ? (JSON.parse(raw) as MockUser) : null;
    } catch {
      userCache = null;
    }
  }
  return userCache;
}

function getLangSnapshot(): Lang {
  if (typeof window === "undefined") return "en";
  return read<Lang>(LANG_KEY) ?? "en";
}

export function useStoredReport(): SoilReport | null {
  return useSyncExternalStore(subscribe, getReportSnapshot, () => null);
}

export function useStoredUser(): MockUser | null {
  return useSyncExternalStore(subscribe, getUserSnapshot, () => null);
}

export function useStoredLang(): Lang {
  return useSyncExternalStore(subscribe, getLangSnapshot, () => "en");
}
