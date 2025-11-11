import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { WaitingRoom } from "@/components/waiting-room/waiting-room";
import { getVenueById } from "@/lib/repositories/loop-repository";
import { AuthGuard } from "@/components/auth/auth-guard";

interface Props {
  searchParams?: Promise<{
    venue?: string;
    room?: string;
    capacity?: string;
  }>;
}

export default async function WaitingRoomPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const venue = params.venue ? await getVenueById(params.venue) : null;
  if (!params.room) {
    const query = new URLSearchParams();
    if (params.venue) query.set("venue", params.venue);
    if (params.capacity) query.set("capacity", params.capacity);
    query.set("room", randomUUID());
    redirect(`/waiting-room?${query.toString()}`);
  }
  const roomId = params.room!;
  const parsedCapacity = Number(params.capacity);
  const defaultCapacity =
    Number.isFinite(parsedCapacity) && parsedCapacity >= 2
      ? Math.min(Math.max(parsedCapacity, 2), 4)
      : 4;
  const t = await getTranslations("waitingRoom");

  return (
    <AuthGuard>
      <div className="min-h-screen bg-loop-sand">
        <TopNav />
        <main className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-[40px] border border-white/80 bg-white/90 p-5 sm:p-8 shadow-soft">
            <h1 className="text-3xl font-semibold text-loop-slate">
              {t("title")}
            </h1>
            <p className="mt-2 text-loop-slate/70">
              {venue
                ? t("subtitleVenue", { venue: venue.name })
                : t("subtitle")}
            </p>
            <div className="mt-8">
              <WaitingRoom
                roomId={roomId}
                venueName={venue?.name}
                venueId={venue?.id}
                venueGeo={venue?.geo}
                meetPoints={venue?.meetPoints ?? []}
                defaultCapacity={defaultCapacity}
              />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
