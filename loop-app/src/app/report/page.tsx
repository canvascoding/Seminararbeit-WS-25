import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { ReportForm } from "@/components/report/report-form";

export default async function ReportPage() {
  const t = await getTranslations("safety");
  const resources = (t.raw("resources") as string[]) ?? [];

  return (
    <div className="min-h-screen bg-loop-sand">
      <TopNav />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
        <div className="rounded-[40px] border border-white/80 bg-white/90 p-8 shadow-loop-card">
          <h1 className="text-3xl font-semibold text-loop-slate">{t("reportTitle")}</h1>
          <p className="text-loop-slate/70">{t("reportSubtitle")}</p>
          <div className="mt-6">
            <ReportForm />
          </div>
          <ul className="mt-6 space-y-2 text-sm text-loop-slate/70">
            {resources.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
