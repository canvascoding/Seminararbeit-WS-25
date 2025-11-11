"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { IntentKey, Venue, VenueMeetPoint } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { searchPlacesAction, upsertVenueAction } from "@/app/venues/actions";

type IntentLabelKey =
  | "intentSmalltalk"
  | "intentCoStudy"
  | "intentWalkTalk"
  | "intentCoffeeBreak";

type IntentOption = { value: IntentKey; labelKey: IntentLabelKey };

const intentOptions: IntentOption[] = [
  { value: "smalltalk", labelKey: "intentSmalltalk" },
  { value: "coStudy", labelKey: "intentCoStudy" },
  { value: "walkTalk", labelKey: "intentWalkTalk" },
  { value: "coffeeBreak", labelKey: "intentCoffeeBreak" },
];

interface Props {
  venues: Venue[];
}

interface PlaceSuggestion {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  postalCode?: string;
  city?: string;
}

interface FormState {
  id?: string;
  name: string;
  type?: Venue["type"];
  status?: Venue["status"];
  address: string;
  postalCode: string;
  city: string;
  area: string;
  partnerId: string;
  googlePlaceId: string;
  geoLat: string;
  geoLng: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  defaultIntents: IntentKey[];
}

function createEmptyForm(): FormState {
  return {
    name: "",
    type: "mensa",
    status: "draft",
    address: "",
    postalCode: "",
    city: "",
    area: "",
    partnerId: "",
    googlePlaceId: "",
    geoLat: "",
    geoLng: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    defaultIntents: [],
  };
}

