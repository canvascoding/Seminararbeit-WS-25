# Loop PWA – Pilot Wuppertal

Campus-PWA für spontane 5–15-Minuten-Begegnungen mit QR-Check-ins, Firebase-Backend und lokalisierten UI-Strings (Deutsch). Das Projekt setzt die Anforderungen aus `assets/prd-loop-mvp.md` um und nutzt das CI aus dem Design-Playbook.

## Tech-Stack
- Next.js 16 (App Router, React 19) + TypeScript + Tailwind CSS 3
- Firebase Auth & Firestore (Client SDK + Admin SDK auf Server Routes)
- React Query für Revalidierung, next-intl für Lokalisierung
- ZXing Browser SDK für QR-Scanner, next-pwa für Service Worker
- Node-Skripte (`qrcode`, `pdfkit`) für QR-Signage (PNG/PDF)

## Setup
1. `cd loop-app && yarn install`
2. `.env.local` anlegen und Firebase/Maps konfigurieren:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
   FIREBASE_ADMIN_CREDENTIALS={"projectId":"...","clientEmail":"...","privateKey":"-----BEGIN PRIVATE KEY-----\n..."}
   ```
   Ohne Credentials läuft die App im Mock-Modus (Demo-Daten, keine Auth).
3. `yarn dev` startet die PWA auf `http://localhost:3000`.

## Nützliche Skripte
| Zweck | Kommando |
| --- | --- |
| Dev-Server | `yarn dev` |
| Produktion bauen | `yarn build && yarn start` |
| Linting | `yarn lint` |
| TypeScript-Check | `yarn typecheck` |
| Matching-Unit-Tests | `yarn test` |
| QR-Signage (PNG/PDF) generieren | `yarn generate:signage` |

## Features (Auszug)
- **Landing / Auth**: Space-Grotesk UI mit Auth-Panel (E-Mail/Passwort + Magic-Link). Profile können Name/Studienfach aktualisieren; lokale Warnung, falls Firebase fehlt.
- **QR-Check-in**: Kamera-Scanner (`@zxing/browser`) inkl. Offline-Hinweis, manueller Eingabe und Venue-Details. Check-ins persistieren Timestamp in `sessionStorage`.
- **Slot-Board**: `/slots/[venueId]` gruppiert Slots in „Jetzt / 15 Minuten / Später“, persistiert Intent-Filter pro Session, begrenzt offene Slots (3) clientseitig und nutzt React Query + API-Routes (`/api/slot/*`).
- **Loop-Status**: `/loop/[loopId]` pollt `/api/loop/status` für Echtzeit-Updates.
- **Safety & Partner**: `/report` sendet Meldungen an `/api/report`; `/partner` bietet KPI-Kacheln, Slot-Formular und Signage-Download stub.
- **PWA**: next-pwa konfiguriert Service Worker + Offline-Fallback (`public/offline.html`), Manifest + Install-Prompt.
- **Content & Lokalisierung**: Alle Texte leben unter `content/de/*.json` und werden über `next-intl` geladen (`middleware.ts` + `NextIntlClientProvider`).
- **Signage**: `scripts/generate-signage.mjs` erzeugt QR-PNG & A4-PDF je Venue (`data/venues.json`) in `public/signage/`.

## Tests
- Vitest deckt die Matching-Engine (`src/lib/matching/match-loop.ts`) ab.
- Weitere Tests (Playwright, E2E QR→Loop) laut PRD noch offen.

## Offene Punkte / TODOs
- Firebase Auth-Token-Weitergabe in API-Routes (derzeit Header-Stub `x-user-id`).
- Firestore Security Rules + App Check Konfiguration deployen.
- Google Maps API-Key + Styling (siehe Umsetzungsplan) integrieren.
- Storybook / ShadCN-Komponentenbibliothek für vollständige CI-Abdeckung.
