# Loop Design & Corporate Identity Playbook

## Product Requirements Document (PRD) – MVP Wuppertal

### 1. Überblick & Ziele
- **Produktvision:** Loop reduziert Einsamkeit auf dem Campus, indem spontane, sichere Mikro-Begegnungen (5–15 Min) über eine PWA ausgelöst werden, die mit physischen Touchpoints (Sticker, Poster) harmoniert.
- **Pilotziel (12 Wochen):** ≥10 000 Loops, 1 000–1 500 MAU, D30-Retention ≥25 %, No-Show <15 %, Partner-NPS >40. Diese KPIs fungieren als Abnahmekriterien für den MVP.
- **Scope dieses PRD:** Nutzer:innen sollen sich per QR-Check-in anmelden, Slots auswählen, gematcht werden und den Treffpunkt finden. Partner-Orte pflegen Slots über ein leichtgewichtiges Portal. Sämtliche Texte/UI-Strings werden auf Deutsch geliefert.

### 2. Zielgruppen & Kern-Use-Cases
| Segment | Bedarf | Erfolgssignal |
| --- | --- | --- |
| **Studierende (Erstis, Internationals, Pendler:innen)** | Niederschwelliger Zugang zu spontanen Begegnungen während bestehender Routinen (Mensa, Bibliothek, ÖPNV). | Check-in <30 Sek, wahrgenommene Sicherheit, Wiederholungsrate ≥2 Loops/Woche. |
| **Ambassadors** | Einfaches Aktivieren von Freundeskreisen, Monitoring eingehender Slots. | Übersicht über aktive Slots, einfache Weitergabe von QR-Links. |
| **Orte/Partner (Mensa, Café, Bibliothek)** | Sichtbarkeit der aktiven Slots, Kontrolle über Zeitfenster und Kapazitäten. | Slots können innerhalb von 2 Min erstellt/pausiert werden; Download-Link zu personalisiertem QR-Signage. |

### 3. Nutzerfluss (Happy Path)
1. **Landing/Check-in:** Nutzer:in scannt QR vor Ort → PWA öffnet sich mit Ortskontext, Kamera-Zugriff erlaubt, Location per Geolocation (opt-in) validiert.
2. **Slot & Intent:** Auswahl eines Slots (z. B. „Smalltalk 15 Min“) via ShadCN-Chips; UI folgt Styleguide (Sektion 6ff).
3. **Matching:** Firebase Function matcht 2–4 Personen nach Ort/Zeit/Intent; UI zeigt Countdown + Treffpunkt („Tisch 7“) und Google-Maps-Minimap an.
4. **Treffen & Abschluss:** Nutzer:innen treffen sich; danach Loop-Summary mit Schnellfeedback („Wie lief’s?“) + Safety-Aktionen (Mute/Report).
5. **Partner-Sicht:** Portal listet Live-Slots, Teilnahmezahlen, generiert Download-Links für QR-Signage aus dem `public/signage`-Ordner.

### 4. Funktionale Anforderungen
#### A. Check-in & Auth
- Firebase Auth (E-Mail + Passwort oder Magic Link) in Deutsch lokalisiert.
- QR-Scan über `navigator.mediaDevices.getUserMedia` + `@zxing/browser`; Fallback „Code manuell eingeben“.
- Geolocation-Abfrage optional; App funktioniert auch ohne GPS (nur QR).

#### B. Slot-Management
- Slot-Objekte in Firestore (`slots/{slotId}`) mit Feldern: `venueId`, `intent`, `startAt`, `durationMinutes`, `capacity`, `status`.
- Client zeigt nur Slots des aktuellen Ortes (ermittelt durch QR-Payload).
- Partner-Portal (Next.js App-Route) erlaubt CRUD auf Slots mit Basic Auth (Firebase Auth + Role-Flag `isPartner`).

#### C. Matching & Treffpunkt
- Cloud Function `matchLoopParticipants` sammelt offene Teilnahmen und bildet Gruppen (2–4) nach `intent` und `startAt`.
- Erfolgreiches Match erzeugt `loop`-Dokument + Broadcast an Teilnehmende via Firestore Listener.
- Treffpunkttext + Icon müssen konsistent mit Designsektion 6.3 gestaltet sein.

