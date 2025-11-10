"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";

type NavKey = "navCheckIn" | "navSlots" | "navPartner" | "navReport";

const links: { href: string; labelKey: NavKey }[] = [
  { href: "/checkin", labelKey: "navCheckIn" },
  { href: "/slots/mensa-nord", labelKey: "navSlots" },
  { href: "/partner", labelKey: "navPartner" },
  { href: "/report", labelKey: "navReport" },
];

export function TopNav() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const { profile, mockMode } = useAuth();

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-loop-sand/90 border-b border-white/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="rounded-full bg-loop-green px-2 py-1 text-xs text-white uppercase tracking-wide">
            {t("pilotBadge")}
          </span>
          Loop
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-loop-slate/80 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href ? "text-loop-green font-semibold" : ""
              }
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/report">{t("ctaReport")}</Link>
          </Button>
          <Button variant="primary" asChild>
            <Link href={profile ? "/slots/mensa-nord" : "/checkin"}>
              {profile ? t("ctaStart") : t("navCheckIn")}
            </Link>
          </Button>
        </div>
      </div>
      {mockMode && (
        <div className="bg-loop-rose/10 px-4 py-1 text-center text-xs text-loop-rose">
          {t("mockWarning")}
        </div>
      )}
    </header>
  );
}
