import { NextResponse } from "next/server";
import type { SlotAttendee } from "@/types/domain";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { getVenueById } from "@/lib/repositories/loop-repository";

const LOOP_AUTO_CLOSE_MS = 2 * 60 * 60 * 1000;
const MAX_LOOP_HISTORY = 12;
const forceMock =
  process.env.NEXT_PUBLIC_FORCE_MOCK === "true" ||
  process.env.FORCE_MOCK_DATA === "true";

const useMock = forceMock || !isFirebaseAdminConfigured;

interface RoomMeetingPoint {
  id?: string | null;
  label: string;
  description?: string | null;
}

interface WaitingParticipant {
  userId: string;
  alias: string;
  joinedAt: string;
  email?: string | null;
  location?: ParticipantLocation | null;
}

interface ParticipantLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

interface RoomChatMessage {
  id: string;
  userId: string;
  alias: string;
  text: string;
  sentAt: string;
}

type LoopFeedbackRating = "great" | "ok" | "bad";
type LoopFeedbackAttendance =
  | "allPresent"
  | "someoneMissing"
  | "stoodAlone"
  | "unknown";
type LoopFeedbackSafety = "verySafe" | "mostlySafe" | "unsafe" | "unknown";
type LoopFeedbackFollowUp = "again" | "maybe" | "no" | "unknown";

interface RoomLoopFeedback {
  rating: LoopFeedbackRating;
  attendance: LoopFeedbackAttendance;
  safety: LoopFeedbackSafety;
  followUp: LoopFeedbackFollowUp;
  note?: string | null;
  submittedAt: string;
  submittedBy?: string | null;
}

type LoopPhase = "waitingRoom" | "active" | "completed";

interface RoomLoop {
  id: string;
  participantIds: string[];
  participants: WaitingParticipant[];
  createdAt: string;
  meetingPoint: RoomMeetingPoint | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt?: string | null;
  capacity?: number;
  status: LoopPhase;
  durationMinutes?: number;
  autoClosed?: boolean;
  createdBy?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  messages?: RoomChatMessage[];
  feedback?: RoomLoopFeedback | null;
}

interface RoomState {
  roomId: string;
  venueId?: string | null;
  venueName?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  capacity: number;
  attendees: SlotAttendee[];
  loops: RoomLoop[];
  profiles: Record<
    string,
    {
      name: string;
      email?: string | null;
    }
  >;
  participantIndex: string[];
  meetingPoint: RoomMeetingPoint | null;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
  capacityConfirmed?: boolean;
  locations: Record<string, ParticipantLocation>;
}

const rooms = new Map<string, RoomState>();

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function createEmptyRoom(roomId: string): RoomState {
  const timestamp = nowIso();
  return {
    roomId,
    venueId: null,
    venueName: null,
    capacity: 4,
    attendees: [],
    loops: [],
    profiles: {},
    participantIndex: [],
    meetingPoint: null,
    scheduledAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    capacityConfirmed: false,
    locations: {},
  };
}

function normalizeRoom(roomId: string, source?: Partial<RoomState>): RoomState {
  const base = createEmptyRoom(roomId);
  return {
    ...base,
    ...source,
    roomId,
    venueId: source?.venueId ?? base.venueId,
    venueName: source?.venueName ?? base.venueName,
    capacity: source?.capacity ?? base.capacity,
    attendees: source?.attendees ?? base.attendees,
    loops: source?.loops ?? base.loops,
    profiles: source?.profiles ?? base.profiles,
    participantIndex: source?.participantIndex ?? base.participantIndex,
    meetingPoint: source?.meetingPoint ?? base.meetingPoint,
    scheduledAt: source?.scheduledAt ?? base.scheduledAt,
    createdAt: source?.createdAt ?? base.createdAt,
    updatedAt: source?.updatedAt ?? base.updatedAt,
    capacityConfirmed: source?.capacityConfirmed ?? base.capacityConfirmed,
    locations: source?.locations ?? base.locations,
  };
}

