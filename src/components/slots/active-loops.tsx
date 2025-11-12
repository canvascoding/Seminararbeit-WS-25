"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { Route } from "next";
import type { Loop, Slot, Venue } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

interface Props {
  venue: Venue;
  slots: Slot[];
  initialLoops: Loop[];
}

function formatTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActiveLoops({ venue, slots, initialLoops }: Props) {
  const t = useTranslations("slots");
  const { firebaseUser } = useAuth();
  const slotIndex = useMemo(() => {
    const map = new Map<string, Slot>();
    slots.forEach((slot) => map.set(slot.id, slot));
    return map;
  }, [slots]);

  const { data: loops = [], refetch } = useQuery({
    queryKey: ["active-loops", venue.id],
    queryFn: async () => {
      const response = await fetch(`/api/active-loops?venueId=${venue.id}`);
      if (!response.ok) throw new Error("Failed to load loops");
      const json = await response.json();
      return json.loops as Loop[];
    },
    initialData: initialLoops,
    refetchInterval: 15_000,
  });
  const [joiningLoopId, setJoiningLoopId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  async function joinLoop(loop: Loop) {
    if (!firebaseUser || !loop.slotId) return;
    setJoiningLoopId(loop.id);
    setJoinError(null);
    try {
      const response = await fetch("/api/slot/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": firebaseUser.uid,
          "x-user-name": firebaseUser.displayName ?? "",
          "x-user-email": firebaseUser.email ?? "",
        },
        body: JSON.stringify({ slotId: loop.slotId }),
      });
      if (!response.ok) {
        throw new Error("join-failed");
      }
      await refetch();
    } catch {
      setJoinError(t("activeLoopsJoinError"));
    } finally {
      setJoiningLoopId(null);
    }
  }

  const statusLabels: Record<string, string> = {
    active: t("activeLoopsStatusActive"),
    inProgress: t("activeLoopsStatusInProgress"),
    scheduled: t("activeLoopsStatusScheduled"),
  };

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-loop-card">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-loop-slate/60">
            {t("activeLoopsHeading")}
          </p>
          <p className="text-loop-slate/70">{t("activeLoopsDescription")}</p>
        </div>
        <Badge tone="success" className="self-start">
          {loops.length}
        </Badge>
      </div>

      {joinError && (
        <p className="mt-3 rounded-2xl bg-loop-rose/10 px-4 py-2 text-sm text-loop-rose">
          {joinError}
        </p>
      )}

      {loops.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-loop-slate/30 px-4 py-3 text-sm text-loop-slate/70">
          {t("activeLoopsEmpty")}
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {loops.map((loop) => {
            const slot = loop.slotId ? slotIndex.get(loop.slotId) : undefined;
            const meetPointFromSlot = slot?.meetPointId
              ? venue.meetPoints.find((point) => point.id === slot.meetPointId)
              : undefined;
            const meetPointLabel =
              loop.meetPoint?.label ??
              meetPointFromSlot?.label ??
              t("activeLoopsMeetPointFallback");
            const meetPointDescription =
              loop.meetPoint?.description ?? meetPointFromSlot?.description ?? "";
            const participantCount =
              loop.participantProfiles?.length ?? loop.participants.length;
            const capacity =
              loop.capacity ?? slot?.capacity ?? venue.capacity ?? 4;
            const timeLabel = formatTime(loop.startAt ?? loop.scheduledAt ?? null);
            const statusLabel = statusLabels[loop.status] ?? loop.status;
            const slotAvailable = participantCount < capacity && Boolean(loop.slotId);

            const userIsParticipant =
              firebaseUser?.uid
                ? loop.participants.includes(firebaseUser.uid) ||
                  loop.participantProfiles?.some(
                    (participant) => participant.userId === firebaseUser.uid,
                  )
                : false;
            const loopLink: Route | null = loop.roomId
              ? `/waiting-room?room=${loop.roomId}${loop.venueId ? `&venue=${loop.venueId}` : ""}` as Route
              : loop.id
                ? `/loop/${loop.id}` as Route
                : null;

            return (
              <div
                key={loop.id}
                className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-loop-slate">
                      {meetPointLabel}
                    </p>
                    <p className="text-sm text-loop-slate/70">
                      {t("activeLoopsParticipants", {
                        count: participantCount,
                        capacity,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={slotAvailable ? "success" : "neutral"}>
                      {participantCount} / {capacity}
                    </Badge>
                    <Badge tone="neutral">{statusLabel}</Badge>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-loop-slate/70">
                  <p>
                    {t("activeLoopsMeetPointLabel")}:{" "}
                    {meetPointDescription
                      ? `${meetPointLabel} · ${meetPointDescription}`
                      : meetPointLabel}
                  </p>
                  {timeLabel && (
                    <p>
                      {t("activeLoopsStartLabel")}: {timeLabel}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {!firebaseUser && (
                    <p className="text-xs text-loop-slate/60">
                      {t("activeLoopsLoginHint")}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 sm:ml-auto">
                    {userIsParticipant && loopLink && (
                      <Button asChild variant="secondary">
                        <Link href={loopLink}>{t("activeLoopsResume")}</Link>
                      </Button>
                    )}
                    <Button
                      className="sm:ml-auto"
                      disabled={
                        !firebaseUser ||
                        !slotAvailable ||
                        joiningLoopId === loop.id ||
                        !loop.slotId
                      }
                      onClick={() => joinLoop(loop)}
                    >
                      {joiningLoopId === loop.id ? t("activeLoopsJoining") : t("activeLoopsJoin")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
