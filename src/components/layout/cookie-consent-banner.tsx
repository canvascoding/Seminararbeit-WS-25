"use client";

import Link from "next/link";
import { useConsent } from "@/providers/consent-provider";

export function CookieConsentBanner() {
  const { isBannerVisible, acceptAll, denyAnalytics } = useConsent();

  if (!isBannerVisible) {
    return null;
  }

  return (
    <section className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border border-loop-slate/15 bg-white/95 p-5 shadow-soft backdrop-blur-md md:inset-x-auto md:right-6 md:w-[460px]">
      <div className="space-y-3 text-sm leading-relaxed text-loop-slate/90">
        <div>
          <p className="text-base font-semibold text-loop-slate">
            Datenschutz & Cookies
          </p>
          <p>
            Wir setzen den Google Tag nur ein, wenn du zustimmst. Bei einer
            Ablehnung werden keine Analyse-Cookies gesetzt und alle Requests
            bleiben auf das technisch Notwendige beschränkt.
          </p>
        </div>
        <p className="text-xs text-loop-slate/70">
          Details findest du in unserer{" "}
          <Link
            href="/cookie-richtlinie"
            className="underline underline-offset-4 hover:text-loop-slate"
          >
            Cookie-Richtlinie
          </Link>{" "}
          sowie in der{" "}
          <Link
            href="/datenschutz"
            className="underline underline-offset-4 hover:text-loop-slate"
          >
            Datenschutzerklärung
          </Link>
          . Du kannst deine Wahl später jederzeit erneut öffnen.
        </p>
        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          <button
            type="button"
            onClick={denyAnalytics}
            className="w-full rounded-full border border-loop-slate/30 px-4 py-2 text-sm font-medium text-loop-slate transition hover:border-loop-slate hover:bg-loop-slate/5"
          >
            Nur notwendige Cookies
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="w-full rounded-full bg-loop-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-loop-green-dark"
          >
            Alle akzeptieren
          </button>
        </div>
      </div>
    </section>
  );
}
