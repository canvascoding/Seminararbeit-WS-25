# Loop – Product Requirements Document (MVP Wuppertal)

## 1. Zweck & Kontext
- **Ziel:** In 12 Wochen eine funktionierende Loop-PWA ausrollen, die Studierenden über QR-Check-ins spontane 5–15-Minuten-Begegnungen ermöglicht und dabei das definierte CI/UX aus `loop-design-ci.md` erfüllt.
- **Erfolgskriterien:** ≥10 000 Loops, 1 000–1 500 MAU, D30-Retention ≥25 %, No-Show <15 %, Partner-NPS >40.
- **Sprachvorgabe:** UI, Fehlertexte, E-Mails und Dokumentation ausschließlich auf Deutsch.
- **Pilot-Gates:** Woche 0 Governance (Kick-off + DPIA-Skeleton), Woche 4 MVP-ready (Check-in → Match Ende-zu-Ende <2 Min), Woche 8 Netz stabil (≥25 Orte aktiv), Woche 12 Auswertung/Go-No-Go.
- **Abhängigkeiten:** Zugriff auf Google-Maps-API-Key, QR-Sticker-Produktion, Ambassador-Programm sowie Partner-MoUs müssen vor Entwicklungsstart bestätigt sein.

## 2. Zielgruppen & Use-Cases
| Persona | Bedürfnisse | Relevante Flows |
| --- | --- | --- |
| **Student:in „Mara“ (23)** | Schneller Zugang zu Begegnungen während Mensa- oder Bibliotheksbesuchen. | QR-Check-in, Slot-Auswahl, Match-Anzeige, Feedback. |
| **Ambassador „Deniz“** | Freund:innen aktivieren, Loops bewerben, Status verfolgen. | Teilen von QR/Links, Live-Slot-Status, Erfolgsmeldungen. |
| **Partner-Ort „Mensa Nord“** | Slots planen, Auslastung beobachten, QR-Signage erhalten. | Portal-Login, Slot-CRUD, Signage-Download. |

