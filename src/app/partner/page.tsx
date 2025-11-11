import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { PartnerDashboard } from "@/components/partner/partner-dashboard";
import { listVenues } from "@/lib/repositories/loop-repository";
import { AuthGuard } from "@/components/auth/auth-guard";

export default async function PartnerPage() {
  const t = await getTranslations("partner");
  const venues = await listVenues();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-loop-sand">
        <TopNav />
        <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
          <div className="rounded-[40px] border border-white/80 bg-white/90 p-8 shadow-loop-card">
            <h1 className="text-3xl font-semibold text-loop-slate">{t("title")}</h1>
            <p className="text-loop-slate/70">{t("subtitle")}</p>
            <div className="mt-6">
              <PartnerDashboard venues={venues} />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
