import { addMinutes, isAfter } from "date-fns";
import { mockLoops, mockPartnerMetrics, mockSlots, mockVenues } from "@/data/mock-data";
import type {
  IncidentReport,
  Loop,
  Slot,
  UserProfile,
  Venue,
} from "@/types/domain";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { Query, Timestamp } from "firebase-admin/firestore";

const forceMock =
  process.env.NEXT_PUBLIC_FORCE_MOCK === "true" ||
  process.env.FORCE_MOCK_DATA === "true";

const useMock = forceMock || !isFirebaseAdminConfigured;

type FirestoreDate = Timestamp | Date | string;
export type PartnerSlotPayload = Omit<Slot, "id" | "status"> &
  Partial<Pick<Slot, "status">>;
export type VenueInput = Omit<Venue, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

function serializeDate(value: FirestoreDate) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if ("toDate" in value) {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

export async function listVenues(): Promise<Venue[]> {
  if (useMock) return mockVenues;

  const db = getAdminDb();
  const snapshot = await db.collection("venues").get();
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      }) as Venue,
  );
}

export async function getVenueById(id: string) {
  const venues = await listVenues();
  return venues.find((venue) => venue.id === id);
}

export async function listSlots(venueId?: string, fromDate?: Date): Promise<Slot[]> {
  if (useMock) {
    return mockSlots
      .filter((slot) => (!venueId ? true : slot.venueId === venueId))
      .filter((slot) =>
        fromDate ? isAfter(new Date(slot.startAt), fromDate) : true,
      )
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
  }

  const db = getAdminDb();
  let slotQuery: Query = db.collection("slots");
  let requiresLocalDateFilter = false;
  let requiresLocalOrdering = false;

  if (venueId) {
    slotQuery = slotQuery.where("venueId", "==", venueId);
    requiresLocalOrdering = true;
    if (fromDate) {
      // Combining equality + inequality requires a composite index, so filter locally instead.
      requiresLocalDateFilter = true;
    }
  } else {
    if (fromDate) slotQuery = slotQuery.where("startAt", ">=", fromDate);
    slotQuery = slotQuery.orderBy("startAt", "asc");
  }

  const snapshot = await slotQuery.get();
  let slots = snapshot.docs.map((doc) => {
    const data = doc.data() as Slot & { startAt: FirestoreDate };
    return {
      ...data,
      id: doc.id,
      startAt: serializeDate(data.startAt),
    };
  });

  if (requiresLocalDateFilter && fromDate) {
    slots = slots.filter((slot) => isAfter(new Date(slot.startAt), fromDate));
  }
  if (requiresLocalOrdering) {
    slots = slots.sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }

  return slots;
}

export async function joinSlot(slotId: string, user: UserProfile) {
  if (useMock) {
    return {
      status: "pending",
      slotId,
    };
  }

  const db = getAdminDb();
  await db
    .collection("slotAttendees")
    .doc(`${slotId}-${user.uid}`)
    .set({
      slotId,
      userId: user.uid,
      joinedAt: new Date(),
      status: "pending",
    });
  return { status: "pending" };
}

export async function cancelSlot(slotId: string, userId: string) {
  if (useMock) {
    return { status: "canceled" };
  }

  const db = getAdminDb();
  await db
    .collection("slotAttendees")
    .doc(`${slotId}-${userId}`)
    .update({ status: "canceled" });
  return { status: "canceled" };
}

export async function getLoopStatus(loopId: string) {
  if (useMock) {
    return mockLoops.find((loop) => loop.id === loopId);
  }
  const db = getAdminDb();
  const doc = await db.collection("loops").doc(loopId).get();
  if (!doc.exists) return undefined;
  const data = doc.data() as Loop & { startAt: FirestoreDate };
  return {
    ...data,
    id: doc.id,
    startAt: serializeDate(data.startAt),
  } as Loop;
}

