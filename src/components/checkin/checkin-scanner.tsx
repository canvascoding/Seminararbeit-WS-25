"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onVenueDetected?: (venueId: string) => void;
  initialVenueId?: string;
  redirectTo?: "slots" | "waiting-room";
}

export function CheckInScanner({
  onVenueDetected,
  initialVenueId,
  redirectTo = "waiting-room",
}: Props) {
  const t = useTranslations("checkin");
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigatingRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [manualVenue, setManualVenue] = useState(initialVenueId ?? "");
  const [slotCode, setSlotCode] = useState("");
  const [offline, setOffline] = useState(false);
  const [lastDetectedVenue, setLastDetectedVenue] = useState<string | null>(
    initialVenueId ?? null,
  );

  const navigateToDestination = useCallback(
    (venueId: string, slot?: string) => {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("checkedInAt", new Date().toISOString());
        window.sessionStorage.setItem("checkedInVenue", venueId);
      }
      onVenueDetected?.(venueId);
      setLastDetectedVenue(venueId);

      if (!redirectTo) {
        return;
      }

      const params = new URLSearchParams({ venue: venueId });
      if (slot) params.set("slot", slot);

      const target =
        redirectTo === "slots"
          ? `/slots/${venueId}`
          : `/waiting-room?${params.toString()}`;

      setMessage(t("waitingRoomRedirect", { venueId }));
      navigatingRef.current = true;
      router.push(target as any);
    },
    [onVenueDetected, redirectTo, router, t],
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
    if (!manualVenue) {
      setMessage(t("invalidCode"));
      return;
    }
    if (navigatingRef.current) return;
    navigateToDestination(manualVenue, slotCode || undefined);
    setMessage(t("manualSuccess", { venueId: manualVenue }));
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
            ? t("intentPromptVenue", { venueId: lastDetectedVenue })
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
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Input
            value={manualVenue}
            onChange={(event) => setManualVenue(event.target.value)}
            placeholder={t("manualLabelVenue")}
          />
          <Input
            value={slotCode}
            onChange={(event) => setSlotCode(event.target.value)}
            placeholder={t("manualLabelSlot")}
          />
        </div>
        <Button className="mt-3" onClick={handleManualSubmit}>
          {t("manualSubmit")}
        </Button>
      </div>
    </div>
  );
}