#### D. Safety & Reporting
- „Melden“-Drawer (Design Abschnitt 6.5) sendet Report via Cloud Function `submitIncident`; speichert in `incidents/{incidentId}`.
- Sperrlogik: Flag `isMuted` verhindert Matching für 30 Min; Admin-UI (später) optional.

#### E. Signage & QR-Generierung
- Serverroute `/api/signage/{venueId}` erstellt QR-PNG über npm-Paket `qrcode` inkl. Loop-Branding (siehe Abschnitt 6).
- Assets werden im Repositorium unter `public/signage/{venueId}.png` abgelegt und direkt via CDN ausgeliefert; kein Firebase Storage nötig.

### 5. Nicht-funktionale Anforderungen
- **Sprache:** Sämtliche UI-Elemente, E-Mails, Fehlermeldungen und Dokumentationen auf Deutsch. Übersetzungsschicht via `next-intl` oder `next-i18next` (mindestens Deutsch; spätere Sprachen optional).
- **Performance:** Check-in → Slotliste <1 Sek (P95), Matching-Response <2 Min. Lighthouse PWA-Score ≥85 mobil.
- **Zugänglichkeit:** WCAG 2.1 AA (Kontraste gem. Farbsystem, `prefers-reduced-motion` respektieren, alle Icons mit Text).
- **Betrieb:** Firestore Sicherheitsregeln erzwingen, dass nur authentifizierte Nutzer:innen ihre eigenen Teilnahmen sehen; Partner:innen nur Slots ihres Ortes bearbeiten.

### 6. Tech Stack & Bibliotheken
- **Frontend:** Next.js (App Router) + TypeScript + ShadCN UI (Radix) mit Design Tokens aus diesem Dokument.
- **Backend:** Firebase Auth, Firestore, Cloud Functions (Node 20), Firebase Hosting für PWA.
- **Maps:** Google Maps JavaScript API (API-Key vorhanden) für Venue-Karten, Treffpunkte und Routenhinweise.
- **QR/Scanner:** `@zxing/browser` (Scanner), `qrcode` (Generator). Optional: `qr-code-styling` falls Design-Anpassungen benötigt werden.
- **State/Networking:** React Query oder Firebase SDK Listener, um Slots/Loops in Echtzeit zu halten.

### 7. Externe APIs & Berechtigungen
| API / Capability | Zweck | UX-Hinweis |
| --- | --- | --- |
| **Camera (getUserMedia)** | QR-Scan | Vorab-Modal mit Nutzen („Wir scannen nur für deinen Check-in“) + Retry-Flow bei verweigerter Berechtigung. |
| **Google Maps JS API** | Venue-Map, Treffpunkt-Hints | Stil-Anpassung (Custom Map Style in Bergische Green) für visuelle Konsistenz. |
| **Geolocation API (optional)** | Validierung des Ortes, Vorschlag naheliegender Spots | Opt-in-Text in Deutsch, klare Ablehnungsoption. |
| **Firebase Auth API** | Registrierung/Login | Magic-Link-Mails im Loop-Ton („Loop dich in 15 Minuten ein“). |
| **Firebase Cloud Functions** | Matching, QR-Generierung, Safety-Reports | Logs in deutscher Zeitzone für einfaches Support-Handling. |

### 8. Content- & Design-Ausrichtung
- UI nutzt Farbschema, Typografie und Komponenten aus den Sektionen 1–9 des CI-Playbooks (z. B. Buttons mit `#78BE20`, Inter/Space Grotesk, 4-pt-Grid).
- Kopie folgt deutschem Tonfall (sektion 8); Beispiele:
  - Primär-CTA: „Loop starten“
  - Slot-Kategorie: „Co-Study · 15 Min · öffentlich“
  - Safety-Hinweis: „Trefft euch sichtbar in der Mensa – Safety first.“