export async function submitIncident(
  payload: IncidentReport & { reporterId: string },
) {
  if (useMock) {
    return {
      status: "received",
      incidentId: `mock-${Date.now()}`,
    };
  }

  const db = getAdminDb();
  const ref = await db.collection("incidents").add({
    ...payload,
    createdAt: new Date(),
    status: "open",
  });
  return { status: "received", incidentId: ref.id };
}

export async function listPartnerSlots(partnerId: string) {
  if (useMock) {
    return {
      slots: mockSlots.filter(
        (slot) =>
          mockVenues.find((venue) => venue.id === slot.venueId)?.partnerId ===
          partnerId,
      ),
      metrics: mockPartnerMetrics,
    };
  }

  const db = getAdminDb();
  const venues = await db
    .collection("venues")
    .where("partnerId", "==", partnerId)
    .get();
  const venueIds = venues.docs.map((doc) => doc.id);
  if (!venueIds.length) return { slots: [], metrics: { attendance: 0, noShow: 0, nps: 0 } };

  const slots: Slot[] = [];
  const chunkSize = 10;
  for (let i = 0; i < venueIds.length; i += chunkSize) {
    const chunk = venueIds.slice(i, i + chunkSize);
    const snapshot = await db
      .collection("slots")
      .where("venueId", "in", chunk)
      .get();
    snapshot.docs.forEach((doc) => {
      const data = doc.data() as Slot & { startAt: FirestoreDate };
      slots.push({
        ...data,
        id: doc.id,
        startAt: serializeDate(data.startAt),
      });
    });
  }
  return {
    slots,
    metrics: mockPartnerMetrics,
  };
}

export async function createPartnerSlot(
  slot: PartnerSlotPayload,
  partnerId: string,
) {
  if (useMock) {
    return {
      slotId: `mock-${Date.now()}`,
    };
  }

  const db = getAdminDb();
  const ref = await db.collection("slots").add({
    ...slot,
    status: slot.status ?? "open",
    partnerId,
    createdAt: new Date(),
  });
  return { slotId: ref.id };
}

export function deriveMatchTimeout(slot: Slot) {
  return addMinutes(new Date(slot.startAt), 2);
}

function pruneUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as T;
}

export async function createVenue(payload: VenueInput): Promise<Venue> {
  const timestamp = new Date().toISOString();
  if (useMock) {
    const newVenue: Venue = {
      id: payload.id ?? `venue-${Date.now()}`,
      defaultIntents: [],
      status: "draft",
      meetPoints: payload.meetPoints ?? [],
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    mockVenues.push(newVenue);
    return newVenue;
  }

  const db = getAdminDb();
  const data = pruneUndefined({
    ...payload,
    status: payload.status ?? "draft",
    defaultIntents: payload.defaultIntents ?? [],
    meetPoints: payload.meetPoints ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  if (payload.id) {
    await db.collection("venues").doc(payload.id).set(data);
    return {
      id: payload.id,
      ...(data as Omit<Venue, "id">),
    };
  }

  const ref = await db.collection("venues").add(data);
  const doc = await ref.get();
  return {
    id: ref.id,
    ...(doc.data() as Venue),
  };
}

export async function updateVenue(
  id: string,
  payload: Partial<Venue>,
): Promise<Venue> {
  const timestamp = new Date().toISOString();
  if (useMock) {
    const index = mockVenues.findIndex((venue) => venue.id === id);
    if (index === -1) {
      throw new Error("Venue not found");
    }
    const updated: Venue = {
      ...mockVenues[index],
      ...payload,
      updatedAt: timestamp,
    };
    mockVenues[index] = updated;
    return updated;
  }

  const db = getAdminDb();
  const data = pruneUndefined({
    ...payload,
    updatedAt: timestamp,
  });
  await db.collection("venues").doc(id).set(data, { merge: true });
  const doc = await db.collection("venues").doc(id).get();
  return {
    id,
    ...(doc.data() as Venue),
  };
}
