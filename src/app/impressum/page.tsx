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
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Projektprofil</h2>
          <p>
            Loop ist ein Pilot- und Forschungsprojekt der Bergischen Universität Wuppertal (BUW)
            im Rahmen des Campus-Programms 2025. Die operative Plattform, ihr Hosting sowie die
            Bereitstellung der digitalen Dienste werden in enger Abstimmung mit der BUW durch die
            Canvas Holdings UG (haftungsbeschränkt) verantwortet.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Verantwortlich im Sinne von § 5 TMG</h2>
          <div className="space-y-1 text-loop-slate/90">
            <p>Canvas Holdings UG (haftungsbeschränkt)</p>
            <p>Geschäftsführer: Frank Alexander Weber</p>
            <p>Koenenstraße 8</p>
            <p>58313 Herdecke</p>
            <p>
              E-Mail:{" "}
              <a className="underline" href="mailto:info@canvas.holdings">
                info@canvas.holdings
              </a>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Projektpartner</h2>
          <p>
            Bergische Universität Wuppertal (BUW)
            <br />
            Gaußstraße 20, 42119 Wuppertal
          </p>
          <p className="text-sm text-loop-slate/70">
            Ansprechpartner:innen und Zuständigkeiten werden projektabhängig benannt. Für alle
            organisatorischen und rechtlichen Fragen rund um Loop dient der Kontakt an die Canvas
            Holdings UG als zentrale Schnittstelle.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Verantwortlicher i.S.d. § 55 Abs. 2 RStV</h2>
          <p>
            Frank Alexander Weber
            <br />
            Koenenstraße 8, 58313 Herdecke
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Haftungshinweise</h2>
          <p className="text-sm text-loop-slate/70">
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
            externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren
            Betreiber verantwortlich. Alle Angaben ohne Gewähr; bei Bekanntwerden von
            Rechtsverletzungen werden entsprechende Inhalte unverzüglich entfernt.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
