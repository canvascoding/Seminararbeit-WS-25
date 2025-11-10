import { NextResponse } from "next/server";
import { buildMatches } from "@/lib/matching/match-loop";
import type { SlotAttendee } from "@/types/domain";

interface RoomLoop {
  id: string;
  participantIds: string[];
  participants: WaitingParticipant[];
  createdAt: string;
}

interface WaitingParticipant {
  userId: string;
  alias: string;
  joinedAt: string;
}

interface RoomState {
  capacity: number;
  attendees: SlotAttendee[];
  loops: RoomLoop[];
  profiles: Record<string, { name: string }>;
}

const rooms = new Map<string, RoomState>();

function getRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      capacity: 4,
      attendees: [],
      loops: [],
      profiles: {},
    });
  }
  return rooms.get(roomId)!;
}

function serializeRoom(roomId: string) {
  const room = getRoom(roomId);
  return {
    roomId,
    capacity: room.capacity,
    waiting: room.attendees.map<WaitingParticipant>((attendee) => ({
      userId: attendee.userId,
      joinedAt: attendee.joinedAt,
      alias: room.profiles[attendee.userId]?.name ?? attendee.userId,
    })),
    loops: room.loops,
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ message: "roomId fehlt" }, { status: 400 });
  }

  const room = getRoom(roomId);
  const snapshot = [...room.attendees];
  const matchResult = buildMatches(snapshot, room.capacity);

  if (matchResult.loops.length) {
    const generatedAt = new Date().toISOString();
    const newLoops = matchResult.loops.map((loop) => {
      const participants = loop.participantIds.map<WaitingParticipant>((userId) => {
        const attendee = snapshot.find((item) => item.userId === userId);
        return {
          userId,
          alias: room.profiles[userId]?.name ?? userId,
          joinedAt: attendee?.joinedAt ?? generatedAt,
        };
      });
      return {
        id: `loop-${roomId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        participantIds: loop.participantIds,
        participants,
        createdAt: generatedAt,
      };
    });
    room.loops = [...newLoops, ...room.loops].slice(0, 8);
  }

  room.attendees = matchResult.waiting;

  return NextResponse.json(serializeRoom(roomId));
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
  const room = getRoom(roomId);
  const action = payload.action;

  switch (action) {
    case "join": {
      const userId = payload.userId as string | undefined;
      const displayName = (payload.displayName as string | undefined)?.trim();
      if (!userId || !displayName) {
        return NextResponse.json(
          { message: "userId und displayName erforderlich" },
          { status: 400 },
        );
      }
      room.attendees = room.attendees.filter(
        (attendee) => attendee.userId !== userId,
      );
      room.attendees.push({
        slotId: roomId,
        userId,
        joinedAt: new Date().toISOString(),
        status: "pending",
      });
      room.profiles[userId] = { name: displayName };
      room.loops = room.loops.filter(
        (loop) => !loop.participantIds.includes(userId),
      );
      break;
    }
    case "leave": {
      const userId = payload.userId as string | undefined;
      if (userId) {
        room.attendees = room.attendees.filter(
          (attendee) => attendee.userId !== userId,
        );
      }
      break;
    }
    case "spawnBot": {
      const count = Math.min(
        Math.max(Number(payload.count) || 1, 1),
        5,
      );
      for (let i = 0; i < count; i += 1) {
        const userId = `demo-${Date.now()}-${Math.floor(Math.random() * 10_000)}-${i}`;
        room.attendees.push({
          slotId: roomId,
          userId,
          joinedAt: new Date().toISOString(),
          status: "pending",
        });
        room.profiles[userId] = {
          name: `Demo #${room.attendees.length}`,
        };
      }
      break;
    }
    case "reset": {
      room.attendees = [];
      room.loops = [];
      break;
    }
    case "configure": {
      const capacity = Number(payload.capacity);
      if (!Number.isFinite(capacity) || capacity < 2 || capacity > 4) {
        return NextResponse.json(
          { message: "Kapazität zwischen 2 und 4 notwendig" },
          { status: 400 },
        );
      }
      room.capacity = Math.round(capacity);
      break;
    }
    default:
      return NextResponse.json({ message: "Unbekannte Aktion" }, { status: 400 });
  }

  return NextResponse.json(serializeRoom(roomId));
}
