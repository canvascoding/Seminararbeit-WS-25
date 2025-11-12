"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";
import { MeetingMap } from "./meeting-map";

interface ParticipantLocation {
  lat: number;
  lng: number;
  updatedAt: string;
}

interface WaitingParticipant {
  userId: string;
  alias: string;
  joinedAt: string;
  email?: string | null;
  location?: ParticipantLocation | null;
}

interface LoopMessage {
  id: string;
  userId: string;
  alias: string;
  text: string;
  sentAt: string;
}

type FeedbackRating = "great" | "ok" | "bad";

interface LoopFeedback {
  rating: FeedbackRating;
  note?: string | null;
  submittedAt?: string | null;
  submittedBy?: string | null;
}

interface WaitingLoop {
  id: string;
  ownerId?: string;
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
  status?: "waitingRoom" | "active" | "inProgress" | "completed";
  durationMinutes?: number;
  autoClosed?: boolean;
  messages?: LoopMessage[];
  feedback?: LoopFeedback | null;
}

interface WaitingRoomSnapshot {
  roomId: string;
  capacity: number;
  capacityConfirmed?: boolean;
  waiting: WaitingParticipant[];
  loops: WaitingLoop[];
  lastUpdated: string;
  meetingPoint: WaitingLoop["meetingPoint"];
  scheduledAt?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  status?: "waitingRoom" | "active" | "completed";
  venueId?: string | null;
  venueName?: string | null;
  setupComplete?: boolean;
}

interface MeetingPointOption {
  id: string;
  label: string;
  description?: string;
  instructions?: string;
  geoOffset?: { lat: number; lng: number };
}

