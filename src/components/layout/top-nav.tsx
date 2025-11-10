"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Menu, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/providers/auth-provider";

type NavKey = "navCheckIn" | "navSlots" | "navPartner" | "navReport";
type LinkHref = Parameters<typeof Link>[0]["href"];

interface NavLink {
  id: string;
  href: LinkHref;
  activePath: string;
  labelKey: NavKey;
}

const DEFAULT_VENUE_ID = "mensa-nord";
const DEFAULT_SLOT_PATH = `/slots/${DEFAULT_VENUE_ID}` as Route;

const links: NavLink[] = [
  { id: "checkin", href: "/checkin", activePath: "/checkin", labelKey: "navCheckIn" },
  {
    id: "slots",
    href: DEFAULT_SLOT_PATH,
    activePath: DEFAULT_SLOT_PATH,
    labelKey: "navSlots",
  },
  { id: "partner", href: "/partner", activePath: "/partner", labelKey: "navPartner" },
  { id: "report", href: "/report", activePath: "/report", labelKey: "navReport" },
];

export function TopNav() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const { profile, mockMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-loop-sand/90 border-b border-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden rounded-lg p-2 hover:bg-loop-green/10 focus:outline-none focus:ring-2 focus:ring-loop-green"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-loop-slate" />
          </button>
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 font-semibold text-base sm:text-lg">
            <span className="rounded-full bg-loop-green px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs text-white uppercase tracking-wide">
              {t("pilotBadge")}
            </span>
            <span>Loop</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-loop-slate/80 md:flex">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={
                pathname === link.activePath ? "text-loop-green font-semibold" : "hover:text-loop-green transition-colors"
              }
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/report">{t("ctaReport")}</Link>
          </Button>
          <Button variant="primary" asChild className="text-xs sm:text-sm px-3 sm:px-4">
            <Link href={profile ? DEFAULT_SLOT_PATH : "/"} className="flex items-center gap-1.5">
              {!profile && <LogIn className="h-4 w-4" />}
              <span className="hidden sm:inline">{profile ? t("ctaStart") : "Login"}</span>
              <span className="sm:hidden">{profile ? t("ctaStart") : "Login"}</span>
            </Link>
          </Button>
        </div>
      </div>

      {mockMode && (
        <div className="bg-loop-rose/10 px-4 py-1 text-center text-xs text-loop-rose">
          {t("mockWarning")}
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
                onClick={() => setMobileMenuOpen(false)}
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
