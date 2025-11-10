"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onVenueDetected?: (venueId: string) => void;
  initialVenueId?: string;
}

export function CheckInScanner({ onVenueDetected, initialVenueId }: Props) {
  const t = useTranslations("checkin");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [manualVenue, setManualVenue] = useState(initialVenueId ?? "");
  const [slotCode, setSlotCode] = useState("");
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    function handleOnline() {
      setOffline(!navigator.onLine);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOnline);
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
                if (venueId) {
                  sessionStorage.setItem(
                    "checkedInAt",
                    new Date().toISOString(),
                  );
                  setMessage(`Venue: ${venueId}`);
                  onVenueDetected?.(venueId);
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
  }, [onVenueDetected, t]);

  function handleManualSubmit() {
    if (!manualVenue) {
      setMessage(t("invalidCode"));
      return;
    }
    sessionStorage.setItem("checkedInAt", new Date().toISOString());
    onVenueDetected?.(manualVenue);
    setMessage(`Venue: ${manualVenue} · Slot: ${slotCode}`);
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
        {status === "loading" ? t("cameraPreparing") : t("intentPrompt")}
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
