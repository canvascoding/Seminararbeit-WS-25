export type IntentKey =
  | "smalltalk"
  | "coStudy"
  | "walkTalk"
  | "coffeeBreak";

export interface Venue {
  id: string;
  name: string;
  address: string;
  geo: { lat: number; lng: number };
  partnerId: string;
  meetPoints: { id: string; label: string; description: string }[];
  tips?: string[];
}

export interface Slot {
  id: string;
  venueId: string;
  intent: IntentKey;
  startAt: string;
  durationMinutes: number;
  capacity: number;
  status: "open" | "closed" | "paused";
  meetPointId: string;
  restSeats?: number;
}

export interface Loop {
  id: string;
  slotId: string;
  venueId: string;
  participants: string[];
  meetPoint: { label: string; description: string };
  startAt: string;
  status: "scheduled" | "inProgress" | "done";
}

export interface SlotAttendee {
  slotId: string;
  userId: string;
  joinedAt: string;
  status: "pending" | "matched" | "canceled";
}

export interface IncidentReport {
  loopId: string;
  type: "safety" | "noShow" | "other";
  description: string;
}

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  university: string;
  studyField: string;
  mutedUntil?: string;
  role?: "partner" | "admin";
  createdAt?: string;
  updatedAt?: string;
}