## 3. Systemübersicht
- **Frontend:** Next.js (App Router) + TypeScript + ShadCN UI; PWA mit Offline-Fallback (s. Design Playbook).
- **Backend/Hosting:** Firebase Auth, Firestore, Cloud Functions, Firebase Hosting.
- **Externe Dienste:** Google Maps JavaScript API (Karten), E-Mail-Versand via Firebase Auth, keine weiteren Analytics im MVP.
- **Assets:** QR-/Signage-Dateien im Repository unter `public/signage/` (kein Firebase Storage).
- **Architektur-Notizen:** 
  - App-Router-Routen: `/` (Landing), `/checkin`, `/slots/[venueId]`, `/loop/[loopId]`, `/partner`, `/report`.
  - Service Worker via Next-PWA oder Workbox: cached shell + signage-Dateien; API-Aufrufe immer online-first.
  - Environment Variables: `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `FIREBASE_ADMIN_CREDENTIALS` (für serverseitige Routes).
  - Deployment-Ziel: Firebase Hosting + Cloud Functions (Region `europe-west3` für Datenresidenz).

## 4. Funktionsmodule & Detailanforderungen
### 4.1 Authentifizierung & Nutzerverwaltung
- Firebase Auth mit E-Mail/Passwort **und** optionalem Magic-Link.
- Registrierung: Name, Hochschule (Freitext), Studienfach (optional). Speicherung unter `users/{uid}`.
- Alle Texte lokalisiert („E-Mail bestätigen“, „Passwort zurücksetzen“).
- Passwort-Richtlinie: min. 10 Zeichen oder Magic-Link-only; Formvalidierung clientseitig mit deutschsprachigen Hinweisen.
- Session-Handling: Firebase Persistence `LOCAL`; automatische Abmeldung nach 30 Tagen Inaktivität.
- Acceptance Criteria:
  1. Registrierung dauert <60 Sek inkl. E-Mail-Bestätigung.
  2. Fehlermeldungen nennen konkrete Ursache („E-Mail bereits vergeben“).
  3. Nutzerprofil kann Name & Studienfach aktualisieren; Audit-Feld `updatedAt`.

### 4.2 QR-Check-in
- QR-Codes kodieren `loop.app/checkin?venue={venueId}`.
- PWA fordert `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`.
- Scanner: `@zxing/browser` → Erfolg springt zur `CheckInPage` mit Venue-Daten aus Firestore.
- Edge Cases: Kamera verweigert → Manuelle Codeeingabe (`venueId`+`slotCode`).
- Weitere Anforderungen:
  - Loading-State mit Hinweis „Kamera wird vorbereitet…“ (max. 800 ms).
  - Bei ungültigem QR (nicht registrierter `venueId`) Fehlermeldung + Link zu Ortsliste.
  - Offline-Case: Zeige Cache-Hinweis und bitte um erneutes Scannen sobald Verbindung steht.
  - Telemetrie (lokal): Speichere Zeitstempel `checkedInAt` in SessionStorage für spätere Slotfilter.

### 4.3 Slot- & Intent-Auswahl
- Slots filtern nach `intent` (Smalltalk, Co-Study, Walk&Talk etc.) und `startAt`.
- UI: Chips & Karten in Bergische Green, Layout nach Abschnitt 6 des CI-Dokuments.
- Teilnahme wird als Dokument `slotAttendees/{slotId}/{uid}` gespeichert mit `status: "pending"`.
- Intents (erste Version):

| Key | Label | Beschreibung | Standarddauer |
| --- | --- | --- | --- |
| `smalltalk` | „Smalltalk“ | lockeres Kennenlernen in öffentlichen Bereichen | 10 Min |
| `coStudy` | „Co-Study“ | gemeinsame Lernsession am Tisch | 15 Min |
| `walkTalk` | „Walk & Talk“ | Spaziergang auf dem Campus | 15 Min |
| `coffeeBreak` | „Kaffee & kurze Pause“ | an Café-Partner gekoppelt | 10 Min |

- Teilnahme-Limits: max. 3 gleichzeitige „pending“-Slots pro Nutzer:in; UI blockiert darüber hinaus.
- Acceptance Criteria:
  1. Slots sind nach Startzeit gruppiert (Jetzt, In 15 Min, Später).
  2. Intent-Filter persistiert pro Sitzung.
  3. Slotkarte zeigt Treffpunkt, Restplätze und Dauer; Kontrast AA-konform.

### 4.4 Matching-Engine
- Cloud Function `matchLoopParticipants` (Node 20):
  1. Trigger: Firestore onCreate bei `slotAttendees`.
  2. Sammelt offene Teilnehmer:innen (max. 4).
  3. Erstellt `loops/{loopId}` mit Feldern `venueId`, `slotId`, `participants`, `meetPoint`, `status`.
  4. Sendet Ergebnis via Firestore Listener (Client zeigt Countdown + Treffpunkt).
- Failover: Wenn nach 2 Min nicht genug Teilnehmende → Info „Loop findet zu zweit statt“ oder „Slot verschoben“.
- Technische Details:
  - Funktion läuft idempotent: nutzt Firestore Transaction, um doppelte Matches durch Race Conditions zu verhindern.
  - Priorisierung: sortiert `slotAttendees` nach `joinedAt`, um faire Reihenfolge zu sichern.
  - `meetPoint` wird aus `slots.meetPointId` gezogen; falls mehrere Treffpunkte verfügbar, rotiert per Round-Robin.
  - Status-Übergänge: `scheduled → inProgress` (automatisch bei Startzeit) → `done` (nach Dauer oder Feedbackeingang). Cloud Scheduler setzt Timeout falls kein Feedback kommt.
  - Abbruch: Wenn Teilnehmer:in vor Match cancelt, setzt Client `status: "canceled"`; Function berücksichtigt dies im nächsten Batch.

### 4.5 Treffpunkt & Google Maps
- Jede Venue besitzt Geokoordinaten + `meetPoints` im Dokument `venues/{venueId}`.
- Client lädt Google Maps JS SDK (mit bereitgestelltem API-Key) und zeigt Marker + Wegbeschreibung (optional link zu Google Maps App).
- Kartenstil an Loop-CI angepasst (grüne Pins, Mist-Green-Flächen).
- Funktionen:
  - Map wird nur bei aktiver Verbindung geladen; bei Offline Zustand statische Illustration.
  - Treffpunkt-Karte zoomt auf 50 m Radius; zweiter Marker zeigt Nutzer-Approximation (wenn Geolocation freigegeben).
  - CTA „Route öffnen“ öffnet `https://www.google.com/maps/dir/?api=1&destination=<lat,lng>`.
  - Acceptance Criteria: Map lädt <1,5 Sek bei LTE; Screenreader-Text beschreibt Treffpunkt („Treffpunkt Tisch 7 bei Mensa Nord“).

