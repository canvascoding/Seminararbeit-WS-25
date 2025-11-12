/// <reference types="google.maps" />

"use client";

import { memo, useEffect, useRef } from "react";

type MarkerTone = "meeting" | "participant" | "self";

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  tone: MarkerTone;
}

interface MeetingMapProps {
  center: { lat: number; lng: number } | null;
  markers: MapMarker[];
}

declare global {
  interface Window {
    google?: typeof google;
  }
}

let googleMapsPromise: Promise<typeof google.maps> | null = null;

async function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === "undefined") {
    throw new Error("Maps können nur im Browser geladen werden.");
  }
  if (window.google?.maps) {
    return window.google.maps;
  }
  if (!googleMapsPromise) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error("Google Maps API Key fehlt.");
    }
    googleMapsPromise = new Promise((resolve, reject) => {
      const scriptId = "google-maps-sdk";
      const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
      const attachListeners = (target: HTMLScriptElement) => {
        target.addEventListener("load", () => {
          if (window.google?.maps) {
            resolve(window.google.maps);
          } else {
            reject(new Error("Google Maps konnten nicht geladen werden."));
          }
        });
        target.addEventListener("error", () => reject(new Error("Google Maps Script Fehler.")));
      };
      if (existingScript) {
        attachListeners(existingScript);
        return;
      }
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker`;
      script.async = true;
      script.defer = true;
      attachListeners(script);
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
}

export const MeetingMap = memo(function MeetingMap({ center, markers }: MeetingMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRefs = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current = [];
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function renderMap() {
      if (!center || !containerRef.current) return;
      const maps = await loadGoogleMaps();
      if (cancelled) return;
      if (!mapRef.current) {
        mapRef.current = new maps.Map(containerRef.current, {
          center,
          zoom: 16,
          disableDefaultUI: true,
        });
      } else {
        mapRef.current.setCenter(center);
      }
      markerRefs.current.forEach((marker) => marker.setMap(null));
      markerRefs.current = markers.map((marker) => {
        const color =
          marker.tone === "meeting"
            ? "#50a050"
            : marker.tone === "self"
              ? "#2563eb"
              : "#e63946";
        return new maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          map: mapRef.current!,
          title: marker.label,
          zIndex: marker.tone === "self" ? 3 : marker.tone === "meeting" ? 2 : 1,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: marker.tone === "meeting" ? 10 : 7,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });
      });
    }
    renderMap().catch(() => {
      // no-op, error handled via empty map state
    });
    return () => {
      cancelled = true;
    };
  }, [center, markers]);

  if (!center) {
    return (
      <div className="flex min-h-[200px] w-full items-center justify-center rounded-2xl border border-dashed border-loop-slate/20 bg-loop-slate/5 text-sm text-loop-slate/60">
        Karte wird geladen …
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-48 w-full rounded-2xl border border-loop-slate/10 bg-loop-slate/5"
    />
  );
});
