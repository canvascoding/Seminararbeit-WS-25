import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("common");

  return (
    <footer className="border-t border-white/60 bg-white/70">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-2">
        <div>
          <p className="text-sm text-loop-slate/70">
            Loop Pilot · Region Wuppertal · Campus-Programm 2025
          </p>
          <p className="text-sm text-loop-slate/70">
            Support: hello@loop.app · Telegram @loopcampus
          </p>
        </div>
        <div className="flex gap-4 text-sm text-loop-slate/70 md:justify-end">
          <Link href="/datenschutz">{t("footerLegal")}</Link>
          <Link href="/impressum">{t("footerImprint")}</Link>
        </div>
      </div>
    </footer>
  );
}
