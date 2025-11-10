import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckInScanner } from "@/components/checkin/checkin-scanner";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listVenues, getVenueById } from "@/lib/repositories/loop-repository";

interface Props {
  searchParams?: { venue?: string };
}

export default async function CheckInPage({ searchParams }: Props) {
  const params = searchParams ?? {};
  const t = await getTranslations("checkin");
  const venues = await listVenues();
  const activeVenue = params.venue ? await getVenueById(params.venue) : null;

  return (
    <div className="min-h-screen bg-loop-sand">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 rounded-[40px] border border-white/80 bg-white/90 p-8 shadow-soft md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-semibold text-loop-slate">{t("title")}</h1>
            <div className="mt-6">
              <CheckInScanner initialVenueId={activeVenue?.id ?? undefined} />
            </div>
          </div>
          <div className="space-y-4">
            {activeVenue ? (
              <Card>
                <Badge tone="success" className="mb-2 w-fit">
                  {activeVenue.name}
                </Badge>
                <p className="text-sm text-loop-slate/70">{activeVenue.address}</p>
                <ul className="mt-4 space-y-2 text-sm text-loop-slate">
                  {activeVenue.meetPoints.map((point) => (
                    <li key={point.id}>
                      <strong>{point.label}:</strong> {point.description}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : (
              <Card>
                <p className="text-sm text-loop-slate/70">{t("listLink")}</p>
                <ul className="mt-4 space-y-2">
                  {venues.map((venue) => (
                    <li key={venue.id}>
                      <Link
                        href={`/checkin?venue=${venue.id}`}
                        className="text-loop-green underline"
                      >
                        {venue.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
