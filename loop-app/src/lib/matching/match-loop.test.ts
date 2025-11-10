import { describe, expect, it } from "vitest";
import { buildMatches } from "./match-loop";

const buildAttendee = (idx: number, minuteOffset = idx) => ({
  slotId: "slot-1",
  userId: `user-${idx}`,
  joinedAt: new Date(2024, 0, 1, 12, minuteOffset).toISOString(),
  status: "pending" as const,
});

describe("buildMatches", () => {
  it("gruppiert Teilnehmer:innen in Loops der Slot-Kapazität", () => {
    const attendees = Array.from({ length: 4 }, (_, i) => buildAttendee(i));
    const result = buildMatches(attendees, 4);
    expect(result.loops).toHaveLength(1);
    expect(result.loops[0].participantIds).toEqual([
      "user-0",
      "user-1",
      "user-2",
      "user-3",
    ]);
    expect(result.waiting).toHaveLength(0);
  });

  it("belässt Teilnehmende in der Warteschlange wenn nicht genügend Personen vorhanden sind", () => {
    const attendees = [buildAttendee(0), buildAttendee(1), buildAttendee(2)];
    const result = buildMatches(attendees, 4);
    expect(result.loops).toHaveLength(1);
    expect(result.waiting).toHaveLength(1);
    expect(result.waiting[0].userId).toBe("user-2");
  });

  it("erzwingt mindestens 2 Personen pro Loop auch bei Slots mit Kapazität 2", () => {
    const attendees = [
      buildAttendee(0),
      buildAttendee(1),
      buildAttendee(2),
      buildAttendee(3),
      buildAttendee(4),
    ];
    const result = buildMatches(attendees, 2);
    expect(result.loops).toHaveLength(2);
    expect(result.waiting).toHaveLength(1);
  });
});
