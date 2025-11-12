import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { ActiveLoops } from "@/components/slots/active-loops";
import { listSlots, getVenueById, listActiveLoops } from "@/lib/repositories/loop-repository";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { intentIndex } from "@/data/intents";

interface Props {
  params: Promise<{ venueId: string }>;
}

export default async function VenueSlotsPage({ params }: Props) {
  const { venueId } = await params;
  const venue = await getVenueById(venueId);
  if (!venue) return notFound();
  const slots = await listSlots(venue.id);
  const activeLoops = await listActiveLoops(venue.id);
  const t = await getTranslations("slots");
  const intentLabels =
    venue.defaultIntents
      ?.map((intent) => intentIndex[intent]?.label)
      .filter((label): label is string => Boolean(label)) ?? [];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-loop-sand">
        <TopNav />
        <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <p className="text-sm uppercase tracking-wide text-loop-slate/60">
                {venue.address}
              </p>
              <h1 className="text-3xl font-semibold text-loop-slate">{venue.name}</h1>
              <p className="text-loop-slate/70">{t("subtitle")}</p>
              {intentLabels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {intentLabels.map((label) => (
                    <Badge key={label} className="text-loop-slate">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Button asChild className="sm:self-start">
              <Link href={`/waiting-room?venue=${venue.id}`}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createLoopButton")}
              </Link>
            </Button>
          </div>
          <ActiveLoops venue={venue} slots={slots} initialLoops={activeLoops} />
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
