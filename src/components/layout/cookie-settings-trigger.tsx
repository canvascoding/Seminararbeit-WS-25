"use client";

import { useConsent } from "@/providers/consent-provider";

export function CookieSettingsTrigger() {
  const { consent, isBannerVisible, openPreferences } = useConsent();

  if (consent === "pending" || isBannerVisible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openPreferences}
      className="fixed bottom-4 left-4 z-40 rounded-full border border-loop-slate/20 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-wide text-loop-slate shadow-md backdrop-blur transition hover:border-loop-slate/40 hover:bg-white"
    >
      Cookie-Einstellungen
    </button>
  );
}
