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
  } catch {
    /* storage unavailable — prototype continues in memory */
  }
}

function remove(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
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