- Signage-Vorlagen in `public/signage/` spiegeln Layout-Regeln (A6-Tischaufsteller, A4-Poster) und enthalten denselben QR-Frame wie im App-Header.

### 9. MVP-Scope & Offene Punkte
- **Im MVP enthalten:** QR-Check-in, Slotwahl, Matching, Google-Maps-Overlay, Partner-Slotverwaltung, Feedback-Formular, Safety-Report.
- **Ausser Scope (später):** NFC, Uni-Single-Sign-On, Push-Notifications, Analytics/BI, Lizenz-/Billing-Module.
- **Risiken:** Kamerazugriff auf iOS Safari (User Education), Google Maps Kosten (Usage Monitoring), Matching-Qualität bei geringer Auslastung (Fallback 1:1 Matches).
- **Nächste Schritte:** Datenmodell in Firestore detaillieren, Figma-Screens für alle Journeys finalisieren, QA-Checkliste (Sektion 9) als Testplan adaptieren.

## 1. Brand North Star
- **Purpose:** Make spontaneous, real-world micro-begegnungen feel easy, trustworthy, and energising for young people in Wuppertal.
- **Experience pillars:** (1) _Warm civic optimism_ – the interface should feel like a friendly campus notice board, not a feed. (2) _Structured calm_ – every action is deliberate and low-friction. (3) _Street-level credibility_ – visuals echo the physical stickers and signage across partner locations.
- **Success signals:** <2 taps to publish an intent, effortless readability in bright daylight, and a consistent visual handoff between the PWA, physical touchpoints, and partner presentations.

## 2. Color System (Black · White · Bergische Green)
| Role | Name | Hex | Usage |
| --- | --- | --- | --- |
| Primary | Bergische Green | `#78BE20` | Brand surfaces, positive CTA buttons, status badges, progress bars |
| Primary Dark | Deep Canopy | `#2F4B0C` | Text on light surfaces within buttons, dark states, charts |
| Neutral Light | Paper White | `#FFFFFF` | Base canvas, cards, modal backgrounds |
| Neutral Dark | Coal Black | `#0B0B0B` | Primary text, icons, borders on light backgrounds |
| Tinted Surface | Mist Green | `#F2F7EB` | Secondary sections, notification trays, list backgrounds |
| Accent Line | Matcha Line | `#C9E19C` | Hairlines, dividers, skeleton loaders derived from the primary hue |

### Application rules
- Maintain **70/20/10 split**: 70% Paper White, 20% Bergische Green (solid or tint), 10% Coal Black for emphasis.
- Buttons: `background: #78BE20`, `text: #0B0B0B`; hover state darkens background to `#5A8F15` to retain AA contrast.
- Use `linear-gradient(135deg, #78BE20 0%, #5A8F15 100%)` sparingly for hero banners and map pins to mirror printed signage.
- Never overlay green text on black; keep high contrast pairings only (white text on green, black text on light surfaces).

## 3. Typography
### Primary interface type
- **Font:** `Inter` (weights 400, 500, 600). Fallback stack: `"Inter", "SF Pro Text", "Segoe UI", system-ui, sans-serif`.
- Rationale: geometric yet friendly, excellent legibility on mobile PWA and dashboards.

### Accent / headline type
- **Font:** `Space Grotesk` 500 for hero numerals, campaign slogans, and partner portal headings. Fallback: `"Space Grotesk", "Roboto", sans-serif`.

### Usage guidelines
- Line height: 1.3 for headings, 1.5 for body copy.
- Minimum text sizes: 16 px body, 14 px meta labels, 32 px hero numerals.
- Limit to two weights per screen to keep the calm aesthetic.

## 4. Iconography & Graphic Language
- Icons: simple 1.5 px strokes, rounded corners, consistent with Material Rounded but recolored in Coal Black or Bergische Green.
- Illustrations: abstract line patterns inspired by the UNI Wuppertal logo (angled stripes) used as masks over photography in monochrome green.
- Data viz: single-color bars/lines in Bergische Green with muted grey grid lines; highlight anomalies using the gradient accent only.

