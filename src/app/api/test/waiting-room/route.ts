import { NextResponse } from "next/server";
import type { SlotAttendee } from "@/types/domain";

const LOOP_AUTO_CLOSE_MS = 60 * 60 * 1000;
const MAX_LOOP_HISTORY = 12;
const MIN_PARTICIPANTS = 2;

interface RoomMeetingPoint {
  id?: string | null;
  label: string;
  description?: string | null;
}

interface WaitingParticipant {
  userId: string;
  alias: string;
  joinedAt: string;
}

interface RoomLoop {
  id: string;
  participantIds: string[];
  participants: WaitingParticipant[];
  createdAt: string;
  meetingPoint: RoomMeetingPoint | null;
  scheduledAt: string;
  startedAt: string;
  endedAt?: string | null;
  status: "inProgress" | "completed";
  durationMinutes?: number;
  autoClosed?: boolean;
  createdBy?: string | null;
}

interface RoomState {
  capacity: number;
  attendees: SlotAttendee[];
  loops: RoomLoop[];
  profiles: Record<string, { name: string }>;
  meetingPoint: RoomMeetingPoint | null;
  scheduledAt: string;
}

const rooms = new Map<string, RoomState>();

function nowIso() {
  return new Date().toISOString();
}

function validateScheduleInput(value?: string | null) {
  const now = Date.now();
  const min = now - 60_000;
  const max = now + 2 * 60 * 60 * 1000;
  if (!value) {
    return { ok: true, iso: new Date(now).toISOString() };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { ok: false, message: "Startzeit ist ungültig." };
  }
  const timestamp = date.getTime();
  if (timestamp < min) {
    return {
      ok: false,
      message: "Die Startzeit muss in der Zukunft liegen und darf nicht in der Vergangenheit liegen.",
    };
  }
  if (timestamp > max) {
    return {
      ok: false,
      message: "Die Startzeit darf höchstens zwei Stunden in der Zukunft liegen.",
    };
  }
  return { ok: true, iso: date.toISOString() };
}

function finalizeLoop(loop: RoomLoop, endedAt: string, autoClosed: boolean) {
  loop.status = "completed";
  loop.endedAt = endedAt;
  loop.autoClosed = autoClosed;
  const startedAt = new Date(loop.startedAt).getTime();
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
  const now = Date.now();
  room.loops.forEach((loop) => {
    if (loop.status === "completed" || loop.endedAt) {
      return;
    }
    const startedAt = new Date(loop.startedAt ?? loop.createdAt).getTime();
    if (!Number.isFinite(startedAt)) {
      return;
    }
    if (startedAt + LOOP_AUTO_CLOSE_MS <= now) {
      const endedAt = new Date(startedAt + LOOP_AUTO_CLOSE_MS).toISOString();
      finalizeLoop(loop, endedAt, true);
    }
  });
}

function getRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      capacity: 4,
      attendees: [],
      loops: [],
      profiles: {},
      meetingPoint: null,
      scheduledAt: nowIso(),
    });
  }
  const room = rooms.get(roomId)!;
  if (!room.scheduledAt) {
    room.scheduledAt = nowIso();
  }
  return room;
}

function serializeRoom(roomId: string) {
  const room = getRoom(roomId);
  autoCloseLoops(room);
  return {
    roomId,
    capacity: room.capacity,
    scheduledAt: room.scheduledAt,
    meetingPoint: room.meetingPoint,
    waiting: room.attendees.map<WaitingParticipant>((attendee) => ({
      userId: attendee.userId,
      joinedAt: attendee.joinedAt,
      alias: room.profiles[attendee.userId]?.name ?? attendee.userId,
    })),
    loops: room.loops,
    lastUpdated: nowIso(),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json({ message: "roomId fehlt" }, { status: 400 });
  }

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
  autoCloseLoops(room);
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
        joinedAt: nowIso(),
        status: "pending",
      });
      room.profiles[userId] = { name: displayName };
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
    case "reset": {
      room.attendees = [];
      room.loops = [];
      room.scheduledAt = nowIso();
      break;
    }
    case "configure": {
      if ("capacity" in payload) {
        const capacity = Number(payload.capacity);
        if (!Number.isFinite(capacity) || capacity < 2 || capacity > 4) {
          return NextResponse.json(
            { message: "Kapazität zwischen 2 und 4 notwendig" },
            { status: 400 },
          );
        }
        room.capacity = Math.round(capacity);
      }
      if ("scheduledAt" in payload) {
        const scheduleInput = payload.scheduledAt as string | null | undefined;
        const validation = validateScheduleInput(scheduleInput);
        if (!validation.ok || !validation.iso) {
          return NextResponse.json(
            { message: validation.message ?? "Startzeit ungültig" },
            { status: 400 },
          );
        }
        room.scheduledAt = validation.iso;
      }
      if (payload.meetPointLabel) {
        const label = String(payload.meetPointLabel).trim();
        if (!label) {
          return NextResponse.json(
            { message: "Treffpunkt-Label fehlt." },
            { status: 400 },
          );
        }
        room.meetingPoint = {
          id: (payload.meetPointId as string | undefined) ?? null,
          label,
          description:
            (payload.meetPointDescription as string | undefined)?.trim() || null,
        };
      }
      break;
    }
    case "startLoop": {
      if (!room.meetingPoint) {
        return NextResponse.json(
          { message: "Bitte zuerst einen Treffpunkt auswählen." },
          { status: 400 },
        );
      }
      const queue = [...room.attendees].sort(
        (a, b) =>
          new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
      );
      if (queue.length < MIN_PARTICIPANTS) {
        return NextResponse.json(
          { message: "Mindestens zwei Personen notwendig, um ein Loop zu starten." },
          { status: 400 },
        );
      }
      const maxParticipants = Math.min(room.capacity, queue.length);
      const selected = queue.slice(0, maxParticipants);
      const selectedIds = new Set(selected.map((entry) => entry.userId));
      room.attendees = room.attendees.filter(
        (attendee) => !selectedIds.has(attendee.userId),
      );
      const timestamp = nowIso();
      const participants = selected.map<WaitingParticipant>((attendee) => ({
        userId: attendee.userId,
        joinedAt: attendee.joinedAt,
        alias: room.profiles[attendee.userId]?.name ?? attendee.userId,
      }));
      const loop: RoomLoop = {
        id: `loop-${roomId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        participantIds: participants.map((participant) => participant.userId),
        participants,
        createdAt: timestamp,
        meetingPoint: room.meetingPoint,
        scheduledAt: room.scheduledAt ?? timestamp,
        startedAt: timestamp,
        status: "inProgress",
        createdBy: (payload.userId as string | undefined) ?? null,
      };
      room.loops = [loop, ...room.loops].slice(0, MAX_LOOP_HISTORY);
      break;
    }
    case "endLoop": {
      const loopId = payload.loopId as string | undefined;
      if (!loopId) {
        return NextResponse.json(
          { message: "loopId erforderlich" },
          { status: 400 },
        );
      }
      const loop = room.loops.find((item) => item.id === loopId);
      if (!loop) {
        return NextResponse.json(
          { message: "Loop nicht gefunden" },
          { status: 404 },
        );
      }
      if (!loop.endedAt) {
        finalizeLoop(loop, nowIso(), false);
      }
      break;
    }
    default:
      return NextResponse.json({ message: "Unbekannte Aktion" }, { status: 400 });
  }

  return NextResponse.json(serializeRoom(roomId));
}
