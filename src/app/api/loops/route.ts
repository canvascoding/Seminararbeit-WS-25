import { NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { mockLoops } from "@/data/mock-data";

const forceMock =
  process.env.NEXT_PUBLIC_FORCE_MOCK === "true" ||
  process.env.FORCE_MOCK_DATA === "true";

const useMock = forceMock || !isFirebaseAdminConfigured;

type WaitingParticipant = {
  userId: string;
  alias: string;
  joinedAt: string;
  email?: string | null;
};

type RoomLoopFeedback = {
  rating: "great" | "ok" | "bad";
  note?: string | null;
  submittedAt: string;
  submittedBy?: string | null;
};

type LoopPhase = "waitingRoom" | "active" | "completed" | "inProgress";

interface LoopSummary {
  id: string;
  roomId: string | null;
  venueId?: string | null;
  venueName?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  status: LoopPhase;
  participants: WaitingParticipant[];
  meetingPoint?: {
    id?: string | null;
    label?: string | null;
    description?: string | null;
  } | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string | null;
  durationMinutes?: number;
  autoClosed?: boolean;
  feedback?: RoomLoopFeedback | null;
  isOwner: boolean;
  isParticipant: boolean;
}

type StoredParticipant = {
  userId?: string;
  alias?: string;
  joinedAt?: string;
  email?: string | null;
  uid?: string;
  contact?: string | null;
};

interface StoredLoop {
  id?: string;
  status?: LoopPhase;
  participants?: StoredParticipant[] | string[];
  participantProfiles?: StoredParticipant[];
  participantIds?: string[];
  meetingPoint?: {
    label?: string | null;
    description?: string | null;
    id?: string | null;
  } | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string | null;
  durationMinutes?: number;
  autoClosed?: boolean;
  feedback?: LoopFeedback | null;
}

interface StoredRoom {
  id?: string;
  roomId?: string;
  venueId?: string | null;
  venueName?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  loops?: StoredLoop[];
  createdAt?: string | null;
}

function normalizeParticipants(
  loop: StoredLoop,
  room: StoredRoom,
): WaitingParticipant[] {
  if (Array.isArray(loop?.participants) && loop.participants.length > 0) {
    const first = loop.participants[0];
    if (typeof first === "string") {
      return (loop.participants as string[]).map((participantId) => ({
        userId: participantId,
        alias: participantId,
        joinedAt: room?.createdAt ?? new Date().toISOString(),
        email: null,
      }));
    }
    return loop.participants.map((participant) => ({
      userId: participant.userId ?? participant?.uid ?? "",
      alias: participant.alias ?? participant.userId ?? "Gast",
      joinedAt:
        participant.joinedAt ?? room?.createdAt ?? new Date().toISOString(),
      email: participant.email ?? participant?.contact ?? null,
    }));
  }
  if (
    Array.isArray(loop?.participantProfiles) &&
    loop.participantProfiles.length > 0
  ) {
    return loop.participantProfiles.map((participant) => ({
      userId: participant.userId ?? "",
      alias: participant.alias ?? participant.userId ?? "Gast",
      joinedAt:
        participant.joinedAt ?? room?.createdAt ?? new Date().toISOString(),
      email: participant.email ?? null,
    }));
  }
  return [];
}

function serializeLoop(
  loop: StoredLoop,
  room: StoredRoom,
  userId: string,
): LoopSummary | null {
  const status = loop?.status ?? "waitingRoom";
  const participants = normalizeParticipants(loop, room);
  const participantIds: string[] = Array.isArray(loop?.participantIds)
    ? loop.participantIds
    : participants.map((participant) => participant.userId);
  const isOwner = room?.ownerId === userId;
  const isParticipant = participantIds.includes(userId);

  if (!isOwner && !isParticipant) {
    return null;
  }
  if (
    status === "waitingRoom" &&
    (participantIds.length === 0 || !loop?.startedAt)
  ) {
    return null;
  }

  return {
    id: loop?.id ?? "",
    roomId: room?.roomId ?? room?.id ?? null,
    venueId: room?.venueId ?? null,
    venueName: room?.venueName ?? null,
    ownerId: room?.ownerId ?? null,
    ownerName: room?.ownerName ?? null,
    status,
    participants,
    meetingPoint: loop?.meetingPoint ?? null,
    scheduledAt: loop?.scheduledAt ?? null,
    startedAt: loop?.startedAt ?? null,
    endedAt: loop?.endedAt ?? null,
    createdAt: loop?.createdAt ?? null,
    durationMinutes: loop?.durationMinutes ?? undefined,
    autoClosed: loop?.autoClosed ?? undefined,
    feedback: loop?.feedback ?? null,
    isOwner,
    isParticipant,
  };
}

function sortLoops(loops: LoopSummary[]) {
  return loops.sort((a, b) => {
    const aTime = new Date(a.startedAt ?? a.createdAt ?? 0).getTime();
    const bTime = new Date(b.startedAt ?? b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { message: "userId erforderlich" },
      { status: 400 },
    );
  }
  const filterStatuses = searchParams.get("status")
    ?.split(",")
    .filter(Boolean);

  if (useMock) {
    const loops = mockLoops
      .map((loop) =>
        serializeLoop(loop, { roomId: loop.roomId, ownerId: loop.ownerId }, userId),
      )
      .filter((loop): loop is LoopSummary => Boolean(loop))
      .filter((loop) =>
        filterStatuses ? filterStatuses.includes(loop.status) : true,
      );
    return NextResponse.json({ loops: sortLoops(loops) });
  }

  const db = getAdminDb();
  const roomDocs = new Map<string, StoredRoom>();

  const ownerSnapshot = await db
    .collection("waitingRooms")
    .where("ownerId", "==", userId)
    .get();
  ownerSnapshot.docs.forEach((doc) => roomDocs.set(doc.id, doc.data()));

  const participantSnapshot = await db
    .collection("waitingRooms")
    .where("participantIndex", "array-contains", userId)
    .get();
  participantSnapshot.docs.forEach((doc) => roomDocs.set(doc.id, doc.data()));

  const loops: LoopSummary[] = [];

  roomDocs.forEach((roomData, roomId) => {
    const roomLoops = Array.isArray(roomData.loops) ? roomData.loops : [];
    roomLoops.forEach((loopData) => {
      const loop = serializeLoop(loopData, { ...roomData, roomId }, userId);
      if (!loop) return;
      if (filterStatuses && !filterStatuses.includes(loop.status)) {
        return;
      }
      loops.push(loop);
    });
  });

  return NextResponse.json({ loops: sortLoops(loops) });
}
