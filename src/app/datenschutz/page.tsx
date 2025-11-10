import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Datenschutz · Loop",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-loop-sand">
      <TopNav />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-loop-slate">
        <h1 className="text-3xl font-semibold">Datenschutz</h1>
        <section className="space-y-3">
          <p>
            Wir verarbeiten personenbezogene Daten ausschließlich auf Grundlage der
            Datenschutz-Grundverordnung (DSGVO) und des Landesdatenschutzgesetzes NRW. Dieses
            Dokument beschreibt die wesentlichen Verarbeitungen für das Loop Pilotprojekt der
            Bergischen Universität Wuppertal (BUW).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Verantwortliche</h2>
          <div>
            <p className="font-semibold">Fachliche Projektleitung</p>
            <p>Bergische Universität Wuppertal · Campus Programm 2025 · Gaußstraße 20, 42119 Wuppertal</p>
          </div>
          <div>
            <p className="font-semibold">Operative Plattform & Hosting</p>
            <p>Canvas Holdings UG (haftungsbeschränkt), Koenenstraße 8, 58313 Herdecke</p>
            <p>
              Kontakt für Datenschutzanfragen:{" "}
              <a className="underline" href="mailto:info@canvas.holdings">
                info@canvas.holdings
              </a>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Welche Daten verarbeiten wir?</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              Registrierungs- und Slot-Daten, die für die Durchführung verabredeter Begegnungen auf
              dem Campus notwendig sind.
            </li>
            <li>
              Kommunikations- und Supportdaten (z. B. bei Vorfallmeldungen oder Support-E-Mails).
            </li>
            <li>
              Technische Metadaten aus Server-Logs, um Stabilität und Sicherheit zu gewährleisten.
            </li>
            <li>
              Nur die unbedingt erforderlichen Cookies, wie nachfolgend beschrieben. Details enthält
              die <a className="underline" href="/cookie-richtlinie">Cookie-Richtlinie</a>.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Cookies & lokale Speicherung</h2>
          <p>
            Wir setzen ausschließlich Cookies ein, die für das sichere Funktionieren von Loop
            erforderlich sind (Session-Cookies für Login und Sicherheits-Tokens). Optionales Tracking
            oder Marketing-Cookies werden nicht gesetzt. Umfang, Zweck und Speicherdauer der
            eingesetzten Cookies sind in der{" "}
            <a className="underline" href="/cookie-richtlinie">
              Cookie-Richtlinie
            </a>{" "}
            beschrieben.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Rechtsgrundlagen</h2>
          <p>
            Die Datenverarbeitung erfolgt, soweit sie für die Durchführung des Pilotprojekts und zur
            Wahrung berechtigter Interessen der BUW erforderlich ist, auf Basis von Art. 6 Abs. 1
            lit. b und f DSGVO. Bei Einwilligungen (z. B. Feedback-Auswertungen) stützen wir uns auf
            Art. 6 Abs. 1 lit. a DSGVO.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Speicherdauer</h2>
          <p>
            Projekt- und Kommunikationsdaten werden spätestens sechs Monate nach Abschluss des
            jeweiligen Piloten gelöscht, sofern keine gesetzlichen Aufbewahrungsfristen
            entgegenstehen. Technische Logdaten werden in der Regel nach 14 Tagen anonymisiert.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Widerspruch sowie Datenübertragbarkeit. Zudem besteht ein
            Beschwerderecht bei der zuständigen Aufsichtsbehörde (Landesbeauftragte für Datenschutz
            und Informationsfreiheit NRW). Bitte richten Sie Ihre Anliegen an{" "}
            <a className="underline" href="mailto:info@canvas.holdings">
              info@canvas.holdings
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
