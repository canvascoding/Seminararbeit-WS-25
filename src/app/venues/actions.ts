"use server";

import { revalidatePath } from "next/cache";
import {
  createVenue,
  updateVenue,
  type VenueInput,
} from "@/lib/repositories/loop-repository";
import type {
  IntentKey,
  Venue,
  VenueMeetPoint,
  VenueStatus,
  VenueContact,
} from "@/types/domain";

export interface VenueFormPayload {
  id?: string;
  name: string;
  type?: Venue["type"];
  status?: VenueStatus;
  address: string;
  postalCode?: string;
  city?: string;
  area?: string;
  partnerId: string;
  googlePlaceId?: string;
  geo: { lat: number; lng: number };
  defaultIntents?: IntentKey[];
  checkInHints?: string[];
  meetPoints: VenueMeetPoint[];
  contact?: VenueContact;
}

function ensureMeetPointIds(meetPoints: VenueMeetPoint[]): VenueMeetPoint[] {
  return meetPoints.map((point) => ({
    ...point,
    id: point.id && point.id.trim().length
      ? point.id
      : `meet-${Math.random().toString(36).slice(2, 8)}`,
  }));
}

export async function upsertVenueAction(
  payload: VenueFormPayload,
): Promise<{ success: boolean; venue?: Venue; error?: string }> {
  try {
    const basePayload: VenueInput = {
      ...payload,
      meetPoints: ensureMeetPointIds(payload.meetPoints),
    };
    const venue = payload.id
      ? await updateVenue(payload.id, basePayload)
      : await createVenue(basePayload);
    revalidatePath("/venues");
    return { success: true, venue };
  } catch (error) {
    console.error("Failed to save venue", error);
    return { success: false, error: "SAVE_FAILED" };
  }
}

interface PlacesResponse {
  places?: {
    id: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    addressComponents?: {
      longText?: string;
      shortText?: string;
      types?: string[];
    }[];
  }[];
}

function extractAddressValue(
  components: NonNullable<PlacesResponse["places"]>[number]["addressComponents"],
  targetTypes: string[],
) {
  if (!components?.length) return undefined;
  const match = components.find((component) =>
    component.types?.some((type) => targetTypes.includes(type)),
  );
  return match?.longText ?? match?.shortText;
}

export async function searchPlacesAction(query: string) {
  if (!query?.trim()) {
    return { success: true, places: [] };
  }

  const apiKey =
    process.env.GOOGLE_PLACES_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return { success: false, error: "MISSING_API_KEY" };
  }

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.location,places.formattedAddress,places.addressComponents",
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: "de",
        }),
        next: { revalidate: 60 },
      },
    );

    const data = (await response.json()) as PlacesResponse & {
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(
        `Places API returned ${response.status}: ${data.error?.message ?? "unknown"}`,
      );
    }
    const places =
      data.places?.map((place) => ({
        id: place.id,
        name: place.displayName?.text ?? "Unbenannter Ort",
        address: place.formattedAddress ?? "",
        lat: place.location?.latitude ?? 0,
        lng: place.location?.longitude ?? 0,
        postalCode: extractAddressValue(place.addressComponents, [
          "postal_code",
        ]),
        city: extractAddressValue(place.addressComponents, [
          "locality",
          "postal_town",
          "administrative_area_level_2",
        ]),
      })) ?? [];

    return { success: true, places };
  } catch (error) {
    console.error("Places search failed", error);
    return { success: false, error: "PLACES_FAILED" };
  }
}
