import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("common");

  return (
    <footer className="border-t border-white/60 bg-white/70">
      <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 px-4 sm:px-6 py-8 sm:py-10 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-loop-slate/70">
            Loop Pilot · BUW Wuppertal · Campus-Programm 2025
          </p>
          <p className="text-xs sm:text-sm text-loop-slate/70">
            Support: info@canvas.holdings
          </p>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-loop-slate/70 md:justify-end">
          <Link href="/datenschutz" className="min-h-[44px] inline-flex items-center hover:text-loop-green transition-colors">
            {t("footerLegal")}
          </Link>
          <Link href="/cookie-richtlinie" className="min-h-[44px] inline-flex items-center hover:text-loop-green transition-colors">
            {t("footerCookies")}
          </Link>
          <Link href="/impressum" className="min-h-[44px] inline-flex items-center hover:text-loop-green transition-colors">
            {t("footerImprint")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
