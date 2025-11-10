"use client";

import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/providers/auth-provider";
import type { Slot, Venue } from "@/types/domain";
import { intentIndex } from "@/data/intents";

interface Props {
  venues: Venue[];
}

export function PartnerDashboard({ venues }: Props) {
  const { profile, firebaseUser, mockMode } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const partnerVenues = useMemo(() => {
    if (mockMode) return venues;
    return venues.filter((venue) => venue.partnerId === profile?.uid);
  }, [venues, mockMode, profile?.uid]);

  const partnerId = mockMode ? "partner-mock" : profile?.uid ?? "";

  const { data, refetch, isLoading } = useQuery<{
    slots: Slot[];
    metrics: { attendance: number; noShow: number; nps: number };
  }>({
    queryKey: ["partner-slots", partnerId],
    queryFn: async () => {
      const response = await fetch("/api/partner/slots", {
        headers: { "x-partner-id": partnerId },
      });
      if (!response.ok) throw new Error("Fehler");
      return response.json();
    },
    enabled: Boolean(partnerId),
  });

  if (!firebaseUser && !mockMode) {
    return (
      <p className="rounded-3xl border border-loop-rose/40 bg-loop-rose/10 px-4 py-3 text-sm text-loop-rose">
        Bitte zuerst anmelden.
      </p>
    );
  }

  if (!mockMode && profile?.role !== "partner") {
    return (
      <p className="rounded-3xl border border-loop-slate/20 bg-white/70 px-4 py-3 text-sm text-loop-slate/70">
        Partner-Rolle noch nicht freigeschaltet.
      </p>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus(null);
    setError(null);
    try {
      const payload = {
        venueId: formData.get("venueId"),
        intent: formData.get("intent"),
        startAt: formData.get("startAt"),
        durationMinutes: Number(formData.get("durationMinutes")),
        capacity: Number(formData.get("capacity")),
        meetPointId: formData.get("meetPointId"),
      };
      const response = await fetch("/api/partner/slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-partner-id": partnerId,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Fehler");
      setStatus("Slot gespeichert.");
      (event.target as HTMLFormElement).reset();
      refetch();
    } catch (err) {
      console.error(err);
      setError("Slot konnte nicht gespeichert werden.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/60 bg-white/90 p-4 text-center shadow-loop-card">
          <p className="text-sm text-loop-slate/60">Teilnahmen diese Woche</p>
          <p className="text-2xl font-semibold">
            {data?.metrics.attendance ?? "—"}
          </p>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/90 p-4 text-center shadow-loop-card">
          <p className="text-sm text-loop-slate/60">No-Show</p>
          <p className="text-2xl font-semibold">
            {(data?.metrics.noShow ?? 0).toLocaleString("de-DE", {
              style: "percent",
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/90 p-4 text-center shadow-loop-card">
          <p className="text-sm text-loop-slate/60">NPS</p>
          <p className="text-2xl font-semibold">{data?.metrics.nps ?? "—"}</p>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/80 bg-white/90 p-6 shadow-loop-card">
        <h2 className="text-xl font-semibold text-loop-slate">Slot planen</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleSubmit}>
          <select
            name="venueId"
            required
            className="rounded-2xl border border-loop-slate/15 bg-white px-4 py-3 text-sm"
          >
            <option value="">Ort auswählen</option>
            {partnerVenues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
          <select
            name="intent"
            required
            className="rounded-2xl border border-loop-slate/15 bg-white px-4 py-3 text-sm"
          >
            {Object.values(intentIndex).map((intent) => (
              <option key={intent.key} value={intent.key}>
                {intent.label}
              </option>
            ))}
          </select>
          <Input type="datetime-local" name="startAt" required />
          <Input
            type="number"
            name="durationMinutes"
            min={10}
            max={30}
            placeholder="Dauer (Min)"
            required
          />
          <Input
            type="number"
            name="capacity"
            min={2}
            max={4}
            placeholder="Plätze"
            required
          />
          <Input name="meetPointId" placeholder="Treffpunkt-ID" required />
          <div className="md:col-span-2">
            <Button type="submit" disabled={isLoading}>
              Slot speichern
            </Button>
          </div>
          {status && (
            <p className="text-sm text-loop-green md:col-span-2">{status}</p>
          )}
          {error && (
            <p className="text-sm text-loop-rose md:col-span-2">{error}</p>
          )}
        </form>
      </section>

      <section className="space-y-3">
        {(data?.slots ?? []).map((slot) => (
          <div
            key={slot.id}
            className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-loop-card"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-semibold">
                {intentIndex[slot.intent].label}
              </p>
              <p className="text-sm text-loop-slate/60">
                {new Date(slot.startAt).toLocaleString("de-DE")}
              </p>
            </div>
            <p className="text-sm text-loop-slate/70">
              Kapazität: {slot.capacity} · Treffpunkt: {slot.meetPointId}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
