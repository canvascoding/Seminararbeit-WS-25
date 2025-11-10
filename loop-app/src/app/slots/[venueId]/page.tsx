import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { SlotsBoard } from "@/components/slots/slots-board";
import { listSlots, getVenueById } from "@/lib/repositories/loop-repository";

interface Props {
  params: { venueId: string };
}

export default async function VenueSlotsPage({ params }: Props) {
  const { venueId } = params;
  const venue = await getVenueById(venueId);
  if (!venue) return notFound();
  const slots = await listSlots(venue.id);
  const t = await getTranslations("slots");

  return (
    <div className="min-h-screen bg-loop-sand">
      <TopNav />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-wide text-loop-slate/60">
            {venue.address}
          </p>
          <h1 className="text-3xl font-semibold text-loop-slate">{venue.name}</h1>
          <p className="text-loop-slate/70">{t("subtitle")}</p>
        </div>
        <SlotsBoard venue={venue} initialSlots={slots} />
      </main>
      <Footer />
    </div>
  );
}