### 4.6 Feedback & Safety
- Nach Loop erscheint Bottom Sheet (Design Abschnitt 6.4/6.5):
  - Mood-Slider, Buttons „War super“, „Neutral“, „Ging so“ → Speichern in `feedback/{loopId}/{uid}`.
  - Button „Problem melden“ öffnet Safety-Drawer; Formular sendet POST `/api/report` → Cloud Function `submitIncident` → Collection `incidents`.
  - Temporäres „Mute“ (30 Min) wird clientseitig markiert (`users/{uid}.mutedUntil`).
- Mood-Slider speichert zusätzlich `energyLevel` (1–5) für spätere Auswertungen.
- Safety-Formular Felder: `incidentType` (Dropdown), `description` (max. 500 Zeichen), optional Foto-Upload (nicht im MVP).
- Nach Report erhält Nutzer:in Bestätigung + Hinweis auf Moderatoren-Reaktionszeit (<24 h).
- Feedback-Reminder nach 5 Min falls Sheet nicht ausgefüllt wurde (lokale Notification Banner).

### 4.7 Partner-Portal
- Separate Next.js-Route `/partner` mit Role-Based Access (Firestore-Claim `role: "partner"`).
- Funktionen:
  - Slot-Liste (sortiert nach Datum).
  - Formular Neuer Slot (`intent`, `startAt`, `duration`, `capacity`, `meetPointId`).
  - Aktionen: aktivieren/deaktivieren.
  - Signage-Download: Link zu `public/signage/{venueId}.pdf`.
- Zusätzliche Anforderungen:
  - Dashboard-KPI: heutige Slots, aktuelle Teilnehmendenzahl, No-Show-Quote (sobald Feedback vorhanden).
  - Multi-Venue-Support: Partner mit mehreren Standorten können per Dropdown wechseln.
  - Activity Log (letzte 10 Änderungen) zur Nachvollziehbarkeit.
  - Responsives Layout (Tablet-first), da viele Partner Tablets nutzen.

