import { addMinutes, isAfter } from "date-fns";
import { mockLoops, mockPartnerMetrics, mockSlots, mockVenues } from "@/data/mock-data";
import type { IncidentReport, Loop, Slot, UserProfile, Venue } from "@/types/domain";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import type { Query, Timestamp } from "firebase-admin/firestore";

const useMock = !isFirebaseAdminConfigured;

type FirestoreDate = Timestamp | Date | string;
type PartnerSlotPayload = Omit<Slot, "id" | "status"> &
  Partial<Pick<Slot, "status">>;

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
  if (venueId) slotQuery = slotQuery.where("venueId", "==", venueId);
  if (fromDate) slotQuery = slotQuery.where("startAt", ">=", fromDate);
  const snapshot = await slotQuery.orderBy("startAt", "asc").get();
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Slot & { startAt: FirestoreDate };
    return {
      ...data,
      id: doc.id,
      startAt: serializeDate(data.startAt),
    };
  });
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

export type { PartnerSlotPayload };
