"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import type { Slot, Venue } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/providers/auth-provider";
import { getSlotBucket } from "@/lib/utils";
import { intentIndex, intents } from "@/data/intents";

interface Props {
  venue: Venue;
  initialSlots: Slot[];
}

export function SlotsBoard({ venue, initialSlots }: Props) {
  const t = useTranslations("slots");
  const { firebaseUser } = useAuth();
  const [intentFilter, setIntentFilter] = useState<string>(
    () =>
      (typeof window !== "undefined" &&
        window.sessionStorage.getItem("intentFilter")) ||
      "all",
  );
  const [pendingSlots, setPendingSlots] = useState<string[]>([]);
  const { data: slots = [] } = useQuery({
    queryKey: ["slots", venue.id],
    queryFn: async () => {
      const response = await fetch(`/api/slots?venueId=${venue.id}`);
      const json = await response.json();
      return json.slots as Slot[];
    },
    initialData: initialSlots,
    refetchInterval: 30_000,
  });

  const limitReached = pendingSlots.length >= 3;

  const grouped = useMemo(() => {
    const buckets: Record<string, Slot[]> = {
      now: [],
      soon: [],
      later: [],
    };
    slots
      .filter((slot) =>
        intentFilter === "all" ? true : slot.intent === intentFilter,
      )
      .forEach((slot) => {
        const bucket = getSlotBucket(new Date(slot.startAt));
        buckets[bucket].push(slot);
      });
    return buckets;
  }, [slots, intentFilter]);

  const labels: Record<string, string> = {
    now: t("groupNow"),
    soon: t("groupSoon"),
    later: t("groupLater"),
  };

  async function mutateSlot(action: "join" | "cancel", slot: Slot) {
    if (!firebaseUser) return;
    await fetch(`/api/slot/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": firebaseUser.uid,
        "x-user-name": firebaseUser.displayName ?? "",
        "x-user-email": firebaseUser.email ?? "",
      },
      body: JSON.stringify({ slotId: slot.id }),
    });
    setPendingSlots((prev) =>
      action === "join"
        ? Array.from(new Set([...prev, slot.id]))
        : prev.filter((id) => id !== slot.id),
    );
  }

  function persistFilter(intentKey: string) {
    setIntentFilter(intentKey);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("intentFilter", intentKey);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Badge
          tone={intentFilter === "all" ? "success" : "neutral"}
          onClick={() => persistFilter("all")}
          className="cursor-pointer"
        >
          {t("filterIntent")}
        </Badge>
        {intents.map((intent) => (
          <Badge
            key={intent.key}
            tone={intentFilter === intent.key ? "success" : "neutral"}
            className="cursor-pointer"
            onClick={() => persistFilter(intent.key)}
          >
            {intent.label}
          </Badge>
        ))}
      </div>
      <p className="text-xs text-loop-slate/60">{t("persistedFilter")}</p>

      {limitReached && (
        <p className="rounded-2xl bg-loop-amber/30 px-4 py-3 text-sm text-loop-slate">
          {t("limitReached")}
        </p>
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([bucket, bucketSlots]) => (
          <div key={bucket}>
            <p className="text-sm font-semibold uppercase tracking-wide text-loop-slate/60">
              {labels[bucket]}
            </p>
            <div className="mt-2 space-y-3">
              {bucketSlots.length === 0 && (
                <p className="rounded-2xl border border-dashed border-loop-slate/20 px-4 py-3 text-sm text-loop-slate/70">
                  {t("empty")}
                </p>
              )}
              {bucketSlots.map((slot) => {
                const meta = intentIndex[slot.intent];
                const isPending = pendingSlots.includes(slot.id);
                return (
                  <div
                    key={slot.id}
                    className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-loop-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-loop-slate">
                          {meta.label}
                        </p>
                        <p className="text-sm text-loop-slate/70">
                          Start:{" "}
                          {new Date(slot.startAt).toLocaleTimeString("de-DE", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {slot.durationMinutes} Min
                        </p>
                      </div>
                      <Badge tone="neutral">
                        {t("capacity")}: {slot.restSeats ?? slot.capacity}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-loop-slate/70">
                        Treffpunkt:{" "}
                        {
                          venue.meetPoints.find(
                            (point) => point.id === slot.meetPointId,
                          )?.label
                        }
                      </p>
                      {firebaseUser ? (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            disabled={!isPending}
                            onClick={() => mutateSlot("cancel", slot)}
                          >
                            {t("actionCancel")}
                          </Button>
                          <Button
                            disabled={limitReached || isPending}
                            onClick={() => mutateSlot("join", slot)}
                          >
                            {t("actionJoin")}
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-loop-slate/60">
                          Bitte zuerst einloggen.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
