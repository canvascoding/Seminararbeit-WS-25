import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { listVenues } from "@/lib/repositories/loop-repository";
import { VenuesManager } from "@/components/venues/venues-manager";

export default async function VenuesPage() {
  const t = await getTranslations("venues");
  const venues = await listVenues();

  return (
    <div className="min-h-screen bg-loop-sand">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 sm:p-8 shadow-soft space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-loop-slate">
              {t("title")}
            </h1>
            <p className="mt-2 text-sm text-loop-slate/70">{t("subtitle")}</p>
          </div>
          <VenuesManager venues={venues} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
