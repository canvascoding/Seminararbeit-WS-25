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
  meetingPoint?: {
    id?: string | null;
    label?: string | null;
    description?: string | null;
  } | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  status?: "inProgress" | "completed";
  durationMinutes?: number;
  autoClosed?: boolean;
}

interface WaitingRoomSnapshot {
  roomId: string;
  capacity: number;
  waiting: WaitingParticipant[];
  loops: WaitingLoop[];
  lastUpdated: string;
  meetingPoint: WaitingLoop["meetingPoint"];
  scheduledAt?: string | null;
}

interface MeetingPointOption {
  id: string;
  label: string;
  description?: string;
}

interface WaitingRoomProps {
  roomId: string;
  venueName?: string | null;
  venueId?: string | null;
  defaultCapacity: number;
  meetPoints?: MeetingPointOption[];
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function formatInputValue(source?: string | Date | null) {
  if (!source) return "";
  const date = source instanceof Date ? source : new Date(source);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => value.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateDisplay(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeDisplay(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WaitingRoom({
  roomId,
  venueName,
  venueId,
  defaultCapacity,
  meetPoints = [],
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
  const [selectedMeetPointId, setSelectedMeetPointId] = useState<string>("");
  const [scheduleInput, setScheduleInput] = useState(() =>
    formatInputValue(new Date()),
  );

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

  useEffect(() => {
    if (data?.meetingPoint?.id) {
      setSelectedMeetPointId(data.meetingPoint.id);
    }
  }, [data?.meetingPoint?.id]);

  useEffect(() => {
    if (data?.scheduledAt) {
      setScheduleInput(formatInputValue(data.scheduledAt));
    }
  }, [data?.scheduledAt]);

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
      let message = t("error");
      try {
        const payload = await response.json();
        if (payload?.message) {
          message = String(payload.message);
        }
      } catch {
        // ignore json errors
      }
      setError(message);
      throw new Error(message);
    }
    await refetch();
  }

  async function handleJoin() {
    if (!userId || !displayName.trim()) {
      setError(t("missingName"));
      return;
    }
    setInfo(null);
    try {
      await mutateRoom({
        action: "join",
        userId,
        displayName: displayName.trim(),
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("loopTestUserName", displayName.trim());
      }
      setInfo(t("joinQueued"));
    } catch {
      // handled in mutateRoom
    }
  }

  async function handleLeave() {
    if (!userId) return;
    setInfo(null);
    try {
      await mutateRoom({ action: "leave", userId });
      setInfo(t("leftRoom"));
    } catch {
      // handled in mutateRoom
    }
  }

  async function handleReset() {
    setInfo(null);
    try {
      await mutateRoom({ action: "reset" });
      setInfo(t("roomCleared"));
    } catch {
      // handled in mutateRoom
    }
  }

  async function handleCapacityChange(value: number) {
    setCapacity(value);
    setUpdatingCapacity(true);
    try {
      await mutateRoom({ action: "configure", capacity: value });
    } catch {
      // handled
    } finally {
      setUpdatingCapacity(false);
    }
  }

  async function handleMeetingPointChange(meetPointId: string) {
    setSelectedMeetPointId(meetPointId);
    if (!meetPointId) {
      return;
    }
    const meetingPoint = meetPoints.find((point) => point.id === meetPointId);
    if (!meetingPoint) {
      setError(t("meetPointMissing"));
      return;
    }
    setInfo(null);
    try {
      await mutateRoom({
        action: "configure",
        meetPointId: meetingPoint.id,
        meetPointLabel: meetingPoint.label,
        meetPointDescription: meetingPoint.description ?? "",
      });
      setInfo(
        t("meetingPointUpdated", {
          label: `${meetingPoint.label}${meetingPoint.description ? ` · ${meetingPoint.description}` : ""}`,
        }),
      );
    } catch {
      // handled
    }
  }

  async function handleScheduleChange(value: string) {
    setScheduleInput(value);
    if (!value) {
      return;
    }
    const isoValue = new Date(value).toISOString();
    setInfo(null);
    try {
      await mutateRoom({ action: "configure", scheduledAt: isoValue });
      setInfo(
        t("scheduleUpdated", {
          time: formatDateDisplay(isoValue),
        }),
      );
    } catch {
      // handled
    }
  }

  async function handleStartLoop() {
    setInfo(null);
    try {
      await mutateRoom({ action: "startLoop", userId });
      setInfo(t("loopStarted"));
    } catch {
      // handled
    }
  }

  async function handleEndLoop(loopId: string) {
    setInfo(null);
    try {
      await mutateRoom({ action: "endLoop", loopId });
      setInfo(t("loopEnded"));
    } catch {
      // handled
    }
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
      data.loops.find(
        (loop) =>
          loop.participantIds.includes(userId) && loop.status !== "completed",
      ) ?? null
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

  const canStartLoop =
    waiting.length >= 2 && !!data?.meetingPoint?.label && !!data?.scheduledAt;
  const meetingPointSummary = data?.meetingPoint?.label
    ? `${data.meetingPoint.label}${data.meetingPoint.description ? ` · ${data.meetingPoint.description}` : ""}`
    : null;
  const scheduleSummary = data?.scheduledAt
    ? formatDateDisplay(data.scheduledAt)
    : null;
  const scheduleMin = formatInputValue(new Date());
  const scheduleMax = formatInputValue(new Date(Date.now() + TWO_HOURS_MS));

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
            {meetingPointSummary && scheduleSummary && (
              <p className="text-xs text-loop-slate/60">
                {t("planningSummary", {
                  meetingPoint: meetingPointSummary,
                  time: scheduleSummary,
                })}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              disabled={updatingCapacity}
            >
              {[2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {t("capacityOption", { value })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs sm:text-sm font-semibold text-loop-slate">
              {t("meetPointLabel")}
            </label>
            {meetPoints.length > 0 ? (
              <select
                className="mt-2 w-full rounded-2xl border border-loop-slate/20 bg-white/70 px-3 py-2 text-xs sm:text-sm min-h-[44px]"
                value={selectedMeetPointId}
                onChange={(event) => handleMeetingPointChange(event.target.value)}
              >
                <option value="">
                  {t("meetPointPlaceholder")}
                </option>
                {meetPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.description
                      ? `${point.label} · ${point.description}`
                      : point.label}
                  </option>
                ))}
                {selectedMeetPointId &&
                  !meetPoints.some((point) => point.id === selectedMeetPointId) && (
                    <option value={selectedMeetPointId}>
                      {meetingPointSummary ?? selectedMeetPointId}
                    </option>
                  )}
              </select>
            ) : (
              <p className="mt-2 rounded-2xl border border-dashed border-loop-slate/30 px-3 py-2 text-xs text-loop-slate/70">
                {t("meetPointMissing")}
              </p>
            )}
            <p className="mt-1 text-xs text-loop-slate/60">{t("meetPointHint")}</p>
          </div>
          <div>
            <label className="text-xs sm:text-sm font-semibold text-loop-slate">
              {t("scheduleLabel")}
            </label>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-2xl border border-loop-slate/20 bg-white/70 px-3 py-2 text-xs sm:text-sm min-h-[44px]"
              value={scheduleInput}
              min={scheduleMin}
              max={scheduleMax}
              onChange={(event) => handleScheduleChange(event.target.value)}
            />
            <p className="mt-1 text-xs text-loop-slate/60">{t("scheduleHint")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button onClick={handleJoin}>{t("joinButton")}</Button>
          <Button variant="ghost" onClick={handleLeave}>
            {t("leaveButton")}
          </Button>
          <Button variant="secondary" onClick={handleStartLoop} disabled={!canStartLoop}>
            {t("startLoopButton")}
          </Button>
          {matchedLoop && (
            <Button variant="danger" onClick={() => handleEndLoop(matchedLoop.id)}>
              {t("endLoopButton")}
            </Button>
          )}
          <Button variant="ghost" onClick={handleReset}>
            {t("resetButton")}
          </Button>
        </div>
        {!canStartLoop && (
          <p className="text-xs text-loop-slate/60">{t("startLoopDisabled")}</p>
        )}
        <p className="text-xs text-loop-slate/60">{t("autoLockHint")}</p>
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
            <p className="mt-1 text-loop-slate/70">{t("matchedDescription")}</p>
            {matchedLoop.meetingPoint?.label && (
              <p className="mt-2 text-loop-slate">
                {t("loopMeetingPoint")}: {matchedLoop.meetingPoint.label}
                {matchedLoop.meetingPoint.description
                  ? ` · ${matchedLoop.meetingPoint.description}`
                  : ""}
              </p>
            )}
            {matchedLoop.scheduledAt && (
              <p className="text-loop-slate/70">
                {t("loopScheduledAt", {
                  time: formatDateDisplay(matchedLoop.scheduledAt),
                })}
              </p>
            )}
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
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-loop-slate">
              {t("participantsHeadline")}
            </h3>
            <Badge tone="neutral" className="shrink-0">
              {waiting.length} / {capacity}
            </Badge>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {waiting.length === 0 && (
              <p className="rounded-xl sm:rounded-2xl border border-dashed border-loop-slate/20 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-loop-slate/70">
                {t("emptyWaiting")}
              </p>
            )}
            {waiting.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center justify-between gap-2 rounded-xl sm:rounded-2xl border border-white/60 bg-white/80 px-2.5 sm:px-4 py-2"
              >
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-xs sm:text-sm font-semibold text-loop-slate truncate">
                    {participant.alias}
                  </p>
                  <p className="text-xs text-loop-slate/50 truncate">
                    {t("joinedAt", {
                      time: formatTimeDisplay(participant.joinedAt),
                    })}
                  </p>
                </div>
                <Badge tone="success" className="shrink-0 text-[10px] sm:text-xs px-2 py-0.5">
                  {t("statusChipWaiting")}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-loop-slate">
              {t("loopsHeadline")}
            </h3>
            <Badge tone="success" className="shrink-0">{loops.length}</Badge>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {loops.length === 0 && (
              <p className="rounded-xl sm:rounded-2xl border border-dashed border-loop-slate/20 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-loop-slate/70">
                {t("emptyLoops")}
              </p>
            )}
            {loops.map((loop) => (
              <div
                key={loop.id}
                className="rounded-xl sm:rounded-2xl border border-white/60 bg-white/80 px-2.5 sm:px-4 py-2 sm:py-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-xs sm:text-sm font-semibold text-loop-slate truncate min-w-0">
                    {t("loopLabel", { id: loop.id })}
                  </p>
                  <Badge tone={loop.status === "inProgress" ? "success" : "neutral"} className="shrink-0 text-[10px] sm:text-xs px-2 py-0.5">
                    {loop.status === "inProgress"
                      ? t("loopStatusActive")
                      : t("loopStatusCompleted")}
                  </Badge>
                </div>
                {loop.meetingPoint?.label && (
                  <p className="mt-1 text-xs sm:text-sm text-loop-slate/80 break-words">
                    {t("loopMeetingPoint")}: {loop.meetingPoint.label}
                    {loop.meetingPoint.description
                      ? ` · ${loop.meetingPoint.description}`
                      : ""}
                  </p>
                )}
                {loop.scheduledAt && (
                  <p className="text-xs text-loop-slate/60 break-words">
                    {t("loopScheduledAt", {
                      time: formatDateDisplay(loop.scheduledAt),
                    })}
                  </p>
                )}
                {loop.startedAt && (
                  <p className="text-xs text-loop-slate/60 break-words">
                    {t("loopStartedAt", {
                      time: formatDateDisplay(loop.startedAt),
                    })}
                  </p>
                )}
                {loop.durationMinutes && loop.status === "completed" && (
                  <p className="text-xs text-loop-slate/60 break-words">
                    {t("loopDuration", { minutes: loop.durationMinutes })}
                    {loop.autoClosed && (
                      <span className="ml-1">· {t("loopAutoClosed")}</span>
                    )}
                  </p>
                )}
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
