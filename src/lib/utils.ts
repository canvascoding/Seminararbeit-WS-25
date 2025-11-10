import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SlotBucket = "now" | "soon" | "later";

export function getSlotBucket(startAt: Date): SlotBucket {
  const now = Date.now();
  const start = startAt.getTime();
  const diff = start - now;

  if (diff < 5 * 60 * 1000) return "now";
  if (diff < 20 * 60 * 1000) return "soon";
  return "later";
}

export function formatDuration(minutes: number) {
  return `${minutes} Min`;
}

export function safeDate(value: string | Date) {
  return typeof value === "string" ? new Date(value) : value;
}
