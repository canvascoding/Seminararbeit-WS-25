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
        <p className="text-loop-slate/70">
          Finale Datenschutzinhalte werden hier eingebunden. Bitte trage den offiziellen Text
          ein, bevor die Seite live geht.
        </p>
      </main>
      <Footer />
    </div>
  );
}