interface WaitingRoomProps {
  roomId: string;
  venueName?: string | null;
  venueId?: string | null;
  venueGeo?: { lat: number; lng: number } | null;
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
  venueGeo,
  defaultCapacity,
  meetPoints = [],
}: WaitingRoomProps) {
  const t = useTranslations("waitingRoom");
  const { firebaseUser, profile, mockMode } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [localMockUserId, setLocalMockUserId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capacity, setCapacity] = useState(defaultCapacity);
  const [capacitySelection, setCapacitySelection] = useState<string>("");
  const [updatingCapacity, setUpdatingCapacity] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMeetPointId, setSelectedMeetPointId] = useState<string>("");
  const [scheduleInput, setScheduleInput] = useState(() =>
    formatInputValue(new Date()),
  );
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [chatNotice, setChatNotice] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<FeedbackRating | "">("");
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const userId = firebaseUser?.uid ?? localMockUserId;
  const ownerName = useMemo(() => {
    if (profile?.displayName) return profile.displayName;
    if (firebaseUser?.displayName) return firebaseUser.displayName;
    if (displayName.trim()) return displayName.trim();
    return undefined;
  }, [profile?.displayName, firebaseUser?.displayName, displayName]);
  const claimRequested = useRef(false);
  useEffect(() => {
    claimRequested.current = false;
  }, [roomId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!mockMode) {
      setLocalMockUserId(null);
      return;
    }
    const storedId =
      window.localStorage.getItem("loopTestUserId") ?? crypto.randomUUID();
    window.localStorage.setItem("loopTestUserId", storedId);
    setLocalMockUserId(storedId);

    const storedName = window.localStorage.getItem("loopTestUserName");
    if (storedName && !displayName) setDisplayName(storedName);
  }, [mockMode, displayName]);

  useEffect(() => {
    if (profile?.displayName && !displayName) {
      setDisplayName(profile.displayName);
    }
  }, [profile?.displayName, displayName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("room", roomId);
    if (venueId) url.searchParams.set("venue", venueId);
    try {
      window.history.replaceState({}, "", `${url.pathname}${url.search}`);
    } catch {
      // ignore history errors
    }
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
    enabled: Boolean(roomId),
  });

  useEffect(() => {
    if (
      typeof data?.capacity === "number" &&
      data.capacity !== capacity &&
      !updatingCapacity
    ) {
      setCapacity(data.capacity);
    }
  }, [data?.capacity, capacity, updatingCapacity]);

  useEffect(() => {
    if (!data || updatingCapacity) return;
    if (data.capacityConfirmed) {
      setCapacitySelection(
        typeof data.capacity === "number" ? String(data.capacity) : "",
      );
    } else {
      setCapacitySelection("");
    }
  }, [data, updatingCapacity]);

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

  const setupComplete = data?.setupComplete ?? false;
  const capacityConfirmed = data?.capacityConfirmed ?? false;
  const waitingRoomLocked = !setupComplete;

  const mutateRoom = useCallback(
    async (body: Record<string, unknown>) => {
      setError(null);
      const payload: Record<string, unknown> = {
        roomId,
        ...body,
      };
      if (userId) payload.userId = userId;
      if (ownerName) payload.ownerName = ownerName;
      if (venueId) payload.venueId = venueId;
      const resolvedVenueName = data?.venueName ?? venueName;
      if (resolvedVenueName) payload.venueName = resolvedVenueName;
      const response = await fetch("/api/test/waiting-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let message = t("error");
        try {
          const payloadResponse = await response.json();
          if (payloadResponse?.message) {
            message = String(payloadResponse.message);
          }
        } catch {
          // ignore json errors
        }
        setError(message);
        throw new Error(message);
      }
      await refetch();
    },
    [data?.venueName, ownerName, refetch, roomId, t, userId, venueId, venueName],
  );

  useEffect(() => {
    if (!userId || !data) return;
    const currentOwnerId = data.ownerId;
    if (currentOwnerId && currentOwnerId !== userId) {
      claimRequested.current = true;
      return;
    }
    if (currentOwnerId === userId) {
      claimRequested.current = true;
      return;
    }
    if (claimRequested.current) return;
    claimRequested.current = true;
    mutateRoom({ action: "claim" }).catch(() => {
      claimRequested.current = false;
    });
  }, [data, mutateRoom, userId]);

  async function handleJoin() {
    if (!userId || !displayName.trim()) {
      setError(t("missingName"));
      return;
    }
    setInfo(null);
    try {
      await mutateRoom({
        action: "join",
        displayName: displayName.trim(),
        email: profile?.email ?? firebaseUser?.email ?? "",
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("loopTestUserName", displayName.trim());
      }
      setInfo(t("joinConfirmed"));
    } catch {
      // handled in mutateRoom
    }
  }

  async function handleReset() {
    if (!isOwner) return;
    setInfo(null);
    try {
      await mutateRoom({ action: "reset" });
      setInfo(t("roomCleared"));
    } catch {
      // handled in mutateRoom
    }
  }

  async function handleCapacityChange(value: string) {
    if (!isOwner) return;
    if (!value) {
      setCapacitySelection("");
      return;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return;
    }
    setCapacity(numeric);
    setCapacitySelection(value);
    setUpdatingCapacity(true);
    try {
      await mutateRoom({ action: "configure", capacity: numeric });
    } catch {
      // handled
    } finally {
      setUpdatingCapacity(false);
    }
  }

  async function handleMeetingPointChange(meetPointId: string) {
    if (!isOwner) return;
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
    if (!isOwner) return;
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
    if (!isOwner) return;
    if (waitingRoomLocked) {
      setError(t("setupOwnerNotice"));
      return;
    }
    setInfo(null);
    try {
      await mutateRoom({ action: "startLoop" });
      setInfo(t("loopStarted"));
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

  async function handleSendChatMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!matchedLoop || !chatMessage.trim()) {
      return;
    }
    setChatNotice(null);
    setSendingChat(true);
    try {
      await mutateRoom({
        action: "chat",
        loopId: matchedLoop.id,
        message: chatMessage.trim(),
      });
      setChatMessage("");
    } catch {
      setChatNotice(t("chatError"));
    } finally {
      setSendingChat(false);
    }
  }

  async function handleSubmitFeedback(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!matchedLoop || !isOwner) {
      return;
    }
    if (!feedbackRating) {
      setFeedbackError(t("feedbackMissingRating"));
      return;
    }
    setFeedbackSubmitting(true);
    setFeedbackError(null);
    try {
      await mutateRoom({
        action: "endLoop",
        loopId: matchedLoop.id,
        feedbackRating,
        feedbackNote: feedbackNotes.trim(),
      });
      setFeedbackVisible(false);
      setFeedbackRating("");
      setFeedbackNotes("");
      setInfo(t("loopEnded"));
    } catch {
      setFeedbackError(t("feedbackSubmitError"));
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  const matchedLoop = useMemo(() => {
    if (!userId || !data) return null;
    return (
      data.loops.find(
        (loop) =>
          loop.status !== "completed" &&
          (loop.participantIds.includes(userId) || loop.ownerId === userId),
      ) ?? null
    );
  }, [data, userId]);

  const loopIdForLocation = matchedLoop?.id ?? null;

  const activeLoop = useMemo(() => {
    if (!data) return null;
    return data.loops.find((loop) => loop.status === "active") ?? null;
  }, [data]);

  const displayedLoop = matchedLoop ?? activeLoop ?? null;
  const activeParticipants = displayedLoop?.participants ?? [];

  useEffect(() => {
    setChatNotice(null);
    setChatMessage("");
    setFeedbackVisible(false);
    setFeedbackRating("");
    setFeedbackNotes("");
    setFeedbackError(null);
  }, [matchedLoop?.id]);

  useEffect(() => {
    if (!loopIdForLocation || !userId) {
      setLocationNotice(null);
      lastLocationRef.current = null;
      return;
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationNotice(t("locationUnsupported"));
      return;
    }
    const successHandler: PositionCallback = (position) => {
      setLocationNotice(null);
      const lat = Number(position.coords.latitude.toFixed(6));
      const lng = Number(position.coords.longitude.toFixed(6));
      const now = Date.now();
      const last = lastLocationRef.current;
      if (
        last &&
        now - last.timestamp < 30_000 &&
        Math.abs(last.lat - lat) < 0.0005 &&
        Math.abs(last.lng - lng) < 0.0005
      ) {
        return;
      }
      lastLocationRef.current = { lat, lng, timestamp: now };
      mutateRoom({ action: "location", lat, lng }).catch(() => {
        // ignore network errors to avoid noisy UI
      });
    };
    const errorHandler: PositionErrorCallback = (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        setLocationNotice(t("locationPermissionDenied"));
      } else {
        setLocationNotice(t("locationUnavailable"));
      }
    };
    const watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 10_000,
    });
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [loopIdForLocation, mutateRoom, t, userId]);

  const resolvedVenueName = data?.venueName ?? venueName ?? null;

  const ownerId = data?.ownerId ?? null;
  const ownerDisplayName = data?.ownerName ?? null;
  const isOwner = Boolean(userId && ownerId === userId);
  const loopTitle = ownerDisplayName
    ? t("loopTitleHost", { owner: ownerDisplayName })
    : t("loopTitleFallback");
  const roomStatus = data?.status ?? "waitingRoom";
  const statusLabelKey =
    roomStatus === "active"
      ? "roomStatusActive"
      : roomStatus === "waitingRoom"
        ? "roomStatusWaiting"
        : "roomStatusCompleted";
  const statusTone: "success" | "neutral" | "warning" =
    roomStatus === "active"
      ? "success"
      : roomStatus === "waitingRoom"
        ? "neutral"
        : "warning";
  const ownerBadgeLabel = isOwner
    ? t("ownerYouBadge")
    : ownerDisplayName
      ? t("ownerOtherBadge", { owner: ownerDisplayName })
      : null;
  const ownerHint =
    !isOwner && ownerDisplayName ? t("ownerLockedHint", { owner: ownerDisplayName }) : null;
  const participantCount = activeParticipants.length;
  const hostLabel = displayedLoop?.ownerName ?? ownerDisplayName ?? t("loopFallbackOwner");
  const statusMessage = matchedLoop
    ? t("statusMatched", { owner: hostLabel })
    : displayedLoop
      ? t("statusWatching", { owner: hostLabel })
      : isOwner
        ? t("statusIdleOwner")
        : t("statusIdleGuest");
  const loops = data?.loops ?? [];
  const lastUpdatedLabel = useMemo(() => {
    if (!data?.lastUpdated) return null;
    return new Date(data.lastUpdated).toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [data?.lastUpdated]);
  const setupNotice = waitingRoomLocked
    ? isOwner
      ? t("setupOwnerNotice")
      : t("setupGuestNotice")
    : null;
  const canJoinLoop =
    !isOwner && displayedLoop?.status === "active" && !matchedLoop;
  const joinDisabled = !displayName.trim();
  const canSendChat = Boolean(chatMessage.trim()) && !sendingChat && Boolean(matchedLoop);

  const activeMessages = useMemo(() => {
    if (!displayedLoop?.messages) return [];
    return [...displayedLoop.messages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );
  }, [displayedLoop?.messages]);

  const activeMeetPointOption = useMemo(() => {
    if (!displayedLoop?.meetingPoint?.id) return null;
    return (
      meetPoints.find((point) => point.id === displayedLoop.meetingPoint?.id) ?? null
    );
  }, [displayedLoop?.meetingPoint?.id, meetPoints]);

  const participantMarkers = useMemo(() => {
    if (!displayedLoop?.participants) return [];
    return displayedLoop.participants
      .map((participant) => {
        if (!participant.location) return null;
        const isSelf = participant.userId === userId;
        return {
          userId: participant.userId,
          alias: participant.alias,
          lat: participant.location.lat,
          lng: participant.location.lng,
          updatedAt: participant.location.updatedAt,
          isSelf,
          label: isSelf
            ? t("matchedParticipantsYou", { name: participant.alias })
            : participant.alias,
        };
      })
      .filter((marker): marker is {
        userId: string;
        alias: string;
        lat: number;
        lng: number;
        updatedAt: string;
        isSelf: boolean;
        label: string;
      } => Boolean(marker));
  }, [displayedLoop?.participants, t, userId]);

  const mapCenter = useMemo(() => {
    if (activeMeetPointOption?.geoOffset) return activeMeetPointOption.geoOffset;
    if (participantMarkers.length > 0) {
      const lat =
        participantMarkers.reduce((sum, marker) => sum + marker.lat, 0) /
        participantMarkers.length;
      const lng =
        participantMarkers.reduce((sum, marker) => sum + marker.lng, 0) /
        participantMarkers.length;
      return { lat, lng };
    }
    if (venueGeo) return venueGeo;
    return null;
  }, [activeMeetPointOption?.geoOffset, participantMarkers, venueGeo]);

  const mapMarkers = useMemo(() => {
    const markers: Array<{
      lat: number;
      lng: number;
      tone: "meeting" | "participant" | "self";
      label: string;
    }> = [];

    const meetingPointCoords =
      (activeMeetPointOption?.geoOffset &&
        typeof activeMeetPointOption.geoOffset.lat === "number" &&
        typeof activeMeetPointOption.geoOffset.lng === "number" && {
          lat: activeMeetPointOption.geoOffset.lat,
          lng: activeMeetPointOption.geoOffset.lng,
        }) ||
      venueGeo;

    if (meetingPointCoords) {
      markers.push({
        lat: meetingPointCoords.lat,
        lng: meetingPointCoords.lng,
        tone: "meeting",
        label:
          activeMeetPointOption?.label ??
          displayedLoop?.meetingPoint?.label ??
          t("mapLegendMeetingPoint"),
      });
    }

    participantMarkers.forEach((marker) => {
      markers.push({
        lat: marker.lat,
        lng: marker.lng,
        tone: marker.isSelf ? "self" : "participant",
        label: marker.label,
      });
    });
    return markers;
  }, [
    activeMeetPointOption?.geoOffset,
    activeMeetPointOption?.label,
    displayedLoop?.meetingPoint?.label,
    participantMarkers,
    t,
    venueGeo,
  ]);
  const selectedMeetingPoint = useMemo(
    () => meetPoints.find((point) => point.id === selectedMeetPointId) ?? null,
    [meetPoints, selectedMeetPointId],
  );
  const feedbackOptions = useMemo(
    () => [
      { value: "great" as FeedbackRating, label: t("feedbackOptionGreat") },
      { value: "ok" as FeedbackRating, label: t("feedbackOptionOk") },
      { value: "bad" as FeedbackRating, label: t("feedbackOptionBad") },
    ],
    [t],
  );

  const canStartLoop =
    isOwner &&
    setupComplete &&
    roomStatus !== "active" &&
    !!data?.meetingPoint?.label &&
    !!data?.scheduledAt &&
    !activeLoop;
  const meetingPointSummary = data?.meetingPoint?.label
    ? `${data.meetingPoint.label}${data.meetingPoint.description ? ` · ${data.meetingPoint.description}` : ""}`
    : null;
  const scheduleSummary = data?.scheduledAt
    ? formatDateDisplay(data.scheduledAt)
    : null;
  const hasGuestsInActiveLoop =
    Boolean(activeLoop) &&
    activeParticipants.some((participant) => participant.userId !== userId);
  const canResetRoom = isOwner && !hasGuestsInActiveLoop;
  const canShowEndLoop =
    Boolean(isOwner && matchedLoop?.status === "active" && matchedLoop.participantIds.some((id) => id !== userId));
  const scheduleMin = formatInputValue(new Date());
  const scheduleMax = formatInputValue(new Date(Date.now() + TWO_HOURS_MS));

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-loop-slate/60">
              {t("roomLabel")}
            </p>
            <p className="text-2xl font-semibold text-loop-slate break-words">
              {loopTitle}
            </p>
            {resolvedVenueName && (
              <p className="text-sm text-loop-slate/60">
                {t("roomVenue", { venue: resolvedVenueName })}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 md:w-1/2">
            <label className="text-sm font-medium text-loop-slate">
              {t("shareLabel")}
            </label>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="flex-1 text-sm" />
              <Button onClick={handleCopy} variant="ghost" className="shrink-0">
                {copied ? t("copied") : t("copy")}
              </Button>
            </div>
            <p className="text-sm text-loop-slate/60">{t("joinHint")}</p>
            {meetingPointSummary && scheduleSummary && (
              <p className="text-sm text-loop-slate/60">
                {t("planningSummary", {
                  meetingPoint: meetingPointSummary,
                  time: scheduleSummary,
                })}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge tone={statusTone}>{t(statusLabelKey)}</Badge>
              {ownerBadgeLabel && <Badge tone={isOwner ? "success" : "neutral"}>{ownerBadgeLabel}</Badge>}
            </div>
            {ownerHint && (
              <p className="text-sm text-loop-slate/60">
                {ownerHint}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-semibold text-loop-slate">
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
            <label className="text-sm font-semibold text-loop-slate">
              {t("capacityLabel")}
            </label>
            <select
              className="mt-2 w-full rounded-2xl border border-loop-slate/20 bg-white/70 px-3 py-2 text-sm min-h-[44px]"
              value={capacitySelection}
              onChange={(event) => handleCapacityChange(event.target.value)}
              disabled={updatingCapacity || !isOwner}
            >
              <option value="">{t("capacityPlaceholder")}</option>
              {[2, 3, 4].map((value) => (
                <option key={value} value={value}>
                  {t("capacityOption", { value })}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-loop-slate/60">
              {capacityConfirmed
                ? t("capacityConfirmedHint", { value: capacity })
                : t("capacityRequiredHint")}
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold text-loop-slate">
              {t("meetPointLabel")}
            </label>
            {meetPoints.length > 0 ? (
              <select
                className="mt-2 w-full rounded-2xl border border-loop-slate/20 bg-white/70 px-3 py-2 text-sm min-h-[44px]"
                value={selectedMeetPointId}
                onChange={(event) => handleMeetingPointChange(event.target.value)}
                disabled={!isOwner}
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
              <p className="mt-2 rounded-2xl border border-dashed border-loop-slate/30 px-3 py-2 text-sm text-loop-slate/70">
                {t("meetPointMissing")}
              </p>
            )}
            <p className="mt-1 text-sm text-loop-slate/60">{t("meetPointHint")}</p>
            {selectedMeetingPoint?.instructions && (
              <p className="text-sm text-loop-slate/60">{selectedMeetingPoint.instructions}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-loop-slate">
              {t("scheduleLabel")}
            </label>
            <input
              type="datetime-local"
              className="mt-2 w-full rounded-2xl border border-loop-slate/20 bg-white/70 px-3 py-2 text-sm min-h-[44px]"
              value={scheduleInput}
              min={scheduleMin}
              max={scheduleMax}
              onChange={(event) => handleScheduleChange(event.target.value)}
              disabled={!isOwner}
            />
            <p className="mt-1 text-sm text-loop-slate/60">{t("scheduleHint")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {canJoinLoop && (
            <Button onClick={handleJoin} disabled={joinDisabled}>
              {t("joinButton")}
            </Button>
          )}
          {isOwner && (
            <>
              <Button variant="secondary" onClick={handleStartLoop} disabled={!canStartLoop}>
                {t("startLoopButton")}
              </Button>
              <Button variant="ghost" onClick={handleReset} disabled={!canResetRoom}>
                {t("resetButton")}
              </Button>
            </>
          )}
        </div>
        {setupNotice && (
          <p className="text-sm text-loop-rose/70">{setupNotice}</p>
        )}
        {!canStartLoop && isOwner && (
          <p className="text-sm text-loop-slate/60">{t("startLoopDisabled")}</p>
        )}
        <p className="text-sm text-loop-slate/60">{t("autoLockHint")}</p>
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
        <p className="text-sm text-loop-slate/70">{statusMessage}</p>
        {displayedLoop && (
          <div className="rounded-2xl border border-loop-green/30 bg-loop-green/5 px-4 py-4 text-sm text-loop-slate">
            <div className="space-y-3">
              <div>
                <p className="font-semibold">
                  {t("matchedHeadline", { owner: hostLabel })}
                </p>
                <p className="mt-1 text-loop-slate/70">{t("matchedDescription")}</p>
              </div>
              {displayedLoop.meetingPoint?.label && (
                <p className="text-loop-slate">
                  {t("loopMeetingPoint")}: {displayedLoop.meetingPoint.label}
                  {displayedLoop.meetingPoint.description
                    ? ` · ${displayedLoop.meetingPoint.description}`
                    : ""}
                </p>
              )}
              {displayedLoop.scheduledAt && (
                <p className="text-loop-slate/70">
                  {t("loopScheduledAt", {
                    time: formatDateDisplay(displayedLoop.scheduledAt),
                  })}
                </p>
              )}
              <p className="mt-2 text-sm uppercase tracking-wide text-loop-slate/60">
                {t("matchedParticipantsHeadline")}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeParticipants.map((participant) => (
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
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-loop-slate/20 bg-white/80 p-3">
                  <p className="text-sm uppercase tracking-wide text-loop-slate/60">
                    {t("mapHeadline")}
                  </p>
                  {mapCenter ? (
                    <>
                      <div className="mt-2 overflow-hidden rounded-2xl border border-loop-slate/10 bg-white">
                        <MeetingMap center={mapCenter} markers={mapMarkers} />
                      </div>
                      <ul className="mt-2 text-xs text-loop-slate/60 space-y-0.5">
                        <li>{t("mapLegendMeetingPoint")}</li>
                        <li>{t("mapLegendParticipant")}</li>
                        <li>{t("mapLegendSelf")}</li>
                      </ul>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-loop-slate/70">
                      {t("mapUnavailable")}
                    </p>
                  )}
                  {activeMeetPointOption?.instructions && (
                    <p className="mt-2 text-sm text-loop-slate/70">
                      {activeMeetPointOption.instructions}
                    </p>
                  )}
                  {locationNotice && (
                    <p className="mt-2 text-xs text-loop-rose/70">{locationNotice}</p>
                  )}
                </div>
                <div className="rounded-2xl border border-loop-green/20 bg-white/80 p-3">
                  <p className="text-sm uppercase tracking-wide text-loop-slate/60">
                    {t("chatHeadline")}
                  </p>
                  <div className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
                    {activeMessages.length === 0 ? (
                      <p className="text-sm text-loop-slate/60">{t("chatEmpty")}</p>
                    ) : (
                      activeMessages.map((message) => (
                        <div
                          key={message.id}
                          className="rounded-xl border border-loop-slate/10 bg-white/70 px-3 py-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-loop-slate truncate">
                              {message.alias}
                            </p>
                            <p className="text-xs text-loop-slate/50">
                              {formatTimeDisplay(message.sentAt)}
                            </p>
                          </div>
                          <p className="mt-1 text-sm text-loop-slate break-words">
                            {message.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  <form className="mt-3 flex flex-col gap-2" onSubmit={handleSendChatMessage}>
                    <Input
                      value={chatMessage}
                      onChange={(event) => setChatMessage(event.target.value)}
                      placeholder={t("chatPlaceholder")}
                      disabled={sendingChat}
                    />
                    <Button type="submit" disabled={!canSendChat}>
                      {t("chatSend")}
                    </Button>
                  </form>
                  {chatNotice && (
                    <p className="mt-1 text-sm text-loop-rose/70">{chatNotice}</p>
                  )}
                </div>
              </div>
              {canShowEndLoop && matchedLoop && (
                <div className="mt-4 rounded-2xl border border-loop-slate/20 bg-white/90 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-loop-slate">
                      {t("feedbackHeadline")}
                    </p>
                    <Button
                      type="button"
                      variant={feedbackVisible ? "ghost" : "danger"}
                      onClick={() => {
                        setFeedbackVisible((prev) => !prev);
                        setFeedbackError(null);
                      }}
                    >
                      {feedbackVisible ? t("feedbackCancel") : t("endLoopButton")}
                    </Button>
                  </div>
                  {feedbackVisible ? (
                    <form className="mt-3 space-y-3" onSubmit={handleSubmitFeedback}>
                      <p className="text-sm text-loop-slate/70">
                        {t("feedbackIntro")}
                      </p>
                      <div className="flex flex-col gap-2">
                        {feedbackOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 rounded-xl border border-loop-slate/20 bg-white/70 px-3 py-2 text-sm text-loop-slate"
                          >
                            <input
                              type="radio"
                              name="feedbackRating"
                              className="accent-loop-green"
                              value={option.value}
                              checked={feedbackRating === option.value}
                              onChange={() => setFeedbackRating(option.value)}
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-loop-slate">
                          {t("feedbackNoteLabel")}
                        </label>
                        <Textarea
                          value={feedbackNotes}
                          onChange={(event) => setFeedbackNotes(event.target.value)}
                          placeholder={t("feedbackNotePlaceholder")}
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                      {feedbackError && (
                        <p className="text-sm text-loop-rose/70">{feedbackError}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={feedbackSubmitting}>
                          {t("feedbackSubmit")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setFeedbackVisible(false);
                            setFeedbackError(null);
                          }}
                        >
                          {t("feedbackCancel")}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-2 text-sm text-loop-slate/70">
                      {t("feedbackPrompt")}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {isFetching && lastUpdatedLabel && (
          <p className="text-sm text-loop-slate/50">
            {t("updating", { time: lastUpdatedLabel })}
          </p>
        )}
      </Card>

      <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-lg font-semibold text-loop-slate">
              {t("participantsHeadline")}
            </h3>
            <Badge tone="neutral" className="shrink-0">
              {participantCount} / {capacity}
            </Badge>
          </div>
          <div className="space-y-3">
            {participantCount === 0 && (
              <p className="rounded-2xl border border-dashed border-loop-slate/20 px-4 py-3 text-sm text-loop-slate/70">
                {t("emptyWaiting")}
              </p>
            )}
            {activeParticipants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/80 px-3.5 sm:px-4 py-2.5"
              >
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-loop-slate truncate">
                    {participant.alias}
                  </p>
                  <p className="text-sm text-loop-slate/50 truncate">
                    {participant.location
                      ? t("locationUpdatedAt", {
                          time: formatTimeDisplay(participant.location.updatedAt),
                        })
                      : t("locationPending")}
                  </p>
                </div>
                <Badge tone="success" className="shrink-0 text-xs px-2 py-0.5">
                  {t("statusChipWaiting")}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-lg font-semibold text-loop-slate">
              {t("loopsHeadline")}
            </h3>
            <Badge tone="success" className="shrink-0">{loops.length}</Badge>
          </div>
          <div className="space-y-3">
            {loops.length === 0 && (
              <p className="rounded-2xl border border-dashed border-loop-slate/20 px-4 py-3 text-sm text-loop-slate/70">
                {t("emptyLoops")}
              </p>
            )}
            {loops.map((loop) => {
              const loopIsActive = loop.status === "active" || loop.status === "inProgress";
              const loopIsWaiting = loop.status === "waitingRoom";
              const loopTone: "success" | "neutral" | "warning" = loopIsActive
                ? "success"
                : loopIsWaiting
                  ? "neutral"
                  : "warning";
              const loopLabel = loopIsActive
                ? t("loopStatusActive")
                : loopIsWaiting
                  ? t("loopStatusWaiting")
                  : t("loopStatusCompleted");
              const loopHostName = loop.ownerName ?? t("loopFallbackOwner");
              return (
                <div
                  key={loop.id}
                  className="rounded-2xl border border-white/60 bg-white/80 px-3.5 sm:px-4 py-2.5 sm:py-3"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-loop-slate truncate min-w-0">
                      {t("loopLabel", { owner: loopHostName })}
                    </p>
                    <Badge tone={loopTone} className="shrink-0 text-xs px-2 py-0.5">
                      {loopLabel}
                    </Badge>
                  </div>
                  {loop.meetingPoint?.label && (
                    <p className="mt-1 text-sm text-loop-slate/80 break-words">
                      {t("loopMeetingPoint")}: {loop.meetingPoint.label}
                      {loop.meetingPoint.description
                        ? ` · ${loop.meetingPoint.description}`
                        : ""}
                    </p>
                  )}
                  {loop.scheduledAt && (
                    <p className="text-sm text-loop-slate/60 break-words">
                      {t("loopScheduledAt", {
                        time: formatDateDisplay(loop.scheduledAt),
                      })}
                    </p>
                  )}
                  {loop.startedAt && (
                    <p className="text-sm text-loop-slate/60 break-words">
                      {t("loopStartedAt", {
                        time: formatDateDisplay(loop.startedAt),
                      })}
                    </p>
                  )}
                  {loop.durationMinutes && loop.status === "completed" && (
                    <p className="text-sm text-loop-slate/60 break-words">
                      {t("loopDuration", { minutes: loop.durationMinutes })}
                      {loop.autoClosed && (
                        <span className="ml-1">· {t("loopAutoClosed")}</span>
                      )}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-loop-slate/70 break-words">
                    {loop.participants.map((p) => p.alias).join(", ")}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
