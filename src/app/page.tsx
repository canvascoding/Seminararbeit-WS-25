import { getTranslations } from "next-intl/server";
import { intents } from "@/data/intents";
import { AuthPanel } from "@/components/auth/auth-panel";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type StatKey = "metricsLoops" | "metricsRetention" | "metricsVenues";

const stats: { labelKey: StatKey; value: string }[] = [
  { labelKey: "metricsLoops", value: "12.480" },
  { labelKey: "metricsRetention", value: "Hoch" },
  { labelKey: "metricsVenues", value: "28" },
];

const pilotMilestones = [
  { week: "Woche 0", label: "Governance & DPIA Skeleton" },
  { week: "Woche 4", label: "MVP Ready · Check-in → Match in <2 Min" },
  { week: "Woche 8", label: "25 Orte aktiv · Netzstabilität" },
  { week: "Woche 12", label: "Auswertung & Go/No-Go" },
];

export default async function Home() {
  const t = await getTranslations("common");

  return (
    <div className="min-h-screen bg-loop-sand">
      <TopNav />
      <main className="mx-auto max-w-6xl space-y-12 sm:space-y-16 px-4 sm:px-6 py-8 sm:py-10">
        <section className="grid gap-6 sm:gap-8 rounded-3xl sm:rounded-[40px] border border-white/80 bg-white/80 p-5 sm:p-8 shadow-soft md:grid-cols-2">
          <div className="space-y-4 sm:space-y-6">
            <Badge tone="success" className="w-fit">
              {t("pilotBadge")}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-semibold text-loop-slate md:text-5xl leading-tight">
              {t("tagline")}
            </h1>
            <p className="text-base sm:text-lg text-loop-slate/80">{t("heroSubline")}</p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Badge tone="neutral">QR · Check-in</Badge>
              <Badge tone="neutral">Unkompliziert</Badge>
              <Badge tone="neutral">Sozial</Badge>
            </div>
          </div>
          <div className="rounded-2xl sm:rounded-3xl border border-loop-green/30 bg-white/70 p-3 sm:p-4">
            <AuthPanel />
          </div>
        </section>

        <section className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
          {stats.map((stat) => (
            <Card key={stat.labelKey} className="text-center">
              <p className="text-xs sm:text-sm uppercase tracking-wide text-loop-slate/60">
                {t(stat.labelKey)}
              </p>
              <p className="mt-2 text-2xl sm:text-3xl font-semibold text-loop-slate">
                {stat.value}
              </p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 sm:gap-8 md:grid-cols-2" id="intents">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-loop-slate">
              Intents & Slots
            </h2>
            <p className="text-sm sm:text-base text-loop-slate/70 mt-2">
              Gruppen nach Startzeit (Jetzt, 15 Minuten, Später) plus Filter pro Intent. Matching garantiert <strong>D30-Retention ≥ 25 %</strong>.
            </p>
            <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
              {intents.map((intent) => (
                <Card key={intent.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base sm:text-lg font-semibold">{intent.label}</p>
                    <Badge tone="success" className="shrink-0">{intent.defaultDuration} Min</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-loop-slate/70">{intent.description}</p>
                </Card>
              ))}
            </div>
          </div>
          <div className="rounded-2xl sm:rounded-[32px] border border-white/70 bg-white/80 p-5 sm:p-6 shadow-loop-card">
            <h3 className="text-lg sm:text-xl font-semibold text-loop-slate">Pilot-Milestones</h3>
            <ul className="mt-4 space-y-2 sm:space-y-3 text-xs sm:text-sm text-loop-slate/80">
              {pilotMilestones.map((item) => (
                <li
                  key={item.week}
                  className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-loop-slate/10 px-3 sm:px-4 py-2.5 sm:py-3"
                >
                  <span className="font-semibold text-loop-green shrink-0">{item.week}</span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
