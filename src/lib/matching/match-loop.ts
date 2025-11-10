import type { SlotAttendee } from "@/types/domain";

export interface MatchResult {
  loops: { participantIds: string[] }[];
  waiting: SlotAttendee[];
}

export function buildMatches(
  attendees: SlotAttendee[],
  capacity: number,
): MatchResult {
  const sorted = attendees
    .filter((attendee) => attendee.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime(),
    );

  const participantSlots = Math.max(2, Math.min(capacity, 4));
  const loops: MatchResult["loops"] = [];

  while (sorted.length >= 2) {
    let chunkSize = Math.min(participantSlots, sorted.length);
    if (chunkSize % 2 !== 0 && chunkSize !== 2) {
      chunkSize -= 1;
    }
    if (chunkSize < 2) {
      break;
    }
    const chunk = sorted.splice(0, chunkSize);
    loops.push({
      participantIds: chunk.map((item) => item.userId),
    });
  }

  return {
    loops,
    waiting: sorted,
  };
}
