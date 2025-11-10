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

Für Deployments gibt es zusätzlich die Datei `env.runtime.example`, die du als `.env.runtime` kopieren oder direkt in EasyPanel als Environment-Variablen hinterlegen kannst. Diese Werte werden erst beim Container-Start injiziert (Runtime-Loading), sodass der Build ohne Secrets funktioniert.

## Deployment (Docker & EasyPanel)

1. **Image bauen (lokal optional):**
   ```sh
   docker compose build
   docker compose up -d
   ```
   Der Multi-Stage-`Dockerfile` erzeugt ein leichtgewichtiges Next.js-Standalone-Bundle; Environment-Variablen werden nicht ins Image aufgenommen.
2. **Runtime-Variablen setzen:** Kopiere `env.runtime.example` nach `.env.runtime` oder trage die Keys direkt im EasyPanel UI ein. `docker-compose.yml` lädt diese Datei automatisch unter `env_file`, wodurch Variablen erst beim Start verfügbar sind.
3. **EasyPanel-Stack anlegen:**
   - Neues Projekt → Deployment via Git-Repo oder Tarball starten.
   - Im „Docker Compose“ Feld den Inhalt der `docker-compose.yml` einfügen (oder Datei einlesen lassen).
   - Unter „Environment“ sämtliche Produktiv-Keys aus `.env.runtime` hinterlegen.
   - Port 3000 freigeben; EasyPanel kümmert sich um Reverse Proxy/SSL.
4. **Deploy:** EasyPanel führt `docker compose pull && docker compose up -d` aus, wodurch das zuvor gebaute Image mit Runtime-Variablen gestartet wird. Änderungen an `.env.runtime` erfordern lediglich einen Restart (`docker compose up -d`), kein Rebuild.
5. **Automation via GitHub Actions:** Die Workflow-Datei `.github/workflows/deploy.yml` triggert bei jedem Push auf `main` automatisch den bereitgestellten Webhook (EasyPanel-Deploy URL). Lege dazu im GitHub-Repo das Secret `EASYPANEL_DEPLOY_URL` mit dem Wert `http://3.66.71.254:3000/api/deploy/3a6b32233df06c994359f19009d3aecc6e0c2e7e1057b4b8` an. Ohne Secret schlägt der Workflow fehl.

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