async function resolveDefaultParticipantLocation(
  room: RoomState,
): Promise<ParticipantLocation | null> {
  if (!room.venueId) return null;
  try {
    const venue = await getVenueById(room.venueId);
    if (!venue) return null;
    const meetingPointId = room.meetingPoint?.id ?? null;
    const meetingPointCoords = meetingPointId
      ? venue.meetPoints?.find((point) => point.id === meetingPointId)?.geoOffset
      : null;
    const fallbackCoords = meetingPointCoords ?? venue.geo;
    if (
      !fallbackCoords ||
      !Number.isFinite(Number(fallbackCoords.lat)) ||
      !Number.isFinite(Number(fallbackCoords.lng))
    ) {
      return null;
    }
    return {
      lat: Number(fallbackCoords.lat),
      lng: Number(fallbackCoords.lng),
      updatedAt: nowIso(),
    };
  } catch {
    return null;
  }
}

function updateParticipantIndex(room: RoomState) {
  const ids = new Set<string>();
  room.loops.forEach((loop) => {
    loop.participantIds?.forEach((participantId) => {
      if (participantId) ids.add(participantId);
    });
  });
  room.participantIndex = Array.from(ids);
}

function getParticipantProfile(room: RoomState, userId: string) {
  return room.profiles[userId] ?? { name: userId, email: null };
}

function toParticipant(
  room: RoomState,
  userId: string,
  joinedAt?: string,
): WaitingParticipant {
  const profile = getParticipantProfile(room, userId);
  return {
    userId,
    alias: profile.name,
    email: profile.email ?? null,
    joinedAt: joinedAt ?? nowIso(),
    location: room.locations[userId] ?? null,
  };
}

function findActiveLoop(room: RoomState) {
  return room.loops.find((loop) => loop.status === "active") ?? null;
}

function loopContainsUser(
  loop: {
    participantIds?: unknown;
    ownerId?: string | null;
    id?: string;
    status?: LoopPhase;
    participants?: { userId?: string }[];
  },
  room: Pick<RoomState, "ownerId">,
  userId: string,
) {
  if (loop.ownerId === userId || room.ownerId === userId) {
    return true;
  }
  if (
    Array.isArray(loop.participantIds) &&
    (loop.participantIds as string[]).includes(userId)
  ) {
    return true;
  }
  if (Array.isArray(loop.participants)) {
    return loop.participants.some((participant) => participant?.userId === userId);
  }
  return false;
}

async function hasActiveLoop(
  userId: string,
  options?: { roomId?: string; allowLoopId?: string },
) {
  if (!userId) return false;
  if (useMock) {
    for (const [existingRoomId, existingRoom] of rooms.entries()) {
      const loops = Array.isArray(existingRoom.loops) ? existingRoom.loops : [];
      for (const loop of loops) {
        if (loop.status !== "active") continue;
        if (!loopContainsUser(loop, existingRoom, userId)) continue;
        if (
          options?.roomId === existingRoomId &&
          options?.allowLoopId &&
          options.allowLoopId === loop.id
        ) {
          continue;
        }
        return true;
      }
    }
    return false;
  }

  const db = getAdminDb();
  const [ownerSnapshot, participantSnapshot] = await Promise.all([
    db.collection("waitingRooms").where("ownerId", "==", userId).get(),
    db.collection("waitingRooms").where("participantIndex", "array-contains", userId).get(),
  ]);
  const roomDocs = new Map<string, Record<string, unknown>>();
  ownerSnapshot.docs.forEach((doc) => roomDocs.set(doc.id, doc.data()));
  participantSnapshot.docs.forEach((doc) => roomDocs.set(doc.id, doc.data()));

  for (const [docId, roomData] of roomDocs.entries()) {
    const loops = Array.isArray(roomData.loops) ? roomData.loops : [];
    for (const loopData of loops) {
      if (loopData?.status !== "active") continue;
      const loopId = typeof loopData?.id === "string" ? loopData.id : null;
      if (
        options?.roomId === docId &&
        options?.allowLoopId &&
        options.allowLoopId === loopId
      ) {
        continue;
      }
      const participantsRaw = Array.isArray(loopData?.participants)
        ? (loopData.participants as unknown[])
        : [];
      const normalizedParticipants = participantsRaw.map((participant) =>
        typeof participant === "string" ? { userId: participant } : participant,
      );
      const containsUser = loopContainsUser(
        {
          id: loopId ?? "",
          status: loopData?.status,
          ownerId:
            typeof loopData?.ownerId === "string"
              ? (loopData.ownerId as string)
              : undefined,
          participantIds: Array.isArray(loopData?.participantIds)
            ? (loopData.participantIds as string[])
            : [],
          participants: normalizedParticipants as { userId?: string }[],
        },
        {
          ownerId:
            typeof roomData.ownerId === "string"
              ? (roomData.ownerId as string)
              : undefined,
        },
        userId,
      );
      if (containsUser) {
        return true;
      }
    }
  }

  return false;
}

