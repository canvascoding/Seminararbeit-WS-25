import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Impressum · Loop",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-loop-sand">
      <TopNav />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-loop-slate">
        <h1 className="text-3xl font-semibold">Impressum</h1>
        <p className="text-loop-slate/70">
          Ergänze hier bitte das vollständige Impressum mit Ansprechpartner, Adresse und
          Kontaktinformationen.
        </p>
      </main>
      <Footer />
    </div>
  );
}