function generateMeetPointId() {
  return `meet-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "loop";
}

function createEmptyMeetPoint(): VenueMeetPoint {
  return {
    id: generateMeetPointId(),
    label: "",
    description: "",
    instructions: "",
  };
}

function buildFormFromVenue(venue?: Venue): FormState {
  if (!venue) return createEmptyForm();
  return {
    id: venue.id,
    name: venue.name ?? "",
    type: venue.type ?? "mensa",
    status: venue.status ?? "draft",
    address: venue.address ?? "",
    postalCode: venue.postalCode ?? "",
    city: venue.city ?? "",
    area: venue.area ?? "",
    partnerId: venue.partnerId ?? "",
    googlePlaceId: venue.googlePlaceId ?? "",
    geoLat: venue.geo?.lat?.toString() ?? "",
    geoLng: venue.geo?.lng?.toString() ?? "",
    contactName: venue.contact?.name ?? "",
    contactEmail: venue.contact?.email ?? "",
    contactPhone: venue.contact?.phone ?? "",
    defaultIntents: venue.defaultIntents ?? [],
  };
}

export function VenuesManager({ venues }: Props) {
  const [items, setItems] = useState<Venue[]>(venues);
  const [selectedId, setSelectedId] = useState<string | null>(
    venues[0]?.id ?? null,
  );
  const [form, setForm] = useState<FormState>(
    buildFormFromVenue(venues[0]),
  );
  const [meetPoints, setMeetPoints] = useState<VenueMeetPoint[]>(
    venues[0]?.meetPoints?.length
      ? venues[0].meetPoints.map((point) => ({
          ...point,
          id: point.id && point.id.length ? point.id : generateMeetPointId(),
        }))
      : [createEmptyMeetPoint()],
  );
  const [hintsText, setHintsText] = useState(
    (venues[0]?.checkInHints ?? []).join("\n"),
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [placesQuery, setPlacesQuery] = useState("");
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [qrDownloadingIndex, setQrDownloadingIndex] = useState<number | null>(null);
  const venuesT = useTranslations("venues");
  const slotsT = useTranslations("slots");

  useEffect(() => {
    const current = items.find((item) => item.id === selectedId);
    setForm(buildFormFromVenue(current ?? undefined));
    setMeetPoints(
      current?.meetPoints?.length
        ? current.meetPoints.map((point) => ({
            ...point,
            id: point.id && point.id.length ? point.id : generateMeetPointId(),
          }))
        : [createEmptyMeetPoint()],
    );
    setHintsText((current?.checkInHints ?? []).join("\n"));
  }, [items, selectedId]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.partnerId ?? "").toLowerCase().includes(term) ||
        (item.city ?? "").toLowerCase().includes(term),
    );
  }, [items, searchTerm]);

  const intentLabels = useMemo(
    () =>
      intentOptions.map((option) => ({
        value: option.value,
        label: slotsT(option.labelKey),
      })),
    [slotsT],
  );

  function handleFieldChange<Key extends keyof FormState>(
    field: Key,
    value: FormState[Key],
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleMeetPointChange(
    index: number,
    key: keyof VenueMeetPoint,
    value: string,
  ) {
    setMeetPoints((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [key]: value,
      };
      return next;
    });
  }

  function addMeetPoint() {
    setMeetPoints((prev) => [...prev, createEmptyMeetPoint()]);
  }

  function removeMeetPoint(index: number) {
    setMeetPoints((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  }

  async function handlePlaceSearch(event: React.FormEvent) {
    event.preventDefault();
    setIsSearching(true);
    const result = await searchPlacesAction(placesQuery);
    if (result.success) {
      setPlaces(result.places ?? []);
    } else {
      setMessage({ type: "error", text: venuesT("error") });
    }
    setIsSearching(false);
  }

  function handleApplyPlace(place: PlaceSuggestion) {
    handleFieldChange("address", place.address);
    if (place.postalCode) {
      handleFieldChange("postalCode", place.postalCode);
    }
    if (place.city) {
      handleFieldChange("city", place.city);
    }
    handleFieldChange("googlePlaceId", place.id);
    handleFieldChange("geoLat", place.lat ? place.lat.toString() : "");
    handleFieldChange("geoLng", place.lng ? place.lng.toString() : "");
    if (!form.name) {
      handleFieldChange("name", place.name);
    }
  }

  function handleIntentToggle(value: IntentKey) {
    setForm((prev) => {
      const exists = prev.defaultIntents.includes(value);
      return {
        ...prev,
        defaultIntents: exists
          ? prev.defaultIntents.filter((intent) => intent !== value)
          : [...prev.defaultIntents, value],
      };
    });
  }

  function handleCreateNew() {
    setSelectedId(null);
    setForm(createEmptyForm());
    setMeetPoints([createEmptyMeetPoint()]);
    setHintsText("");
    setPlaces([]);
    setQrDownloadingIndex(null);
  }

  function ensureMeetPointId(index: number) {
    const point = meetPoints[index];
    if (point.id && point.id.length) return point.id;
    const generated = generateMeetPointId();
    setMeetPoints((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        id: generated,
      };
      return next;
    });
    return generated;
  }

  async function handleDownloadQr(index: number) {
    if (!form.id) {
      setMessage({ type: "error", text: venuesT("qrUnavailable") });
      return;
    }
    const meetPointId = ensureMeetPointId(index);
    const meetPoint = meetPoints[index];
    setQrDownloadingIndex(index);
    try {
      const response = await fetch(
        `/api/qr/${encodeURIComponent(form.id)}/${encodeURIComponent(meetPointId)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to download QR");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const venueSlug = slugify(form.name || "loop");
      const pointSlug = slugify(meetPoint.label || meetPointId);
      link.href = url;
      link.download = `${venueSlug}-${pointSlug}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: venuesT("error") });
    } finally {
      setQrDownloadingIndex(null);
    }
  }

  function buildPayload() {
    return {
      id: form.id,
      name: form.name,
      type: form.type,
      status: form.status,
      address: form.address,
      postalCode: form.postalCode,
      city: form.city,
      area: form.area,
      partnerId: form.partnerId,
      googlePlaceId: form.googlePlaceId,
      geo: {
        lat: Number(form.geoLat || 0),
        lng: Number(form.geoLng || 0),
      },
      defaultIntents: form.defaultIntents,
      checkInHints: hintsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      meetPoints: meetPoints.map((point) => ({
        ...point,
        id: point.id && point.id.length ? point.id : generateMeetPointId(),
      })),
      contact: {
        name: form.contactName || undefined,
        email: form.contactEmail || undefined,
        phone: form.contactPhone || undefined,
      },
    };
  }

  function handleSave() {
    setMessage(null);
    const payload = buildPayload();
    startTransition(async () => {
      const result = await upsertVenueAction(payload);
      if (result.success && result.venue) {
        setMessage({ type: "success", text: venuesT("success") });
        setItems((prev) => {
          const exists = prev.find((entry) => entry.id === result.venue!.id);
          if (exists) {
            return prev.map((entry) =>
              entry.id === result.venue!.id ? result.venue! : entry,
            );
          }
          return [...prev, result.venue!];
        });
        setSelectedId(result.venue.id);
      } else {
        setMessage({ type: "error", text: venuesT("error") });
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-loop-slate">
            {venuesT("listTitle")}
          </p>
          <Button
            variant="secondary"
            onClick={handleCreateNew}
            className="px-3 py-1.5 text-xs"
          >
            {venuesT("createNew")}
          </Button>
        </div>
        <Input
          className="mt-3 text-sm"
          placeholder={venuesT("searchPlaceholder")}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <div className="mt-4 space-y-2">
          {filteredItems.length === 0 && (
            <p className="text-sm text-loop-slate/60">{venuesT("emptyState")}</p>
          )}
          {filteredItems.map((venue) => (
            <button
              key={venue.id}
              onClick={() => setSelectedId(venue.id)}
              className={cn(
                "w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors",
                selectedId === venue.id
                  ? "border-loop-green bg-loop-green/10 text-loop-green"
                  : "border-loop-slate/15 hover:border-loop-green/40 hover:text-loop-green",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{venue.name}</span>
                {venue.status && (
                  <Badge tone={venue.status === "active" ? "success" : "neutral"}>
                    {venue.status === "active"
                      ? venuesT("statusActive")
                      : venue.status === "paused"
                        ? venuesT("statusPaused")
                        : venuesT("statusDraft")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-loop-slate/70">
                {venue.city ?? ""} · {venue.partnerId}
              </p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-6 space-y-6">
        <div>
          <p className="text-sm font-semibold text-loop-slate">
            {form.id ? venuesT("formHeadlineExisting") : venuesT("formHeadlineNew")}
          </p>
          {message && (
            <p
              className={cn(
                "mt-2 text-sm",
                message.type === "success" ? "text-loop-green" : "text-loop-rose",
              )}
            >
              {message.text}
            </p>
          )}
        </div>

        <section className="space-y-4">
          <h3 className="text-xs uppercase tracking-wide text-loop-slate/60">
            {venuesT("sectionGeo")}
          </h3>
          <form onSubmit={handlePlaceSearch} className="space-y-2">
            <label className="text-xs font-medium text-loop-slate/80">
              {venuesT("googleLookupLabel")}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={placesQuery}
                onChange={(event) => setPlacesQuery(event.target.value)}
                placeholder={venuesT("googleLookupPlaceholder")}
              />
              <Button type="submit" disabled={isSearching}>
                {isSearching ? "…" : venuesT("googleLookupButton")}
              </Button>
            </div>
          </form>
          {places.length > 0 ? (
            <div className="space-y-2 rounded-2xl border border-loop-slate/10 p-3">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="rounded-xl border border-loop-slate/20 p-2 text-sm"
                >
                  <p className="font-semibold text-loop-slate">{place.name}</p>
                  <p className="text-xs text-loop-slate/70">{place.address}</p>
                  <Button
                    variant="secondary"
                    className="mt-2 px-3 py-1.5 text-xs"
                    onClick={() => handleApplyPlace(place)}
                  >
                    {venuesT("googleLookupApply")}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            placesQuery &&
            !isSearching && (
              <p className="text-xs text-loop-slate/60">
                {venuesT("googleLookupNoResults")}
              </p>
            )
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldPlaceId")}
              </label>
              <Input
                value={form.googlePlaceId}
                onChange={(event) =>
                  handleFieldChange("googlePlaceId", event.target.value)
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-loop-slate/80">
                  {venuesT("fieldLat")}
                </label>
                <Input
                  value={form.geoLat}
                  onChange={(event) => handleFieldChange("geoLat", event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-loop-slate/80">
                  {venuesT("fieldLng")}
                </label>
                <Input
                  value={form.geoLng}
                  onChange={(event) => handleFieldChange("geoLng", event.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-loop-slate/10 pt-4">
          <h3 className="text-xs uppercase tracking-wide text-loop-slate/60">
            {venuesT("sectionBasics")}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldName")}
              </label>
              <Input
                value={form.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldType")}
              </label>
              <select
                value={form.type}
                onChange={(event) =>
                  handleFieldChange("type", event.target.value as Venue["type"])
                }
                className="mt-1 w-full rounded-2xl border border-loop-slate/15 bg-white px-3 py-2 text-sm"
              >
                <option value="mensa">{venuesT("typeMensa")}</option>
                <option value="library">{venuesT("typeLibrary")}</option>
                <option value="campus">{venuesT("typeCampus")}</option>
                <option value="other">{venuesT("typeOther")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldStatus")}
              </label>
              <select
                value={form.status}
                onChange={(event) =>
                  handleFieldChange("status", event.target.value as Venue["status"])
                }
                className="mt-1 w-full rounded-2xl border border-loop-slate/15 bg-white px-3 py-2 text-sm"
              >
                <option value="draft">{venuesT("statusDraft")}</option>
                <option value="active">{venuesT("statusActive")}</option>
                <option value="paused">{venuesT("statusPaused")}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldPartner")}
              </label>
              <Input
                value={form.partnerId}
                onChange={(event) => handleFieldChange("partnerId", event.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-loop-slate/80">
              {venuesT("fieldIntents")}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {intentLabels.map((intent) => (
                <button
                  key={intent.value}
                  type="button"
                  onClick={() => handleIntentToggle(intent.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs",
                    form.defaultIntents.includes(intent.value)
                      ? "border-loop-green bg-loop-green/10 text-loop-green"
                      : "border-loop-slate/20 text-loop-slate hover:border-loop-green/60 hover:text-loop-green",
                  )}
                >
                  {intent.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-loop-slate/10 pt-4">
          <h3 className="text-xs uppercase tracking-wide text-loop-slate/60">
            {venuesT("sectionAddress")}
          </h3>
          <div>
            <label className="text-xs font-medium text-loop-slate/80">
              {venuesT("fieldAddress")}
            </label>
            <Input
              value={form.address}
              onChange={(event) => handleFieldChange("address", event.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldPostalCode")}
              </label>
              <Input
                value={form.postalCode}
                onChange={(event) => handleFieldChange("postalCode", event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldCity")}
              </label>
              <Input
                value={form.city}
                onChange={(event) => handleFieldChange("city", event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldArea")}
              </label>
              <Input
                value={form.area}
                onChange={(event) => handleFieldChange("area", event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldContactName")}
              </label>
              <Input
                value={form.contactName}
                onChange={(event) => handleFieldChange("contactName", event.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldContactEmail")}
              </label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  handleFieldChange("contactEmail", event.target.value)
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-loop-slate/80">
                {venuesT("fieldContactPhone")}
              </label>
              <Input
                value={form.contactPhone}
                onChange={(event) =>
                  handleFieldChange("contactPhone", event.target.value)
                }
              />
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-loop-slate/10 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wide text-loop-slate/60">
              {venuesT("sectionMeetPoints")}
            </h3>
            <Button
              variant="secondary"
              className="px-3 py-1.5 text-xs"
              onClick={addMeetPoint}
            >
              {venuesT("addMeetPoint")}
            </Button>
          </div>
          <div className="space-y-3">
            {meetPoints.map((point, index) => (
              <div
                key={index}
                className="rounded-2xl border border-loop-slate/10 p-3 space-y-3"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-loop-slate/80">
                      {venuesT("fieldMeetPointLabel")}
                    </label>
                    <Input
                      value={point.label}
                      onChange={(event) =>
                        handleMeetPointChange(index, "label", event.target.value)
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-loop-slate/80">
                      {venuesT("fieldMeetPointDescription")}
                    </label>
                    <Input
                      value={point.description}
                      onChange={(event) =>
                        handleMeetPointChange(index, "description", event.target.value)
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-loop-slate/80">
                    {venuesT("fieldMeetPointInstructions")}
                  </label>
                  <Textarea
                    rows={2}
                    value={point.instructions ?? ""}
                    onChange={(event) =>
                      handleMeetPointChange(index, "instructions", event.target.value)
                    }
                  />
                </div>
                <div className="rounded-2xl border border-dashed border-loop-slate/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-loop-slate/60">
                      {venuesT("qrSectionLabel")}
                    </span>
                    <Button
                      type="button"
                      variant="secondary"
                      className="px-3 py-1.5 text-xs"
                      onClick={() => handleDownloadQr(index)}
                      disabled={qrDownloadingIndex === index || !form.id}
                    >
                      {qrDownloadingIndex === index
                        ? venuesT("qrGenerating")
                        : venuesT("qrButton")}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-loop-slate/60">
                    {venuesT("meetPointQrHint", {
                      label:
                        point.label && point.label.length
                          ? point.label
                          : venuesT("fieldMeetPointLabel"),
                    })}
                  </p>
                </div>
                {meetPoints.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-loop-rose hover:text-loop-rose"
                    onClick={() => removeMeetPoint(index)}
                  >
                    {venuesT("remove")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4 border-t border-loop-slate/10 pt-4">
          <h3 className="text-xs uppercase tracking-wide text-loop-slate/60">
            {venuesT("sectionHints")}
          </h3>
          <Textarea
            rows={4}
            value={hintsText}
            placeholder={venuesT("fieldHints")}
            onChange={(event) => setHintsText(event.target.value)}
          />
        </section>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? venuesT("saving") : venuesT("saveButton")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
