import { notFound } from "next/navigation";
import { TopNav } from "@/components/layout/top-nav";
import { Footer } from "@/components/layout/footer";
import { LoopStatusCard } from "@/components/loop/loop-status-card";
import { getLoopStatus } from "@/lib/repositories/loop-repository";

interface Props {
  params: { loopId: string };
}

export default async function LoopPage({ params }: Props) {
  const loop = await getLoopStatus(params.loopId);
  if (!loop) return notFound();

  return (
    <div className="min-h-screen bg-loop-sand">
      <TopNav />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <LoopStatusCard loopId={params.loopId} initialLoop={loop} />
      </main>
      <Footer />
    </div>
  );
}
