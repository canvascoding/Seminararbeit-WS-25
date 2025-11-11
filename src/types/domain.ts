export type IntentKey =
  | "smalltalk"
  | "coStudy"
  | "walkTalk"
  | "coffeeBreak";

export type VenueCategory = "mensa" | "library" | "campus" | "other";
export type VenueStatus = "draft" | "active" | "paused";

export interface VenueContact {
  name?: string;
  email?: string;
  phone?: string;
}

export interface VenuePhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface VenueMeetPoint {
  id: string;
  label: string;
  description: string;
  floor?: string;
  instructions?: string;
  capacityHint?: number;
  geoOffset?: { lat: number; lng: number };
}

export interface Venue {
  id: string;
  name: string;
  type?: VenueCategory;
  address: string;
  postalCode?: string;
  city?: string;
  googlePlaceId?: string;
  geo: { lat: number; lng: number };
  area?: string;
  partnerId: string;
  status?: VenueStatus;
  capacity?: number;
  defaultIntents?: IntentKey[];
  meetPoints: VenueMeetPoint[];
  tips?: string[];
  checkInHints?: string[];
  contact?: VenueContact;
  photos?: VenuePhoto[];
  createdAt?: string;
  updatedAt?: string;
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

export type LoopStatus =
  | "waitingRoom"
  | "active"
  | "completed"
  | "scheduled"
  | "inProgress"
  | "done";

export interface LoopParticipantProfile {
  userId: string;
  alias: string;
  joinedAt: string;
}

export interface Loop {
  id: string;
  slotId?: string | null;
  roomId?: string | null;
  venueId?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  participants: string[];
  participantProfiles?: LoopParticipantProfile[];
  meetPoint?: { label: string; description?: string | null };
  startAt?: string;
  scheduledAt?: string;
  createdAt?: string;
  endedAt?: string | null;
  durationMinutes?: number;
  autoClosed?: boolean;
  status: LoopStatus;
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
