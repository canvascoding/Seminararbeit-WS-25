"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogIn, Play, MapPin } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/providers/auth-provider";

type NavKey =
  | "navCheckIn"
  | "navSlots"
  | "navLoops"
  | "navVenues"
  | "navPartner"
  | "navReport";
type LinkHref = Parameters<typeof Link>[0]["href"];

interface NavLink {
  id: string;
  href: LinkHref;
  activePath: string;
  labelKey: NavKey;
}

const DEFAULT_VENUE_ID = "mensa-nord";
const CHECKIN_NOTICE_STORAGE_KEY = "requireCheckInBeforeSlots";
type VenueChangeDetail = {
  venueId?: string;
  venueName?: string;
};

declare global {
  interface WindowEventMap {
    checkedInVenueChanged: CustomEvent<VenueChangeDetail>;
  }
}

const scheduleStateUpdate = (callback: () => void) => {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(callback);
    return;
  }
  setTimeout(callback, 0);
};

export function TopNav() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const { profile, firebaseUser, mockMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentVenueId, setCurrentVenueId] = useState<string>(DEFAULT_VENUE_ID);
  const [currentVenueName, setCurrentVenueName] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showCheckInNotice, setShowCheckInNotice] = useState(false);
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayCheckInNotice = useCallback(() => {
    setShowCheckInNotice(true);
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current);
    }
    noticeTimeoutRef.current = setTimeout(() => {
      setShowCheckInNotice(false);
    }, 5000);
  }, []);

  useEffect(
    () => () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current);
      }
    },
    []
  );

  // Read the checked-in venue from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!profile) {
      scheduleStateUpdate(() => {
        setCurrentVenueId(DEFAULT_VENUE_ID);
        setCurrentVenueName(null);
        setIsCheckedIn(false);
      });
      return;
    }

    const hydrateFromSession = () => {
      const storedVenue = window.sessionStorage.getItem("checkedInVenue");
      const storedVenueName = window.sessionStorage.getItem("checkedInVenueName");
      if (storedVenue) {
        setCurrentVenueId(storedVenue);
        setIsCheckedIn(true);
      } else {
        setCurrentVenueId(DEFAULT_VENUE_ID);
        setIsCheckedIn(false);
      }
      setCurrentVenueName(storedVenueName);
    };

    scheduleStateUpdate(hydrateFromSession);

    const handleVenueChange = (event: WindowEventMap["checkedInVenueChanged"]) => {
      const detail = event.detail ?? {};
      if (detail.venueId) {
        setCurrentVenueId(detail.venueId);
        setCurrentVenueName(detail.venueName ?? null);
        setIsCheckedIn(true);
      } else {
        setCurrentVenueId(DEFAULT_VENUE_ID);
        setCurrentVenueName(null);
        setIsCheckedIn(false);
      }
    };

    window.addEventListener("checkedInVenueChanged", handleVenueChange);
    return () => {
      window.removeEventListener("checkedInVenueChanged", handleVenueChange);
    };
  }, [profile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldShowNotice = window.sessionStorage.getItem(CHECKIN_NOTICE_STORAGE_KEY);
    if (shouldShowNotice) {
      window.sessionStorage.removeItem(CHECKIN_NOTICE_STORAGE_KEY);
      scheduleStateUpdate(displayCheckInNotice);
    }
  }, [displayCheckInNotice]);

  const resolvedUserId = firebaseUser?.uid ?? profile?.uid ?? null;
  const { data: activeLoopData } = useQuery({
    queryKey: ["top-nav-active-loop", resolvedUserId],
    enabled: Boolean(resolvedUserId),
    refetchInterval: 15_000,
    queryFn: async () => {
      if (!resolvedUserId) return null;
      const params = new URLSearchParams({
        userId: resolvedUserId,
        status: "active,inProgress,scheduled",
      });
      const response = await fetch(`/api/loops?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Loops konnten nicht geladen werden.");
      }
      return (await response.json()) as { loops: Array<{ id: string; status: string; roomId: string | null; venueId?: string | null }> };
    },
  });

  const activeLoopLink = useMemo(() => {
    if (!activeLoopData?.loops) return null;
    const loop =
      activeLoopData.loops.find(
        (entry) => entry.status === "active" || entry.status === "inProgress",
      ) ?? null;
    if (!loop) return null;
    if (!loop.roomId) return "/loop-center";
    const params = new URLSearchParams({ room: loop.roomId });
    if (loop.venueId) params.set("venue", loop.venueId);
    return `/waiting-room?${params.toString()}`;
  }, [activeLoopData]);

  const slotPath = `/slots/${currentVenueId}` as Route;
  const defaultStartPath = profile ? ((isCheckedIn ? slotPath : "/checkin") as Route) : ("/" as Route);
  const startPath = (activeLoopLink ?? defaultStartPath) as Route;
  const slotsLinkHref = slotPath;
  const venueLabel = currentVenueName ?? t("navVenueUnknown");
  const venueAriaLabel = currentVenueName
    ? t("navVenueActive", { venue: currentVenueName })
    : t("navVenueUnknown");
  const requiresCheckInBeforeSlots = Boolean(profile && !isCheckedIn);

  const shouldShowCheckInLink = !profile || !isCheckedIn;
  const userRole = profile?.role;
  const isAdmin = userRole === "admin";
  const isPartner = userRole === "partner";
  const handleSlotsClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!requiresCheckInBeforeSlots) return;
      event.preventDefault();
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(CHECKIN_NOTICE_STORAGE_KEY, "true");
      }
      displayCheckInNotice();
      router.push("/checkin");
    },
    [requiresCheckInBeforeSlots, displayCheckInNotice, router]
  );

  const links: NavLink[] = [
    ...(shouldShowCheckInLink ? [{ id: "checkin", href: "/checkin" as Route, activePath: "/checkin", labelKey: "navCheckIn" as NavKey }] : []),
    {
      id: "slots",
      href: slotsLinkHref,
      activePath: slotPath,
      labelKey: "navSlots" as NavKey,
    },
    ...(profile
      ? [
          {
            id: "loops",
            href: "/loop-center" as Route,
            activePath: "/loop-center",
            labelKey: "navLoops" as NavKey,
          },
        ]
      : []),
    // "Orte" nur für Admins anzeigen
    ...(isAdmin ? [{ id: "venues", href: "/venues" as Route, activePath: "/venues", labelKey: "navVenues" as NavKey }] : []),
    // "Partnerportal" für Admins und Partner anzeigen
    ...(isAdmin || isPartner ? [{ id: "partner", href: "/partner" as Route, activePath: "/partner", labelKey: "navPartner" as NavKey }] : []),
  ];

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-loop-sand/90 border-b border-white/60 overflow-x-hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-3 px-4 py-3 overflow-x-hidden">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden rounded-lg p-2 hover:bg-loop-green/10 focus:outline-none focus:ring-2 focus:ring-loop-green flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-loop-slate" />
          </button>
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-loop-green px-2 py-0.5 text-[10px] text-white font-medium uppercase tracking-wider">
              {t("pilotBadge")}
            </span>
            <span className="font-semibold text-base sm:text-lg text-loop-slate whitespace-nowrap">Loop</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-loop-slate/80 md:flex">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              onClick={(event) => {
                if (link.id === "slots") handleSlotsClick(event);
              }}
              className={
                pathname === link.activePath ? "text-loop-green font-semibold" : "hover:text-loop-green transition-colors"
              }
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink">
          <Link
            href="/checkin"
            className="inline-flex items-center gap-1 rounded-full border border-loop-slate/40 px-2 sm:px-3 py-1 text-xs text-loop-slate transition-colors hover:border-loop-green hover:text-loop-green sm:text-sm max-w-[100px] sm:max-w-[180px] min-w-0"
            aria-label={venueAriaLabel}
            title={venueAriaLabel}
          >
            <MapPin className="h-3.5 w-3.5 text-loop-green flex-shrink-0" />
            <span className="truncate min-w-0 block">{venueLabel}</span>
          </Link>
          <Button variant="ghost" asChild className="hidden sm:inline-flex flex-shrink-0">
            <Link href="/report">{t("ctaReport")}</Link>
          </Button>
          <Button
            variant="primary"
            asChild
            className="text-xs sm:text-sm px-2 sm:px-4 py-2 min-w-0 flex-shrink-0"
          >
            <Link href={startPath} className="flex items-center gap-1 sm:gap-1.5">
              {profile ? (
                <>
                  <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                  <span className="hidden xs:inline">{t("ctaStart")}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="whitespace-nowrap">Login</span>
                </>
              )}
            </Link>
          </Button>
        </div>
      </div>

      {mockMode && (
        <div className="bg-loop-rose/10 px-4 py-1 text-center text-xs text-loop-rose">
          {t("mockWarning")}
        </div>
      )}
      {showCheckInNotice && (
        <div className="bg-loop-green/10 px-4 py-1 text-center text-xs text-loop-green">
          {t("navSlotsCheckInNotice")}
        </div>
      )}

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} side="left">
        <div className="flex flex-col gap-6 pt-8">
          <SheetTitle className="px-2 text-2xl">Navigation</SheetTitle>
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.id}
                href={link.href}
                onClick={(event) => {
                  if (link.id === "slots") handleSlotsClick(event);
                  setMobileMenuOpen(false);
                }}
                className={`rounded-xl px-4 py-3 text-base font-medium transition-colors ${
                  pathname === link.activePath
                    ? "bg-loop-green text-white"
                    : "text-loop-slate/80 hover:bg-loop-green/10 hover:text-loop-green"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <Link
              href="/report"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-base font-medium text-loop-slate/80 hover:bg-loop-green/10 hover:text-loop-green transition-colors sm:hidden"
            >
              {t("ctaReport")}
            </Link>
          </nav>
        </div>
      </Sheet>
    </header>
  );
}
