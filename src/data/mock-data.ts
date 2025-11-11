import { addMinutes, formatISO } from "date-fns";
import type { Loop, Slot, Venue } from "@/types/domain";

const base = new Date();

export const mockVenues: Venue[] = [
  {
    id: "mensa-nord",
    name: "Mensa Nord",
    address: "Gaußstraße 20, 42119 Wuppertal",
    postalCode: "42119",
    city: "Wuppertal",
    type: "mensa",
    status: "active",
    area: "Campus Grifflenberg",
    googlePlaceId: "mock-place-mensa-nord",
    geo: { lat: 51.2467, lng: 7.1485 },
    partnerId: "partner-mensa",
    defaultIntents: ["smalltalk", "coffeeBreak"],
    meetPoints: [
      { id: "table-7", label: "Tisch 7", description: "Fensterseite" },
      { id: "coffee-bar", label: "Kaffeebar", description: "Neben Aufgang" },
    ],
    tips: [
      "Bitte Plätze nach 15 Minuten freigeben.",
      "Ruhezone links meiden.",
    ],
    contact: {
      name: "Alex Mensa",
      email: "mensa@uni-wuppertal.de",
    },
    checkInHints: ["Immer zuerst Karte zeigen."],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "bib-sued",
    name: "Bibliothek Süd",
    address: "Gaußstraße 22, 42119 Wuppertal",
    postalCode: "42119",
    city: "Wuppertal",
    type: "library",
    status: "active",
    googlePlaceId: "mock-place-bib-sued",
    geo: { lat: 51.2458, lng: 7.1501 },
    partnerId: "partner-bib",
    defaultIntents: ["coStudy"],
    meetPoints: [
      { id: "info-desk", label: "Infotheke", description: "Ebene 0" },
      { id: "study-box", label: "Study Box 3", description: "Ebene 2" },
    ],
    contact: {
      name: "Bib Team",
      email: "bibliothek@uni-wuppertal.de",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "campus-garten",
    name: "Campus Garten",
    address: "Max-Horkheimer-Str., 42119 Wuppertal",
    postalCode: "42119",
    city: "Wuppertal",
    type: "campus",
    status: "paused",
    googlePlaceId: "mock-place-campus-garten",
    geo: { lat: 51.2441, lng: 7.1412 },
    partnerId: "partner-ambassadors",
    meetPoints: [
      { id: "loop-flag", label: "Loop Flagge", description: "am Brunnen" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function buildSlot(override: Partial<Slot>): Slot {
  return {
    id: `slot-${override.venueId}-${override.intent}-${override.startAt}`,
    venueId: "mensa-nord",
    intent: "smalltalk",
    startAt: formatISO(base),
    durationMinutes: 10,
    capacity: 4,
    status: "open",
    meetPointId: "table-7",
    restSeats: 2,
    ...override,
  } as Slot;
}

export const mockSlots: Slot[] = [
  buildSlot({
    id: "slot-mensa-smalltalk-now",
    venueId: "mensa-nord",
    intent: "smalltalk",
    startAt: formatISO(addMinutes(base, 2)),
    durationMinutes: 10,
    restSeats: 3,
  }),
  buildSlot({
    id: "slot-mensa-costudy",
    venueId: "mensa-nord",
    intent: "coStudy",
    startAt: formatISO(addMinutes(base, 18)),
    durationMinutes: 15,
    restSeats: 1,
  }),
  buildSlot({
    id: "slot-bib-walk",
    venueId: "bib-sued",
    intent: "walkTalk",
    startAt: formatISO(addMinutes(base, 35)),
    durationMinutes: 15,
  }),
  buildSlot({
    id: "slot-garden-coffee",
    venueId: "campus-garten",
    intent: "coffeeBreak",
    startAt: formatISO(addMinutes(base, 55)),
    durationMinutes: 10,
  }),
];

export const mockLoops: Loop[] = [
  {
    id: "loop-sample-1",
    slotId: "slot-mensa-smalltalk-now",
    venueId: "mensa-nord",
    participants: ["demo-uid-1", "demo-uid-2"],
    meetPoint: { label: "Tisch 7", description: "Fensterseite" },
    startAt: formatISO(addMinutes(base, 2)),
    status: "scheduled",
  },
];

export const mockPartnerMetrics = {
  attendance: 128,
  noShow: 0.11,
  nps: 48,
};
