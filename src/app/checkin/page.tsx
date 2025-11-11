import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CheckInScanner } from "@/components/checkin/checkin-scanner";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listVenues, getVenueById } from "@/lib/repositories/loop-repository";
import { AuthGuard } from "@/components/auth/auth-guard";

interface Props {
  searchParams?: Promise<{ venue?: string }>;
}

export default async function CheckInPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const t = await getTranslations("checkin");
  const venues = await listVenues();
  const activeVenue = params.venue ? await getVenueById(params.venue) : null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-loop-sand">
        <TopNav />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid gap-6 sm:gap-8 rounded-3xl sm:rounded-[40px] border border-white/80 bg-white/90 p-5 sm:p-8 shadow-soft md:grid-cols-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-loop-slate">{t("title")}</h1>
              <div className="mt-4 sm:mt-6">
                <CheckInScanner venues={venues} initialVenueId={activeVenue?.id ?? undefined} />
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {activeVenue ? (
                <Card>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Badge tone="success" className="mb-2 w-fit">
                        {activeVenue.name}
                      </Badge>
                      <p className="text-xs sm:text-sm text-loop-slate/70">{activeVenue.address}</p>
                    </div>
                    <Link
                      href="/checkin"
                      className="text-xs sm:text-sm text-loop-green underline inline-flex items-center gap-1"
                    >
                      <span aria-hidden>←</span>
                      {t("listLink")}
                    </Link>
                  </div>
                  <ul className="mt-3 sm:mt-4 space-y-2 text-xs sm:text-sm text-loop-slate">
                    {activeVenue.meetPoints.map((point) => (
                      <li key={point.id}>
                        <strong>{point.label}:</strong> {point.description}
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : (
                <Card>
                  <p className="text-xs sm:text-sm text-loop-slate/70">{t("listLink")}</p>
                  <ul className="mt-3 sm:mt-4 space-y-2">
                    {venues.map((venue) => (
                      <li key={venue.id}>
                        <Link
                          href={`/checkin?venue=${venue.id}`}
                          className="text-sm sm:text-base text-loop-green underline min-h-[44px] inline-flex items-center"
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
    </AuthGuard>
  );
}
