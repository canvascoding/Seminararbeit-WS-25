"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { useConsent } from "@/providers/consent-provider";

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = "G-7J98H3ND7K" as const;
const GA_COOKIE_PREFIX = GA_MEASUREMENT_ID.replace("G-", "");
const GA_COOKIE_NAMES = ["_ga", `_ga_${GA_COOKIE_PREFIX}`, "_gid", "_gat"];

function clearAnalyticsCookies() {
  if (typeof document === "undefined") return;

  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : undefined;
  const domainVariants =
    hostname && hostname.includes(".")
      ? Array.from(
          new Set([
            hostname,
            hostname.startsWith(".") ? hostname : `.${hostname}`,
            `.${hostname.split(".").slice(-2).join(".")}`,
          ]),
        )
      : hostname
        ? [hostname]
        : [];

  GA_COOKIE_NAMES.forEach((name) => {
    document.cookie = `${name}=; expires=${expires}; path=/; SameSite=Lax`;
    domainVariants.forEach((domain) => {
      document.cookie = `${name}=; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`;
    });
  });
}

export function GoogleTag() {
  const { consent } = useConsent();
  const [tagLoaded, setTagLoaded] = useState(false);
  const shouldLoadTag = consent === "granted" || tagLoaded;

  useEffect(() => {
    if (consent !== "granted") {
      clearAnalyticsCookies();
    }
  }, [consent]);

  const consentPayload = useMemo(
    () =>
      consent === "granted"
        ? {
            ad_storage: "denied",
            analytics_storage: "granted",
            functionality_storage: "granted",
            personalization_storage: "denied",
            security_storage: "granted",
          }
        : {
            ad_storage: "denied",
            analytics_storage: "denied",
            functionality_storage: "denied",
            personalization_storage: "denied",
            security_storage: "granted",
          },
    [consent],
  );

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.gtag !== "function" ||
      !tagLoaded
    ) {
      return;
    }

    window.gtag("consent", "update", consentPayload);

    if (consent === "granted") {
      window.gtag("config", GA_MEASUREMENT_ID, {
        anonymize_ip: true,
        allow_google_signals: false,
      });
    }
  }, [consent, consentPayload, tagLoaded]);

  if (!shouldLoadTag) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => setTagLoaded(true)}
      />
      <Script id="loop-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'denied',
            personalization_storage: 'denied',
            security_storage: 'granted'
          });
        `}
      </Script>
    </>
  );
}
