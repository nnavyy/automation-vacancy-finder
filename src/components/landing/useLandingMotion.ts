"use client";

import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: no-preference)";

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(query);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function readPreference() {
  return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
}

export function useLandingMotion() {
  return useSyncExternalStore(subscribe, readPreference, () => false);
}
