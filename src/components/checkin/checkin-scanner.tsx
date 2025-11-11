"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Venue } from "@/types/domain";

type PendingVenue = { id: string; name: string | null };

interface Props {
  onVenueDetected?: (venueId: string) => void;
  initialVenueId?: string;
  redirectTo?: "slots" | "waiting-room" | "prompt";
  venues: Venue[];
}

export function CheckInScanner({
  onVenueDetected,
  initialVenueId,
  redirectTo = "prompt",
  venues,
}: Props) {
  const t = useTranslations("checkin");
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigatingRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [manualVenue, setManualVenue] = useState(initialVenueId ?? "");
  const [offline, setOffline] = useState(false);
  const [lastDetectedVenue, setLastDetectedVenue] = useState<string | null>(
    initialVenueId ?? null,
  );
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [activeVenueName, setActiveVenueName] = useState<string | null>(null);
  const [actionPromptOpen, setActionPromptOpen] = useState(false);
  const [pendingVenue, setPendingVenue] = useState<PendingVenue | null>(null);
  const promptDismissReasonRef = useRef<"navigation" | null>(null);
  const checkoutLabel = activeVenueName
    ? (() => {
        const label = t("checkoutButtonWithVenue", { venue: activeVenueName });
        return label === "checkin.checkoutButtonWithVenue"
          ? `${activeVenueName} verlassen`
          : label;
      })()
    : t("checkoutButton");

  const proceedToDestination = useCallback(
    (mode: "slots" | "waiting-room", venueId: string) => {
      const target =
        mode === "slots"
          ? `/slots/${venueId}`
          : `/waiting-room?${new URLSearchParams({ venue: venueId }).toString()}`;
      navigatingRef.current = true;
      router.push(target);
    },
    [router],
  );

  const navigateToDestination = useCallback(
    (venueId: string) => {
      const venue = venues.find((entry) => entry.id === venueId);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("checkedInAt", new Date().toISOString());
        window.sessionStorage.setItem("checkedInVenue", venueId);
        if (venue) {
          window.sessionStorage.setItem("checkedInVenueName", venue.name);
        } else {
          window.sessionStorage.removeItem("checkedInVenueName");
        }
        window.dispatchEvent(
          new CustomEvent("checkedInVenueChanged", {
            detail: { venueId, venueName: venue?.name },
          }),
        );
      }
      onVenueDetected?.(venueId);
      setLastDetectedVenue(venueId);
      setIsCheckedIn(true);
      setActiveVenueName(venue?.name ?? null);
      setManualVenue(venueId);
      const venueName = venue?.name ?? venueId;

      const nextAction = redirectTo ?? "prompt";
      if (nextAction === "prompt") {
        setPendingVenue({ id: venueId, name: venueName });
        setActionPromptOpen(true);
        return;
      }

      if (nextAction === "slots") {
        setMessage(t("postCheckinJoinMessage", { venue: venueName }));
        proceedToDestination("slots", venueId);
        return;
      }

      setMessage(t("waitingRoomRedirect", { venueId: venueName }));
      proceedToDestination("waiting-room", venueId);
    },
    [onVenueDetected, redirectTo, proceedToDestination, t, venues],
  );

  const handlePromptVisibility = useCallback(
    (open: boolean) => {
      if (open) {
        setActionPromptOpen(true);
        return;
      }
      setActionPromptOpen(false);
      if (promptDismissReasonRef.current !== "navigation") {
        navigatingRef.current = false;
      }
      promptDismissReasonRef.current = null;
      setPendingVenue(null);
    },
    [],
  );

  // Magic Link completion code removed - now using email/password auth

  useEffect(() => {
    function syncStatus() {
      setOffline(!navigator.onLine);
    }

    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);
    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hydrateFromSession = () => {
      const storedVenue = window.sessionStorage.getItem("checkedInVenue");
      const storedVenueName = window.sessionStorage.getItem("checkedInVenueName");
      if (storedVenue) {
        setIsCheckedIn(true);
        setLastDetectedVenue((previous) => previous ?? storedVenue);
        setManualVenue(storedVenue);
      }
      if (storedVenueName) {
        setActiveVenueName(storedVenueName);
      }
    };

    const scheduleHydration: (cb: () => void) => void =
      typeof queueMicrotask === "function"
        ? queueMicrotask
        : (cb) => {
            setTimeout(cb, 0);
          };

    scheduleHydration(hydrateFromSession);
  }, []);

  const closePrompt = useCallback((reason: "navigation" | null = null) => {
    promptDismissReasonRef.current = reason;
    setActionPromptOpen(false);
  }, []);

  const handleJoinExistingSlots = useCallback(() => {
    if (!pendingVenue) return;
    const { id, name } = pendingVenue;
    setMessage(t("postCheckinJoinMessage", { venue: name ?? id }));
    closePrompt("navigation");
    proceedToDestination("slots", id);
  }, [closePrompt, pendingVenue, proceedToDestination, t]);

  const handleStartNewSlot = useCallback(() => {
    if (!pendingVenue) return;
    const { id, name } = pendingVenue;
    setMessage(t("postCheckinCreateMessage", { venue: name ?? id }));
    closePrompt("navigation");
    proceedToDestination("waiting-room", id);
  }, [closePrompt, pendingVenue, proceedToDestination, t]);

  const handleDecideLater = useCallback(() => {
    closePrompt(null);
  }, [closePrompt]);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    if (!videoRef.current) return;
    let active = true;

    async function startScanner() {
      setStatus("loading");
      try {
        await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current!,
          (result) => {
            if (result) {
              try {
                const url = new URL(result.getText());
                const venueId = url.searchParams.get("venue");
                if (venueId && !navigatingRef.current) {
                  navigateToDestination(venueId);
                } else {
                  setMessage(t("invalidCode"));
                }
              } catch {
                setMessage(t("invalidCode"));
              }
            }
          },
        );
        setStatus("idle");
      } catch (error) {
        console.error(error);
        if (!active) return;
        setStatus("error");
        setMessage(t("cameraError"));
      }
    }

    startScanner();

    return () => {
      active = false;
      (
        reader as unknown as {
          reset?: () => void;
        }
      ).reset?.();
    };
  }, [navigateToDestination, t]);

  function handleManualSubmit() {
    if (!manualVenue || !venues.some((venue) => venue.id === manualVenue)) {
      setMessage(t("invalidCode"));
      return;
    }
    if (navigatingRef.current) return;
    navigateToDestination(manualVenue);
    const venueName =
      venues.find((venue) => venue.id === manualVenue)?.name ?? manualVenue;
    setMessage(t("manualSuccess", { venueId: venueName }));
  }

  function handleCheckout() {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem("checkedInAt");
    window.sessionStorage.removeItem("checkedInVenue");
    window.sessionStorage.removeItem("checkedInVenueName");
    window.dispatchEvent(
      new CustomEvent("checkedInVenueChanged", { detail: {} }),
    );
    setIsCheckedIn(false);
    setActiveVenueName(null);
    setLastDetectedVenue(null);
    setManualVenue("");
    setMessage(t("checkoutSuccess"));
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video overflow-hidden rounded-3xl border border-loop-green/30 bg-black/80">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          autoPlay
          playsInline
        />
      </div>
      <p className="text-sm text-loop-slate/70">
        {status === "loading"
          ? t("cameraPreparing")
          : lastDetectedVenue
            ? t("intentPromptVenue", { venueId: activeVenueName ?? venues.find(v => v.id === lastDetectedVenue)?.name ?? lastDetectedVenue })
            : t("intentPrompt")}
      </p>
      {offline && (
        <p className="rounded-2xl bg-loop-amber/20 px-4 py-2 text-sm text-loop-slate">
          {t("offline")}
        </p>
      )}
      {message && (
        <p className="rounded-2xl bg-loop-green/10 px-4 py-2 text-sm text-loop-green">
          {message}
        </p>
      )}
      <div className="rounded-3xl border border-dashed border-loop-slate/30 p-4">
        <p className="text-sm font-semibold text-loop-slate">
          {t("manualHeadline")}
        </p>
        <div className="mt-3">
          <label className="text-xs font-medium text-loop-slate/80">
            {t("manualLabelVenue")}
          </label>
          <select
            value={manualVenue}
            onChange={(event) => setManualVenue(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-loop-slate/30 bg-white px-4 py-2 text-sm text-loop-slate focus:border-loop-green focus:outline-none focus:ring-2 focus:ring-loop-green/20"
          >
            <option value="">{t("manualSelectPlaceholder")}</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </div>
        <Button className="mt-3 w-full" onClick={handleManualSubmit}>
          {t("manualSubmit")}
        </Button>
        {isCheckedIn && (
          <Button
            type="button"
            variant="secondary"
            className="mt-2 w-full border border-loop-rose/40 text-loop-rose hover:border-loop-rose hover:text-loop-rose"
            onClick={handleCheckout}
          >
            {checkoutLabel}
          </Button>
        )}
      </div>
      {pendingVenue && (
        <Dialog.Root open={actionPromptOpen} onOpenChange={handlePromptVisibility}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-loop-slate/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
            <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md space-y-5 rounded-[32px] border border-white/60 bg-white/95 p-6 text-center shadow-soft">
                <Dialog.Title className="text-lg font-semibold text-loop-slate">
                  {t("postCheckinPromptTitle")}
                </Dialog.Title>
                <Dialog.Description className="text-sm text-loop-slate/70">
                  {t("postCheckinPromptDescription", {
                    venue: pendingVenue.name ?? pendingVenue.id,
                  })}
                </Dialog.Description>
                <div className="space-y-2">
                  <Button className="w-full" onClick={handleJoinExistingSlots}>
                    {t("postCheckinJoin")}
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={handleStartNewSlot}
                  >
                    {t("postCheckinCreate")}
                  </Button>
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={handleDecideLater}
                  >
                    {t("postCheckinLater")}
                  </Button>
                </div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
