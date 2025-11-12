"use client";

import { FormEvent, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, Clock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/providers/auth-provider";

type FeedbackRating = "great" | "ok" | "bad";

interface LoopParticipant {
  userId: string;
  alias: string;
  joinedAt: string;
  email?: string | null;
}

interface LoopFeedback {
  rating: FeedbackRating;
  note?: string | null;
  submittedAt?: string | null;
  submittedBy?: string | null;
}

type LoopStatus =
  | "waitingRoom"
  | "active"
  | "completed"
  | "inProgress"
  | "scheduled";

interface LoopSummary {
  id: string;
  roomId: string | null;
  venueId?: string | null;
  venueName?: string | null;
  ownerId?: string | null;
  ownerName?: string | null;
  status: LoopStatus;
  participants: LoopParticipant[];
  meetingPoint?: {
    label?: string | null;
    description?: string | null;
  } | null;
  scheduledAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string | null;
  durationMinutes?: number;
  autoClosed?: boolean;
  feedback?: LoopFeedback | null;
  isOwner: boolean;
  isParticipant: boolean;
}

interface LoopsResponse {
  loops: LoopSummary[];
}

function formatDate(value?: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes?: number) {
  if (!minutes || minutes <= 0) return "–";
  return `${minutes} min`;
}

export function LoopCenter() {
  const t = useTranslations("loopCenter");
  const { firebaseUser, profile, mockMode } = useAuth();
  const resolvedUserId =
    firebaseUser?.uid ?? profile?.uid ?? (mockMode ? "demo-uid-1" : null);
  const ownerName =
    profile?.displayName ?? firebaseUser?.displayName ?? profile?.firstName ?? "";
  const [tab, setTab] = useState<"active" | "history">("active");
  const [feedbackLoopId, setFeedbackLoopId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<FeedbackRating | "">("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["loop-center", resolvedUserId],
    enabled: Boolean(resolvedUserId),
    queryFn: async (): Promise<LoopsResponse> => {
      const response = await fetch(`/api/loops?userId=${resolvedUserId}`);
      if (!response.ok) {
        throw new Error("Failed to load loops");
      }
      return response.json();
    },
    refetchInterval: 15_000,
  });

  const loops = data?.loops ?? [];
  const activeLoops = loops.filter(
    (loop) =>
      loop.status === "active" ||
      loop.status === "inProgress" ||
      loop.status === "scheduled",
  );
  const historyLoops = loops.filter((loop) => loop.status === "completed");
  const currentList = tab === "active" ? activeLoops : historyLoops;

  const ratingOptions = useMemo(
    () => [
      { value: "great" as FeedbackRating, label: t("feedbackOptionGreat") },
      { value: "ok" as FeedbackRating, label: t("feedbackOptionOk") },
      { value: "bad" as FeedbackRating, label: t("feedbackOptionBad") },
    ],
    [t],
  );

  async function submitFeedback(loop: LoopSummary, event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!resolvedUserId) return;
    if (!feedbackRating) {
      setFeedbackError(t("feedbackMissingRating"));
      return;
    }
    setSubmittingFeedback(true);
    setFeedbackError(null);
    try {
      const payload = {
        roomId: loop.roomId,
        action: "endLoop",
        loopId: loop.id,
        userId: resolvedUserId,
        ownerName,
        feedbackRating,
        feedbackNote: feedbackNote.trim(),
      };
      const response = await fetch("/api/test/waiting-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
      setFeedbackLoopId(null);
      setFeedbackRating("");
      setFeedbackNote("");
      await refetch();
    } catch {
      setFeedbackError(t("feedbackSubmitError"));
    } finally {
      setSubmittingFeedback(false);
    }
  }

  function resetFeedbackState() {
    setFeedbackLoopId(null);
    setFeedbackRating("");
    setFeedbackNote("");
    setFeedbackError(null);
  }

  const statusBadges: Record<
    LoopStatus,
    { tone: "success" | "warning" | "neutral"; label: string }
  > = {
    active: { tone: "success", label: t("statusActive") },
    inProgress: { tone: "neutral", label: t("statusPlanned") },
    scheduled: { tone: "neutral", label: t("statusPlanned") },
    completed: { tone: "neutral", label: t("statusCompleted") },
    waitingRoom: { tone: "neutral", label: t("statusPlanned") },
  };

  if (!resolvedUserId) {
    return (
      <Card className="p-6 text-center">
        <p className="text-lg font-semibold text-loop-slate">{t("loginRequiredTitle")}</p>
        <p className="mt-2 text-sm text-loop-slate/70">{t("loginRequiredBody")}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-loop-slate">{t("title")}</h1>
          <p className="text-loop-slate/70">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-loop-green" />}
          <Button variant="ghost" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("refresh")}
          </Button>
        </div>
      </div>

      <Card className="p-2 flex flex-wrap gap-2">
        <Button
          variant={tab === "active" ? "primary" : "ghost"}
          onClick={() => {
            resetFeedbackState();
            setTab("active");
          }}
        >
          {t("tabActive")}
          <Badge tone="success" className="ml-2">{activeLoops.length}</Badge>
        </Button>
        <Button
          variant={tab === "history" ? "primary" : "ghost"}
          onClick={() => {
            resetFeedbackState();
            setTab("history");
          }}
        >
          {t("tabHistory")}
          <Badge tone="neutral" className="ml-2">{historyLoops.length}</Badge>
        </Button>
      </Card>

      {error && (
        <Card className="p-4 border-loop-rose/40">
          <p className="text-sm text-loop-rose">{t("loadError")}</p>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-6 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-loop-green" />
          <p className="mt-2 text-sm text-loop-slate/70">{t("loading")}</p>
        </Card>
      ) : currentList.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-lg font-semibold text-loop-slate">
            {tab === "active" ? t("emptyActiveTitle") : t("emptyHistoryTitle")}
          </p>
          <p className="mt-1 text-sm text-loop-slate/70">
            {tab === "active" ? t("emptyActiveBody") : t("emptyHistoryBody")}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentList.map((loop) => {
            const status = statusBadges[loop.status] ?? statusBadges.active;
            const roleLabel = loop.isOwner ? t("roleHost") : t("roleParticipant");
            const waitingRoomUrl: Route = loop.roomId
              ? (`/waiting-room?room=${loop.roomId}${loop.venueId ? `&venue=${loop.venueId}` : ""}` as Route)
              : ("/waiting-room" as Route);
            const canOpenWaitingRoom = loop.isOwner && tab === "active";
            const showFeedbackForm =
              feedbackLoopId === loop.id && loop.isOwner && loop.status !== "completed";
            const hostName = loop.ownerName ?? t("loopFallbackOwner");
            const hasGuests = loop.participants.some(
              (participant) => participant.userId && participant.userId !== resolvedUserId,
            );
            const canCloseFromCenter = loop.isOwner && loop.status !== "completed" && hasGuests;
            return (
              <Card key={loop.id} className="p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-loop-slate">
                      {t("loopFallbackTitle", { owner: hostName })}
                    </p>
                    {loop.venueName && (
                      <p className="text-xs text-loop-slate/60">{loop.venueName}</p>
                    )}
                    <p className="text-xs text-loop-slate/60">
                      {loop.meetingPoint?.label
                        ? `${t("meetingPointLabel")}: ${loop.meetingPoint.label}${
                            loop.meetingPoint.description
                              ? ` · ${loop.meetingPoint.description}`
                              : ""
                          }`
                        : t("meetingPointMissing")}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <Badge tone={loop.isOwner ? "success" : "neutral"}>{roleLabel}</Badge>
                    {loop.autoClosed && (
                      <Badge tone="warning">{t("autoClosedBadge")}</Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoRow
                    icon={<Clock className="h-4 w-4 text-loop-slate/60" />}
                    label={t("scheduleLabel")}
                    value={formatDate(loop.scheduledAt ?? loop.createdAt)}
                  />
                  <InfoRow
                    icon={<Clock className="h-4 w-4 text-loop-slate/60" />}
                    label={t("startLabel")}
                    value={formatDate(loop.startedAt)}
                  />
                  <InfoRow
                    icon={<Clock className="h-4 w-4 text-loop-slate/60" />}
                    label={t("endLabel")}
                    value={formatDate(loop.endedAt)}
                  />
                  <InfoRow
                    icon={<CheckCircle2 className="h-4 w-4 text-loop-slate/60" />}
                    label={t("durationLabel")}
                    value={formatDuration(loop.durationMinutes)}
                  />
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-loop-slate/60">
                    {t("participantsLabel")}
                  </p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {loop.participants.map((participant) => (
                      <div
                        key={participant.userId}
                        className="rounded-2xl border border-loop-slate/15 bg-white/70 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-loop-slate">
                          {participant.alias}
                        </p>
                        <p className="text-xs text-loop-slate/60 break-all">
                          {participant.email ?? t("emailHidden")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-loop-slate/60">
                    {t("feedbackSection")}
                  </p>
                  {loop.feedback ? (
                    <div className="rounded-2xl border border-loop-green/20 bg-loop-green/5 px-3 py-2 text-sm text-loop-slate">
                      <p className="font-semibold">
                        {t(`feedbackLabel.${loop.feedback.rating}`)}
                      </p>
                      {loop.feedback.note && (
                        <p className="text-loop-slate/70">{loop.feedback.note}</p>
                      )}
                    </div>
                  ) : loop.autoClosed ? (
                    <div className="rounded-2xl border border-loop-slate/15 bg-loop-slate/5 px-3 py-2 text-sm text-loop-slate/70">
                      {t("feedbackAutoClosed")}
                    </div>
                  ) : loop.isOwner && loop.status !== "completed" ? (
                    <div className="rounded-2xl border border-loop-slate/20 bg-white/80 px-3 py-2 text-sm text-loop-slate/70">
                      {t("feedbackPendingOwner")}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-loop-slate/20 bg-white/80 px-3 py-2 text-sm text-loop-slate/70">
                      {t("feedbackPending")}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {canOpenWaitingRoom && (
                    <Button asChild variant="secondary">
                      <Link href={waitingRoomUrl}>{t("openWaitingRoom")}</Link>
                    </Button>
                  )}
                  {canCloseFromCenter && (
                    <Button
                      variant={showFeedbackForm ? "ghost" : "danger"}
                      onClick={() => {
                        if (showFeedbackForm) {
                          resetFeedbackState();
                        } else {
                          setFeedbackLoopId(loop.id);
                          setFeedbackRating("");
                          setFeedbackNote("");
                          setFeedbackError(null);
                        }
                      }}
                    >
                      {showFeedbackForm ? t("feedbackCancel") : t("closeLoopButton")}
                    </Button>
                  )}
                </div>

                {showFeedbackForm && (
                  <form className="space-y-3 rounded-2xl border border-loop-slate/15 bg-white/90 p-4" onSubmit={(event) => submitFeedback(loop, event)}>
                    <p className="text-sm text-loop-slate/80">
                      {t("feedbackIntro")}
                    </p>
                    <div className="flex flex-col gap-2">
                      {ratingOptions.map((option) => (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 rounded-xl border border-loop-slate/20 bg-white/70 px-3 py-2 text-sm text-loop-slate"
                        >
                          <input
                            type="radio"
                            name={`feedback-${loop.id}`}
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
                      <label className="text-xs font-semibold text-loop-slate">
                        {t("feedbackNoteLabel")}
                      </label>
                      <Textarea
                        value={feedbackNote}
                        onChange={(event) => setFeedbackNote(event.target.value)}
                        placeholder={t("feedbackNotePlaceholder")}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    {feedbackError && (
                      <p className="text-xs text-loop-rose/70">{feedbackError}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" disabled={submittingFeedback}>
                        {t("feedbackSubmit")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => resetFeedbackState()}
                      >
                        {t("feedbackCancel")}
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface InfoRowProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-loop-slate/10 bg-white/80 px-3 py-2">
      <div className="rounded-xl bg-loop-slate/5 p-1.5">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-loop-slate/60">{label}</p>
        <p className="text-sm font-medium text-loop-slate">{value}</p>
      </div>
    </div>
  );
}
