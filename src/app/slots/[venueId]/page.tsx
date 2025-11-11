import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { SlotsBoard } from "@/components/slots/slots-board";
import { listSlots, getVenueById } from "@/lib/repositories/loop-repository";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ venueId: string }>;
}

export default async function VenueSlotsPage({ params }: Props) {
  const { venueId } = await params;
  const venue = await getVenueById(venueId);
  if (!venue) return notFound();
  const slots = await listSlots(venue.id);
  const t = await getTranslations("slots");
  const waitingRoomLink = `/waiting-room?${new URLSearchParams({
    venue: venue.id,
  }).toString()}`;

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
            </div>
            <Button asChild className="sm:self-start">
              <Link href={waitingRoomLink}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createLoopButton")}
              </Link>
            </Button>
          </div>
          <SlotsBoard venue={venue} initialSlots={slots} />
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