### 4.8 Signage & QR-Generierung
- API-Route `/api/signage/[venueId]`:
  - Validiert Partner-Auth.
  - Nutzt npm-Paket `qrcode` um PNG zu erzeugen.
  - Betten CI-Elemente ein (Farbe #78BE20, Logo).
  - Speichert Datei in `public/signage/{venueId}.png` via Node-FS (Schreibrecht nötig außerhalb MVP? → Bei Deployment statisch vorbereiten).
- Alternativ während Build statische QR-Dateien generieren (Script `yarn generate:signage`).
- Dateien werden zusätzlich als PDF (`{venueId}.pdf`) exportiert (A4 + A6 Layout) damit Druckereien direkt drucken können.
- Caching: Responses setzen `Cache-Control: public, max-age=86400`; Link in Portal invalidiert, wenn QR neu generiert wird (z. B. Venue-URL geändert).
- QR-Frame enthält Kurz-URL + CTA („Loop starten“) in Space Grotesk, um Wiedererkennung sicherzustellen.

### 4.9 Lokalisierung & Content-Management
- Alle Strings werden über `next-intl` verwaltet; Schlüsselstruktur `checkin.cameraPermission.denied`, `loop.feedback.prompt`, etc.
- Content-Dateien liegen unter `content/de/*.json`; Partner-spezifische Hinweise (`venueTips`) werden in Firestore `venues` gepflegt.
- Texthaftung: Safety-Meldungen juristisch geprüft, daher in separater Datei `content/de/safety.json`.
- Consent- und Datenschutztexte referenzieren Dokumente der Uni Wuppertal; Links müssen versioniert werden.

## 5. API- & Endpoint-Übersicht
| Route / Function | Methode | Payload / Query | Antwort (200) | Fehlerfälle |
| --- | --- | --- | --- | --- |
| `/api/auth/sign-up` (Firebase SDK) | POST | `{email, password, name}` | Firebase User Objekt | 400 bei Validierungsfehler, 409 wenn E-Mail existiert. |
| `/api/auth/magic-link` | POST | `{email}` | `{message: "Link gesendet"}` | 429 bei Rate-Limit (max. 5/Std). |
| `/api/checkin` (Page) | GET | `?venueId=abc` | SSR-Page mit Venue/Slots | 404 wenn Venue unbekannt, 302 Redirect auf `/venues`. |
| `/api/slots` | GET | `?venueId=abc&from=timestamp` | `{slots: Slot[]}` | 304 falls ETag unverändert. |
| `/api/slot/join` | POST | `{slotId}` | `{status: "pending", attendeeId}` | 409 wenn Slot voll, 403 wenn Nutzer gesperrt. |
| `/api/slot/cancel` | POST | `{slotId}` | `{status: "canceled"}` | 410 wenn Slot bereits gestartet. |
| `matchLoopParticipants` | Firestore Trigger | `slotAttendees` Document | Erstellt `loops/{loopId}` | Loggt Warnung wenn <2 Teilnehmer:innen nach Timeout. |
| `/api/loop/status` | GET | `?loopId=xyz` | `{status, meetPoint, participants}` | 404 wenn Loop unbekannt oder nicht berechtigt. |
| `/api/report` | POST | `{loopId, type, description}` | `{status: "received", incidentId}` | 422 bei zu langer Beschreibung, 403 wenn nicht Teilnehmender. |
| `/api/partner/slots` | GET | Header `Authorization: Bearer ...` | `{slots: Slot[]}` | 401 bei fehlender Session, 403 bei fehlender Partner-Rolle. |
| `/api/partner/slot` | POST | SlotPayload | `{slotId}` | 400 bei Validation, 409 bei Überschneidung >5 Slots/Zeitraum. |
| `/api/signage/[venueId]` | GET | Header `Authorization` | PNG/PDF Stream + `Content-Disposition: attachment` | 404 wenn Venue nicht dem Partner gehört. |

**SlotPayload Beispiel**
```json
{
  "venueId": "mensa-nord",
  "intent": "smalltalk",
  "startAt": "2025-04-02T11:30:00.000Z",
  "durationMinutes": 15,
  "capacity": 4,
  "meetPointId": "table-7"
}
```

## 6. Datenmodell (Firestore Collections)
```text
users/{uid} {
  displayName: string,
  email: string,
  studyField?: string,
  mutedUntil?: Timestamp,
  role?: "partner" | "admin"
}

venues/{venueId} {
  name: string,
  address: string,
  geo: { lat: number, lng: number },
  meetPoints: [{ id: string, label: string, description: string }],
  partnerId: string
}

slots/{slotId} {
  venueId: string,
  intent: "smalltalk" | "coStudy" | "walkTalk" | string,
  startAt: Timestamp,
  durationMinutes: number,
  capacity: number (2-4),
  status: "open" | "closed" | "paused",
  meetPointId: string
}

slotAttendees/{slotId}/{uid} {
  userId: string,
  joinedAt: Timestamp,
  status: "pending" | "matched" | "canceled"
}

loops/{loopId} {
  slotId: string,
  venueId: string,
  participants: [userId],
  meetPoint: { label: string, description: string },
  startAt: Timestamp,
  status: "scheduled" | "inProgress" | "done"
}

feedback/{loopId}/{uid} {
  mood: "good" | "neutral" | "bad",
  comment?: string,
  submittedAt: Timestamp
}

incidents/{incidentId} {
  loopId: string,
  reporterId: string,
  type: "safety" | "noShow" | "other",
  description: string,
  createdAt: Timestamp,
  status: "open" | "reviewed"
}
```

**Indexes & Constraints**
- Composite Index 1: `slots` auf (`venueId`, `startAt`) für Listenansicht.
- Composite Index 2: `slotAttendees` auf (`slotId`, `status`) für Matching.
- TTL: `slotAttendees` Dokumente werden via Cloud Function nach 48 h gelöscht.
- `incidents.status` nur setzbar durch Admin-Funktion (`resolveIncident`), nicht direkt durch Client.

## 7. Security & Berechtigungen
- Firestore Rules (Auszug):
  - Nutzer:innen dürfen nur ihr eigenes `users/{uid}`-Dokument lesen/schreiben.
  - Lesen `slots`, `venues` erlaubt (öffentlich).
  - Schreiben in `slotAttendees` nur für eigene UID.
  - `loops` lesen nur wenn `userId` ∈ `participants`.
  - `incidents` schreiben erlaubt (auth), lesen nur Admin.
  - Partner:innen (Custom Claim `role == "partner"`) dürfen `slots` mit `venue.partnerId == uid` schreiben und `/api/signage` nutzen.
- Beispiel-Regel:
```javascript
match /slotAttendees/{slotId}/{userId} {
  allow create: if request.auth.uid == userId && request.resource.data.size() <= 1*1024;
  allow delete: if request.auth.uid == userId && get(/databases/(default)/documents/slots/{slotId}).data.startAt > request.time;
  allow read: if request.auth.uid != null && request.auth.uid == userId;
}
```
- Rate-Limits auf API-Ebene über Firebase App Check + Cloud Functions (max. 20 Slot-Joins pro Nutzer:in und Tag).
- Secrets (API-Keys) nur serverseitig; Client erhält ausschließlich `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, kein Firestore Admin Key.

## 8. Nicht-funktionale Anforderungen
- **Performance:** P95 <1 Sek für Slotliste; Matching bestätigt binnen 2 Min. QR-Scanner initialisiert <800 ms.
- **PWA:** Offline-Page mit Hinweis („Loop benötigt Internet für Matching“), aber Shell installierbar.
- **Accessibility:** Kontraste nach CI, Screenreader-Labels, Fokuszustände, `prefers-reduced-motion`.
- **Logging:** Cloud Functions loggen strukturierte Events (Deutsch, UTC+1) für Support. Kein externes Analytics-Tool im MVP.
- **Kompatibilität:** Unterstützte Browser: iOS Safari 16+, Chrome 120+, Firefox 120+, Edge 120+. Progressive Enhancement für ältere Versionen (Fallback auf manuelle Slotliste).
- **Fehlerhandling:** Alle API-Fehler liefern `errorCode`, `message`, `hint` (Deutsch) für konsistente Toasts.
- **Monitoring:** Firebase Function Logs + Crashlytics Lite (optional) für JS-Errors; Pager nur bei kritischen Ausfällen (>5% API-Fehler in 5 Min).
- **Datenschutz:** Minimaldaten, Auto-Löschung personenbezogener Feedbacks nach 6 Monaten (Scheduled Function).
- **Release-Qualität:** Vor jedem Release automatischer CI-Lauf (Lint, Type Check, Unit Tests für Matching-Logik, E2E-Test QR→Match via Playwright mit Mock-Kamera).

## 9. Offene Punkte & To-dos
| Nr. | Aufgabe | Beschreibung | Owner | Deadline |
| --- | --- | --- | --- | --- |
| 1 | Design QA | Alle Screens aus `loop-design-ci.md` in Figma reviewen, Tokens nach Storybook syncen. | Product Design | Woche 2 |
| 2 | QR-Generierungs-Skript | `npm run generate:signage` implementieren (CLI mit Venue-Liste). | Frontend | Woche 2 |
| 3 | Maps-Styling | JSON-Style für Google Maps (Pins, Farben) erstellen + testen. | Frontend | Woche 3 |
| 4 | Testplan | Szenarien Kamera-Permission, iOS Safari, Low-Light, Offline definieren. | QA Lead | Woche 3 |
| 5 | Content | Community-/Partner-Onboardingtexte (Deutsch) finalisieren + in JSON importieren. | Content Ops | Woche 4 |
| 6 | Security Review | Firestore Rules + Cloud Function IAM Checkliste durchgehen. | Tech Lead | Woche 4 |
| 7 | Go-Live Runbook | Incident-Response, Support-Zeiten, Eskalationskette dokumentieren. | Operations | Woche 5 |

Dieses Dokument ergänzt das bestehende CI-Playbook und liefert den Tiefgang für Implementierung & Übergabe an den nächsten Agenten.
