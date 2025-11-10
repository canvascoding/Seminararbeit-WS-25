import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";

export const metadata = {
  title: "Cookie-Richtlinie · Loop",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-loop-sand">
      <TopNav />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 text-loop-slate">
        <h1 className="text-3xl font-semibold">Cookie-Richtlinie</h1>
        <p>
          Diese Richtlinie erläutert, welche Cookies und vergleichbare Technologien wir für das Loop
          Pilotprojekt der Bergischen Universität Wuppertal einsetzen, zu welchem Zweck dies
          geschieht und wie Sie Ihre Einstellungen verwalten können.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Grundsätze</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Wir setzen nur technisch notwendige Cookies ein.</li>
            <li>
              Analyse- oder Marketing-Cookies kommen ausschließlich nach ausdrücklicher
              Einwilligung zum Einsatz – aktuell nutzen wir keine derartigen Cookies.
            </li>
            <li>
              Cookies werden so kurz wie möglich gespeichert und ausschließlich auf Servern in der
              EU verarbeitet.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Eingesetzte Cookies</h2>
          <div className="overflow-x-auto rounded-lg border border-loop-slate/20 bg-white/70">
            <table className="w-full text-left text-sm">
              <thead className="bg-loop-slate/10 text-loop-slate/80">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Zweck</th>
                  <th className="px-4 py-3 font-semibold">Speicherdauer</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-loop-slate/10">
                  <td className="px-4 py-3 font-medium">loop-session</td>
                  <td className="px-4 py-3">
                    Authentifizierungs-Cookie, das die aktive Sitzung speichert und den campusweiten
                    Check-in schützt.
                  </td>
                  <td className="px-4 py-3">14 Stunden bzw. bis zum Logout</td>
                </tr>
                <tr className="border-t border-loop-slate/10">
                  <td className="px-4 py-3 font-medium">loop-csrf</td>
                  <td className="px-4 py-3">Sicherheits-Token zum Schutz vor Cross-Site-Request-Forgery.</td>
                  <td className="px-4 py-3">Session (wird beim Schließen des Browsers entfernt)</td>
                </tr>
                <tr className="border-t border-loop-slate/10">
                  <td className="px-4 py-3 font-medium">loop-preferences</td>
                  <td className="px-4 py-3">
                    Speichert optionale Anzeige- und Barrierefreiheits-Einstellungen auf dem Gerät.
                  </td>
                  <td className="px-4 py-3">30 Tage auf dem Endgerät</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-loop-slate/70">
            Darüber hinaus können lokal im Browser gespeicherte Tokens (z. B. im IndexedDB- oder
            LocalStorage-Bereich) entstehen, die ausschließlich zur Bereitstellung von Loop
            erforderlich sind und nach Abmeldung entfernt werden.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Einwilligung & Widerruf</h2>
          <p>
            Sollte das Projekt zukünftig optionale Analyse- oder Komfortfunktionen testen, holen wir
            vorher Ihre ausdrückliche Einwilligung ein. Sie können erteilte Einwilligungen jederzeit
            in den Einstellungen innerhalb der App oder durch Löschen der Cookies in Ihrem Browser
            widerrufen.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Verwaltung im Browser</h2>
          <p>
            Sie können Cookies jederzeit in den Einstellungen Ihres Browsers löschen oder blockieren.
            Bitte beachten Sie, dass Loop ohne die oben genannten notwendigen Cookies nicht
            vollumfänglich funktioniert.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Ansprechstelle</h2>
          <p>
            Für Fragen zur Cookie-Richtlinie wenden Sie sich bitte an{" "}
            <a className="underline" href="mailto:info@canvas.holdings">
              info@canvas.holdings
            </a>
            . Weitere Informationen zu Ihren Rechten finden Sie in unserer{" "}
            <a className="underline" href="/datenschutz">
              Datenschutzerklärung
            </a>
            .
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
