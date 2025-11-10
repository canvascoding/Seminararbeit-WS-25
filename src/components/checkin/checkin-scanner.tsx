"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseClientReady, getFirebaseAuth } from "@/lib/firebase/client";
import { MAGIC_LINK_EMAIL_KEY } from "@/lib/constants";

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
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!firebaseClientReady() || typeof window === "undefined") return;

    let active = true;
    const auth = getFirebaseAuth();
    const currentUrl = window.location.href;
    if (!isSignInWithEmailLink(auth, currentUrl)) return;

    async function completeMagicLink() {
      setStatus("loading");
      setMessage(t("magicLinkConfirming"));

      let email = window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY) ?? "";
      if (!email) {
        email = window.prompt(t("magicLinkPromptEmail")) ?? "";
      }

      if (!email) {
        if (!active) return;
        setStatus("error");
        setMessage(t("magicLinkEmailMissing"));
        return;
      }

      try {
        await signInWithEmailLink(auth, email, currentUrl);
        window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
        if (!active) return;
        setStatus("idle");
        setMessage(t("magicLinkConfirmed"));
      } catch (error) {
        console.error(error);
        if (!active) return;
        setStatus("error");
        setMessage(t("magicLinkConfirmError"));
      } finally {
        if (!active) return;
        const cleanUrl = new URL(window.location.href);
        ["oobCode", "mode", "lang", "apiKey", "continueUrl", "tenantId"].forEach(
          (param) => cleanUrl.searchParams.delete(param),
        );
        window.history.replaceState({}, "", cleanUrl.toString());
      }
    }

    void completeMagicLink();

    return () => {
      active = false;
    };
  }, [t]);

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