async function loadRoom(roomId: string): Promise<RoomState> {
  if (useMock) {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, createEmptyRoom(roomId));
    }
    return rooms.get(roomId)!;
  }

  const db = getAdminDb();
  const doc = await db.collection("waitingRooms").doc(roomId).get();
  if (!doc.exists) {
    const room = createEmptyRoom(roomId);
    await persistRoom(room);
    return room;
  }
  return normalizeRoom(roomId, doc.data() as Partial<RoomState>);
}

async function persistRoom(room: RoomState) {
  updateParticipantIndex(room);
  room.updatedAt = nowIso();
  if (useMock) {
    rooms.set(room.roomId, room);
    return;
  }
  const db = getAdminDb();
  await db.collection("waitingRooms").doc(room.roomId).set(room);
}

async function getRoom(roomId: string) {
  const room = await loadRoom(roomId);
  if (!room.scheduledAt) {
    room.scheduledAt = nowIso();
  }
  return room;
}

function deriveRoomStatus(room: RoomState): LoopPhase {
  if (room.loops.some((loop) => loop.status === "active")) return "active";
  if (room.loops.some((loop) => loop.status === "waitingRoom")) return "waitingRoom";
  return "completed";
}

function buildSnapshot(room: RoomState) {
  return {
    roomId: room.roomId,
    capacity: room.capacity,
    capacityConfirmed: room.capacityConfirmed ?? false,
    scheduledAt: room.scheduledAt,
    meetingPoint: room.meetingPoint,
    waiting: room.attendees.map<WaitingParticipant>((attendee) => ({
      userId: attendee.userId,
      joinedAt: attendee.joinedAt,
      alias: room.profiles[attendee.userId]?.name ?? attendee.userId,
      email: room.profiles[attendee.userId]?.email ?? null,
      location: room.locations[attendee.userId] ?? null,
    })),
    loops: room.loops.slice(0, MAX_LOOP_HISTORY),
    lastUpdated: nowIso(),
    ownerId: room.ownerId ?? null,
    ownerName: room.ownerName ?? null,
    status: deriveRoomStatus(room),
    venueId: room.venueId ?? null,
    venueName: room.venueName ?? null,
    setupComplete: isRoomSetupComplete(room),
  };
}

function isRoomSetupComplete(room: RoomState) {
  return Boolean(
    room.ownerId &&
    room.ownerName &&
    room.capacityConfirmed &&
    room.meetingPoint?.label,
  );
}

function finalizeLoop(
  loop: RoomLoop,
  endedAt: string,
  autoClosed: boolean,
  feedback?: RoomLoopFeedback | null,
) {
  loop.status = "completed";
  loop.endedAt = endedAt;
  loop.autoClosed = autoClosed;
  if (feedback) {
    loop.feedback = feedback;
  }
  const startedAt = loop.startedAt ? new Date(loop.startedAt).getTime() : NaN;
  const finishedAt = new Date(endedAt).getTime();
  if (Number.isFinite(startedAt) && Number.isFinite(finishedAt)) {
    const durationMinutes = Math.max(
      1,
      Math.round((finishedAt - startedAt) / 60_000),
    );
    loop.durationMinutes = durationMinutes;
  }
}

