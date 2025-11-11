"use client";

import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type ConsentState = "pending" | "granted" | "denied";

type ConsentContextValue = {
  consent: ConsentState;
  isBannerVisible: boolean;
  acceptAll: () => void;
  denyAnalytics: () => void;
  openPreferences: () => void;
  closeBanner: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

const CONSENT_COOKIE_NAME = "loop-consent";
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 days

function storeConsent(value: ConsentState | null) {
  if (typeof document === "undefined") return;

  if (value === null) {
    document.cookie = `${CONSENT_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax; Secure`;
    return;
  }

  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax; Secure`;
}

type ConsentProviderProps = PropsWithChildren<{
  initialConsent: ConsentState;
}>;

export function ConsentProvider({
  children,
  initialConsent,
}: ConsentProviderProps) {
  const [consent, setConsent] = useState<ConsentState>(initialConsent);
  const [isBannerVisible, setBannerVisible] = useState(
    initialConsent === "pending",
  );

  const acceptAll = useCallback(() => {
    setConsent("granted");
    setBannerVisible(false);
    storeConsent("granted");
  }, []);

  const denyAnalytics = useCallback(() => {
    setConsent("denied");
    setBannerVisible(false);
    storeConsent("denied");
  }, []);

  const openPreferences = useCallback(() => {
    setConsent("pending");
    setBannerVisible(true);
    storeConsent(null);
  }, []);

  const closeBanner = useCallback(() => setBannerVisible(false), []);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      isBannerVisible,
      acceptAll,
      denyAnalytics,
      openPreferences,
      closeBanner,
    }),
    [acceptAll, closeBanner, consent, denyAnalytics, isBannerVisible, openPreferences],
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error("useConsent must be used within a ConsentProvider");
  }
  return context;
}
