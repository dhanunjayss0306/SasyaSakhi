"use client";

import { useSyncExternalStore } from "react";

function subscribeMedia(query: string) {
  return (onChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  };
}

function snapshotMedia(query: string) {
  return () => window.matchMedia(query).matches;
}

const emptySubscribe = (_onChange: () => void): (() => void) => {
  void _onChange;
  return () => {};
};
const falseSnapshot = () => false;

/** True when the user prefers reduced motion (respects OS setting). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    typeof window === "undefined" ? emptySubscribe : subscribeMedia("(prefers-reduced-motion: reduce)"),
    typeof window === "undefined" ? falseSnapshot : snapshotMedia("(prefers-reduced-motion: reduce)"),
    falseSnapshot
  );
}

/** True on touch-first / small screens where heavy effects should be skipped. */
export function useLowPowerEnvironment(): boolean {
  const coarse = useSyncExternalStore(
    typeof window === "undefined" ? emptySubscribe : subscribeMedia("(pointer: coarse)"),
    typeof window === "undefined" ? falseSnapshot : snapshotMedia("(pointer: coarse)"),
    falseSnapshot
  );
  const small = useSyncExternalStore(
    typeof window === "undefined" ? emptySubscribe : subscribeMedia("(max-width: 768px)"),
    typeof window === "undefined" ? falseSnapshot : snapshotMedia("(max-width: 768px)"),
    falseSnapshot
  );
  return coarse || small;
}

/** Skip expensive visual effects for reduced-motion users or touch/small screens. */
export function useSkipHeavyFx(): boolean {
  const reduced = useReducedMotion();
  const lowPower = useLowPowerEnvironment();
  return reduced || lowPower;
}