function autoCloseLoops(room: RoomState) {
  let changed = false;
  const now = Date.now();
  room.loops.forEach((loop) => {
    if (loop.status !== "active" || loop.endedAt) {
      return;
    }
    const startedAt = loop.startedAt
      ? new Date(loop.startedAt).getTime()
      : NaN;
    if (!Number.isFinite(startedAt)) {
      return;
    }
    if (startedAt + LOOP_AUTO_CLOSE_MS <= now) {
      const endedAt = new Date(startedAt + LOOP_AUTO_CLOSE_MS).toISOString();
      finalizeLoop(loop, endedAt, true);
      changed = true;
    }
  });
  if (changed && room.ownerId) {
    ensureWaitingLoop(room);
  }
  return changed;
}

function ensureWaitingLoop(room: RoomState) {
  const existing = room.loops.find((loop) => loop.status === "waitingRoom");
  if (existing) {
    existing.meetingPoint = room.meetingPoint;
    existing.scheduledAt = room.scheduledAt;
    existing.capacity = room.capacity;
    existing.messages = existing.messages ?? [];
    existing.participants = existing.participants ?? [];
    existing.participantIds = existing.participantIds ?? [];
    return existing;
  }
  const loop: RoomLoop = {
    id: `loop-${room.roomId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    participantIds: [],
    participants: [],
    createdAt: nowIso(),
    meetingPoint: room.meetingPoint,
    scheduledAt: room.scheduledAt,
    capacity: room.capacity,
    startedAt: null,
    endedAt: null,
    status: "waitingRoom",
    createdBy: room.ownerId ?? null,
    ownerId: room.ownerId ?? null,
    ownerName: room.ownerName ?? null,
    messages: [],
    feedback: null,
  };
  room.loops = [loop, ...room.loops].slice(0, MAX_LOOP_HISTORY);
  return loop;
}

function ensureOwner(
  room: RoomState,
  userId?: string | null,
  ownerName?: string | null,
) {
  if (!userId) {
    throw new HttpError(
      403,
      "Nur angemeldete Nutzer:innen können den Warteraum verwalten.",
    );
  }
  if (!room.ownerId) {
    room.ownerId = userId;
    room.ownerName = ownerName ?? room.ownerName ?? null;
    ensureWaitingLoop(room);
    return;
  }
  if (room.ownerId !== userId) {
    throw new HttpError(
      403,
      "Nur der Ersteller dieses Warteraums darf diese Aktion ausführen.",
    );
  }
  if (ownerName && ownerName !== room.ownerName) {
    room.ownerName = ownerName;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ message: "roomId fehlt" }, { status: 400 });
  }
  const room = await getRoom(roomId);
  const changed = autoCloseLoops(room);
  if (changed) {
    await persistRoom(room);
  }
  return NextResponse.json(buildSnapshot(room));
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Ungültiger Body" }, { status: 400 });
  }
  const roomId = payload.roomId as string | undefined;
  if (!roomId) {
    return NextResponse.json({ message: "roomId fehlt" }, { status: 400 });
  }
  const room = await getRoom(roomId);
  autoCloseLoops(room);

  const action = payload.action;
  const userId = payload.userId as string | undefined;
  const ownerName =
    (payload.ownerName as string | undefined)?.trim() ||
    (payload.displayName as string | undefined)?.trim();
  const venueId = payload.venueId as string | undefined;
  if (venueId) {
    room.venueId = venueId;
  }
  const venueNamePayload = (payload.venueName as string | undefined)?.trim();
  if (venueNamePayload) {
    room.venueName = venueNamePayload;
  }

  try {
    switch (action) {
      case "claim": {
        ensureOwner(room, userId, ownerName);
        break;
      }
      case "join": {
        const displayName = (payload.displayName as string | undefined)?.trim();
        const email = (payload.email as string | undefined)?.trim();
        if (!userId || !displayName) {
          throw new HttpError(
            400,
            "userId und displayName erforderlich",
          );
        }
        const activeLoop = findActiveLoop(room);
        if (!activeLoop) {
          throw new HttpError(
            400,
            "Dieses Loop wurde noch nicht gestartet.",
          );
        }
        if (activeLoop.participantIds.includes(userId)) {
          throw new HttpError(400, "Du bist bereits Teil dieses Loops.");
        }
        const hasLoopElsewhere = await hasActiveLoop(userId, {
          roomId,
          allowLoopId: activeLoop.id,
        });
        if (hasLoopElsewhere) {
          throw new HttpError(
            400,
            "Es ist nur ein aktives Loop pro Person erlaubt.",
          );
        }
        if (activeLoop.participants.length >= room.capacity) {
          throw new HttpError(400, "Dieses Loop ist bereits voll.");
        }
        if (!room.locations[userId]) {
          const inferredLocation = await resolveDefaultParticipantLocation(room);
          if (inferredLocation) {
            room.locations[userId] = inferredLocation;
          }
        }
        room.profiles[userId] = {
          name: displayName,
          email: email ?? room.profiles[userId]?.email ?? null,
        };
        const participant = toParticipant(room, userId);
        activeLoop.participants = [...activeLoop.participants, participant];
        activeLoop.participantIds = [...activeLoop.participantIds, userId];
        break;
      }
      case "leave": {
        if (userId) {
          room.attendees = room.attendees.filter(
            (attendee) => attendee.userId !== userId,
          );
        }
        break;
      }
      case "reset": {
        ensureOwner(room, userId, ownerName);
        const activeLoop = findActiveLoop(room);
        const otherParticipants =
          activeLoop?.participantIds.some(
            (participantId) => participantId && participantId !== room.ownerId,
          ) ?? false;
        if (otherParticipants) {
          throw new HttpError(
            400,
            "Solange andere Teilnehmende aktiv sind, kann der Raum nicht zurückgesetzt werden.",
          );
        }
        room.attendees = [];
        room.meetingPoint = null;
        room.scheduledAt = nowIso();
        room.capacityConfirmed = false;
        room.loops = room.loops
          .filter((loop) => loop.status === "completed")
          .slice(0, MAX_LOOP_HISTORY);
        ensureWaitingLoop(room);
        break;
      }
      case "configure": {
        ensureOwner(room, userId, ownerName);
        if ("capacity" in payload) {
          const capacity = Number(payload.capacity);
          if (!Number.isFinite(capacity) || capacity < 2 || capacity > 4) {
            throw new HttpError(
              400,
              "Kapazität zwischen 2 und 4 notwendig",
            );
          }
          room.capacity = Math.round(capacity);
          room.capacityConfirmed = true;
        }
        if (payload.meetPointLabel) {
          const label = String(payload.meetPointLabel).trim();
          if (!label) {
            throw new HttpError(400, "Treffpunkt-Label fehlt.");
          }
          room.meetingPoint = {
            id: (payload.meetPointId as string | undefined) ?? null,
            label,
            description:
              (payload.meetPointDescription as string | undefined)?.trim() || null,
          };
        }
        ensureWaitingLoop(room);
        break;
      }
      case "startLoop": {
        ensureOwner(room, userId, ownerName);
        if (!room.meetingPoint) {
          throw new HttpError(
            400,
            "Bitte zuerst einen Treffpunkt auswählen.",
          );
        }
        if (!isRoomSetupComplete(room)) {
          throw new HttpError(
            400,
            "Bitte Setup abschließen, bevor ein Loop gestartet wird.",
          );
        }
        if (findActiveLoop(room)) {
          throw new HttpError(400, "Dieses Loop läuft bereits.");
        }
        if (!room.ownerId) {
          throw new HttpError(400, "Kein Host hinterlegt.");
        }
        const loop = ensureWaitingLoop(room);
        const ownerHasActiveLoop = await hasActiveLoop(room.ownerId, {
          roomId,
          allowLoopId: loop.id,
        });
        if (ownerHasActiveLoop) {
          throw new HttpError(
            400,
            "Du hast bereits ein aktives Loop. Bitte beende es zuerst.",
          );
        }
        const timestamp = nowIso();
        room.scheduledAt = timestamp;
        room.profiles[room.ownerId] = {
          name: room.ownerName ?? room.profiles[room.ownerId]?.name ?? "Host",
          email: room.profiles[room.ownerId]?.email ?? null,
        };
        room.attendees = [];
        loop.status = "active";
        loop.startedAt = timestamp;
        loop.meetingPoint = room.meetingPoint;
        loop.scheduledAt = room.scheduledAt ?? timestamp;
        loop.capacity = room.capacity;
        loop.participants = [
          toParticipant(room, room.ownerId, timestamp),
        ];
        loop.participantIds = [room.ownerId];
        loop.createdBy = room.ownerId;
        loop.ownerId = room.ownerId ?? null;
        loop.ownerName = room.ownerName ?? null;
        loop.messages = [];
        loop.feedback = null;
        loop.endedAt = null;
        loop.autoClosed = false;
        break;
      }
      case "endLoop": {
        ensureOwner(room, userId, ownerName);
        const loopId = payload.loopId as string | undefined;
        if (!loopId) {
          throw new HttpError(400, "loopId erforderlich");
        }
        const loop = room.loops.find((item) => item.id === loopId);
        if (!loop) {
          throw new HttpError(404, "Loop nicht gefunden");
        }
        if (!loop.endedAt && loop.status !== "completed") {
          const rating = payload.feedbackRating as LoopFeedbackRating | undefined;
          const note =
            (payload.feedbackNote as string | undefined)?.trim() || null;
          const attendance = payload.feedbackAttendance as LoopFeedbackAttendance | undefined;
          const safety = payload.feedbackSafety as LoopFeedbackSafety | undefined;
          const followUp = payload.feedbackFollowUp as LoopFeedbackFollowUp | undefined;
          const validRating =
            rating === "great" || rating === "ok" || rating === "bad";
          const validAttendance =
            attendance === "allPresent" ||
            attendance === "someoneMissing" ||
            attendance === "stoodAlone" ||
            attendance === "unknown";
          const validSafety =
            safety === "verySafe" ||
            safety === "mostlySafe" ||
            safety === "unsafe" ||
            safety === "unknown";
          const validFollowUp =
            followUp === "again" ||
            followUp === "maybe" ||
            followUp === "no" ||
            followUp === "unknown";
          if (!validRating || !validAttendance || !validSafety || !validFollowUp) {
            throw new HttpError(400, "Feedback erforderlich");
          }
          const feedback: RoomLoopFeedback = {
            rating,
            attendance,
            safety,
            followUp,
            note,
            submittedAt: nowIso(),
            submittedBy: userId ?? null,
          };
          finalizeLoop(loop, nowIso(), false, feedback);
        }
        ensureWaitingLoop(room);
        break;
      }
      case "chat": {
        if (!userId) {
          throw new HttpError(403, "Nur angemeldete Nutzer können chatten.");
        }
        const loopId = payload.loopId as string | undefined;
        const message = (payload.message as string | undefined)?.trim();
        if (!loopId || !message) {
          throw new HttpError(400, "loopId und message erforderlich");
        }
        const loop = room.loops.find((item) => item.id === loopId);
        if (!loop || loop.status !== "active") {
          throw new HttpError(400, "Nur aktive Loops unterstützen den Chat.");
        }
        const isParticipant =
          loop.participantIds.includes(userId) || userId === room.ownerId;
        if (!isParticipant) {
          throw new HttpError(403, "Nur Teilnehmende dieses Loops dürfen hier schreiben.");
        }
        const alias =
          room.profiles[userId]?.name ??
          (userId === room.ownerId ? room.ownerName ?? "Host" : "Gast");
        const entry: RoomChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          userId,
          alias,
          text: message,
          sentAt: nowIso(),
        };
        const messages = loop.messages ?? [];
        loop.messages = [...messages, entry].slice(-100);
        break;
      }
      case "location": {
        if (!userId) {
          throw new HttpError(403, "Nur angemeldete Nutzer:innen können ihren Standort teilen.");
        }
        const lat = Number(payload.lat);
        const lng = Number(payload.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          throw new HttpError(400, "Koordinaten ungültig.");
        }
        const location: ParticipantLocation = {
          lat,
          lng,
          updatedAt: nowIso(),
        };
        room.locations[userId] = location;
        room.loops.forEach((loop) => {
          const participants = loop.participants ?? [];
          loop.participants = participants.map((participant) =>
            participant.userId === userId ? { ...participant, location } : participant,
          );
        });
        break;
      }
      default:
        throw new HttpError(400, "Unbekannte Aktion");
    }
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    throw error;
  }

  await persistRoom(room);
  return NextResponse.json(buildSnapshot(room));
}
