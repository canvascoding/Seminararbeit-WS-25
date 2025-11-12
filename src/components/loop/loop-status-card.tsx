"use client";

import { useQuery } from "@tanstack/react-query";
import type { Loop } from "@/types/domain";
import { Badge } from "@/components/ui/badge";

interface Props {
  loopId: string;
  initialLoop?: Loop;
}

export function LoopStatusCard({ loopId, initialLoop }: Props) {
  const { data: loop } = useQuery({
    queryKey: ["loop-status", loopId],
    queryFn: async () => {
      const response = await fetch(`/api/loop/status?loopId=${loopId}`);
      if (!response.ok) throw new Error("Loop nicht gefunden");
      return (await response.json()) as Loop;
    },
    initialData: initialLoop,
    refetchInterval: 15_000,
  });

  if (!loop) {
    return (
      <p className="rounded-3xl border border-loop-rose/40 bg-loop-rose/10 px-4 py-3 text-loop-rose">
        Loop nicht gefunden.
      </p>
    );
  }

  const loopTitle = loop.ownerName ? `Loop von ${loop.ownerName}` : "Aktuelles Loop";
  const participantNames =
    loop.participantProfiles?.map((participant) => participant.alias) ??
    loop.participants;

  return (
    <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-loop-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-loop-slate/60">Aktuelles Loop</p>
          <p className="text-xl font-semibold">{loopTitle}</p>
        </div>
        <Badge tone={loop.status === "done" ? "neutral" : "success"}>
          {loop.status}
        </Badge>
      </div>
      <div className="mt-4 space-y-2 text-sm text-loop-slate/80">
        {loop.meetPoint && (
          <p>
            Treffpunkt: {loop.meetPoint.label}
            {loop.meetPoint.description ? ` · ${loop.meetPoint.description}` : ""}
          </p>
        )}
        {loop.startAt && (
          <p>
            Start:{" "}
            {new Date(loop.startAt).toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
        {participantNames.length > 0 && (
          <p>Teilnehmende: {participantNames.join(", ")}</p>
        )}
      </div>
    </div>
  );
}