## 5. Layout, Grid & Surfaces
- **Grid:** 4 pt spacing system; mobile layout 12-column (margin 16 px), tablet 12-column (24 px margins), desktop portal 12-column (32 px margins).
- **Card pattern:** white card, 12 px radius, 1 px Matcha Line border, subtle shadow `0 8px 24px rgba(11,11,11,0.08)`.
- **Sticky action bar:** anchored at bottom with green background and safe area padding for iOS.
- **Partner portal split view:** left nav rail (black background, white icons), right content canvas (white) with green section headings.

## 6. Key Screens & Component Blueprint
### 6.1 Welcome / Check-in Hub
- Full-bleed hero with gradient overlay and location badge.
- Display current venue, peak slot suggestions, and QR confirmation state.
- Value props rendered in a three-column list using icon + two-line copy (Inter 14/20).

### 6.2 Slot & Intent Selector
- Filter chips in white with Coal Black text; selected state fills with Bergische Green + bold label.
- Secondary CTA `"Need inspiration?"` sits on tinted surface to keep hierarchy clear.

### 6.3 Live Match State
- Timer ring uses green stroke; match avatars housed in circular white cards with thin black outline.
- Provide contextual instructions ("Meet near Tisch 7") in Space Grotesk 18 px for quick scanning.

### 6.4 Loop Summary & Feedback
- After loop, present stacked cards: mood slider, quick feedback buttons, and report entry.
- Positive reinforcement banner on tinted surface with green iconography and short copy.

### 6.5 Safety & Reporting Drawer
- Black background modal with white text to signal seriousness; CTA buttons invert (white background, black text) for immediate clarity.
- Include escalation steps (Mute, Report, SOS) each with icon + single-line description.

## 7. Motion & Microinteractions
- Use **150 ms** ease-out fades for button presses; 250 ms spring-in for card reveals.
- Matching animation: two white nodes orbit and converge, then flash Bergische Green to signal connection.
- Accessibility: reduce motion option respects prefers-reduced-motion, swapping animations for opacity fades.

## 8. Tone of Voice & Copy
- **Voice:** encouraging, concrete, civic-minded. Example: "Loop dich zu einem 15-Minuten Walk & Talk".
- **Microcopy:** always indicates duration and safety context ("sichtbar für 15 Min", "öffentlicher Treffpunkt").
- **Error states:** short, action-led messages ("Check-in fehlgeschlagen. WLAN wählen oder QR erneut scannen.").

## 9. Accessibility & QA Checklist
- Maintain contrast ≥ 4.5:1 for all text; test primary button (#78BE20 on #0B0B0B text) which meets WCAG AA.
- Support dynamic type: layout tested for font scaling up to 130% without overlaps.
- All green-only indicators require redundant text or icon to avoid color-dependence.
- Provide haptic feedback on match confirmations and error states for additional modality.

## 10. Implementation Roadmap (Design Ops)
| Week | Focus | Outputs | Owner |
| --- | --- | --- | --- |
| 1 | Palette + Tokens | Figma color styles, CSS variables (`--color-buw-green` etc.) | Product Designer |
| 2 | Type & Icon Kit | Text styles, icon grid, SVG export pipeline | Product Designer |
| 3 | Core Screens | Check-in, Slot, Match, Feedback templates | UX/UI Team |
| 4 | Safety + Partner Portal | Dark-mode modal kit, portal nav components | UX/UI + Safety Lead |
| 5 | Handoff | Design QA checklist, Storybook tokens, CI summary PDF | Design Ops |

## 11. Asset Checklist & Next Steps
- ✅ Logo lockup with stacked version (white on green, black on white).
- ✅ App icon / favicon (white Loop monogram on green square, 16–512 px variants).
- ✅ Sticker & signage templates (QR poster A4, table tent A6) using the same palette.
- ✅ Email + social templates matching typography and gradient usage.
- **Next steps:** build a Figma library with the tokens above, sync to Storybook, and test the check-in + match flows on-device in bright outdoor conditions.
