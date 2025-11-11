"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface WaitingParticipant {
  userId: string;
  alias: string;
  joinedAt: string;
}

interface WaitingLoop {
  id: string;
  participantIds: string[];
  participants: WaitingParticipant[];
  createdAt: string;
}

interface WaitingRoomSnapshot {
  roomId: string;
  capacity: number;
  waiting: WaitingParticipant[];
  loops: WaitingLoop[];
  lastUpdated: string;
}

interface WaitingRoomProps {
  roomId: string;
  venueName?: string | null;
  venueId?: string | null;
  defaultCapacity: number;
}

export function WaitingRoom({
  roomId,
  venueName,
  venueId,
  defaultCapacity,
}: WaitingRoomProps) {
  const t = useTranslations("waitingRoom");
  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState(defaultCapacity);
  const [updatingCapacity, setUpdatingCapacity] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedId =
      window.localStorage.getItem("loopTestUserId") ?? crypto.randomUUID();
    window.localStorage.setItem("loopTestUserId", storedId);
    setUserId(storedId);

    const storedName = window.localStorage.getItem("loopTestUserName");
    if (storedName) setDisplayName(storedName);

    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    if (venueId) url.searchParams.set("venue", venueId);
    setShareUrl(url.toString());
  }, [roomId, venueId]);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["waiting-room", roomId],
    queryFn: async () => {
      const response = await fetch(`/api/test/waiting-room?roomId=${roomId}`);
      if (!response.ok) {
        throw new Error("Failed to load waiting room");
      }
      return (await response.json()) as WaitingRoomSnapshot;
    },
    refetchInterval: 4_000,
  });

  useEffect(() => {
    if (data?.capacity && data.capacity !== capacity && !updatingCapacity) {
      setCapacity(data.capacity);
    }
  }, [data?.capacity, capacity, updatingCapacity]);

  async function mutateRoom(body: Record<string, unknown>) {
    setError(null);
    const response = await fetch("/api/test/waiting-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        ...body,
      }),
    });
    if (!response.ok) {
      setError(t("error"));
      return;
    }
    await refetch();
  }

  async function handleJoin() {
    if (!userId || !displayName.trim()) {
      setError(t("missingName"));
      return;
    }
    setInfo(null);
    await mutateRoom({
      action: "join",
      userId,
      displayName: displayName.trim(),
    });
    if (typeof window !== "undefined") {
      window.localStorage.setItem("loopTestUserName", displayName.trim());
    }
    setInfo(t("joinQueued"));
  }

  async function handleLeave() {
    if (!userId) return;
    await mutateRoom({ action: "leave", userId });
    setInfo(t("leftRoom"));
  }

  async function handleSpawn(count: number) {
    await mutateRoom({ action: "spawnBot", count });
    setInfo(t("botAdded", { count }));
  }

  async function handleReset() {
    await mutateRoom({ action: "reset" });
    setInfo(t("roomCleared"));
  }

  async function handleCapacityChange(value: number) {
    setCapacity(value);
    setUpdatingCapacity(true);
    await mutateRoom({ action: "configure", capacity: value });
    setUpdatingCapacity(false);
  }

  async function handleCopy() {
    if (
      typeof navigator === "undefined" ||
      !shareUrl ||
      !navigator.clipboard?.writeText
    ) {
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1_500);
  }

  const matchedLoop = useMemo(() => {
    if (!userId || !data) return null;
    return (
      data.loops.find((loop) => loop.participantIds.includes(userId)) ?? null
    );
  }, [data, userId]);

  const isWaiting =
    !!userId && !!data?.waiting?.some((attendee) => attendee.userId === userId);

  const waiting = data?.waiting ?? [];
  const loops = data?.loops ?? [];
  const lastUpdatedLabel = useMemo(() => {
    if (!data?.lastUpdated) return null;
    return new Date(data.lastUpdated).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [data?.lastUpdated]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-wide text-loop-slate/60">
              {t("roomLabel")}
            </p>
            <p className="text-xl sm:text-2xl font-semibold text-loop-slate break-all">{roomId}</p>
            {venueName && (
              <p className="text-xs sm:text-sm text-loop-slate/60">
                {t("roomVenue", { venue: venueName })}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 md:w-1/2">
            <label className="text-xs sm:text-sm font-medium text-loop-slate">
              {t("shareLabel")}
            </label>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="flex-1 text-xs sm:text-sm" />
              <Button onClick={handleCopy} variant="ghost" className="shrink-0">
                {copied ? t("copied") : t("copy")}
              </Button>
            </div>
            <p className="text-xs text-loop-slate/60">{t("joinHint")}</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-[2fr,1fr]">
          <div>
            <label className="text-xs sm:text-sm font-semibold text-loop-slate">
              {t("nameLabel")}
            </label>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t("namePlaceholder")}
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-semibold text-loop-slate">
              {t("capacityLabel")}
            </label>
            <select
              className="mt-2 w-full rounded-2xl border border-loop-slate/20 bg-white/70 px-3 py-2 text-xs sm:text-sm min-h-[44px]"
              value={capacity}
              onChange={(event) => handleCapacityChange(Number(event.target.value))}
            >
              {[2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {t("capacityOption", { value })}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button onClick={handleJoin}>{t("joinButton")}</Button>
          <Button variant="ghost" onClick={handleLeave}>
            {t("leaveButton")}
          </Button>
          <Button variant="secondary" onClick={() => handleSpawn(1)} className="text-xs sm:text-sm">
            {t("spawnBot")}
          </Button>
          <Button variant="secondary" onClick={() => handleSpawn(2)} className="text-xs sm:text-sm">
            {t("spawnBotMany")}
          </Button>
          <Button variant="ghost" onClick={handleReset}>
            {t("resetButton")}
          </Button>
        </div>
        {info && (
          <p className="rounded-2xl bg-loop-green/10 px-4 py-2 text-sm text-loop-green">
            {info}
          </p>
        )}
        {error && (
          <p className="rounded-2xl bg-loop-rose/10 px-4 py-2 text-sm text-loop-rose">
            {error}
          </p>
        )}
        <p className="text-sm text-loop-slate/70">
          {matchedLoop
            ? t("statusMatched", { loopId: matchedLoop.id })
            : isWaiting
              ? t("statusWaiting")
              : t("statusIdle")}
        </p>
        {matchedLoop && (
          <div className="rounded-2xl border border-loop-green/30 bg-loop-green/5 px-4 py-3 text-sm text-loop-slate">
            <p className="font-semibold">
              {t("matchedHeadline", { loopId: matchedLoop.id })}
            </p>
            <p className="mt-1 text-loop-slate/70">
              {t("matchedDescription")}
            </p>
            <p className="mt-3 text-xs uppercase tracking-wide text-loop-slate/60">
              {t("matchedParticipantsHeadline")}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {matchedLoop.participants.map((participant) => (
                <Badge
                  key={participant.userId}
                  tone={participant.userId === userId ? "success" : "neutral"}
                >
                  {participant.userId === userId
                    ? t("matchedParticipantsYou", { name: participant.alias })
                    : participant.alias}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {isFetching && lastUpdatedLabel && (
          <p className="text-xs text-loop-slate/50">
            {t("updating", { time: lastUpdatedLabel })}
          </p>
        )}
      </Card>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-loop-slate">
              {t("participantsHeadline")}
            </h3>
            <Badge tone="neutral">
              {waiting.length} / {capacity}
            </Badge>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-loop-slate/60">{t("demoNote")}</p>
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            {waiting.length === 0 && (
              <p className="rounded-2xl border border-dashed border-loop-slate/20 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-loop-slate/70">
                {t("emptyWaiting")}
              </p>
            )}
            {waiting.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center justify-between gap-2 rounded-xl sm:rounded-2xl border border-white/60 bg-white/80 px-3 sm:px-4 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-loop-slate truncate">
                    {participant.alias}
                  </p>
                  <p className="text-xs text-loop-slate/50">
                    {t("joinedAt", {
                      time: new Date(participant.joinedAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }),
                    })}
                  </p>
                </div>
                <Badge tone="success" className="shrink-0">{t("statusChipWaiting")}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-loop-slate">
              {t("loopsHeadline")}
            </h3>
            <Badge tone="success">{loops.length}</Badge>
          </div>
          <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
            {loops.length === 0 && (
              <p className="rounded-2xl border border-dashed border-loop-slate/20 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-loop-slate/70">
                {t("emptyLoops")}
              </p>
            )}
            {loops.map((loop) => (
              <div
                key={loop.id}
                className="rounded-xl sm:rounded-2xl border border-white/60 bg-white/80 px-3 sm:px-4 py-2 sm:py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm font-semibold text-loop-slate truncate">
                    {t("loopLabel", { id: loop.id })}
                  </p>
                  <Badge tone="neutral" className="shrink-0 text-xs">
                    {new Date(loop.createdAt).toLocaleTimeString("de-DE", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Badge>
                </div>
                <p className="mt-2 text-xs sm:text-sm text-loop-slate/70 break-words">
                  {loop.participants.map((p) => p.alias).join(", ")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
