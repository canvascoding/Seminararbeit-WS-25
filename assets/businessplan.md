Hier ist der **vollständige Businessplan** für **Loop – das soziale Betriebssystem der Stadt** (Pilot: Wuppertal → skalierbar auf NRW/DACH). Ich habe Belege zur Relevanz des Problems eingearbeitet und alle zentralen Annahmen transparent gemacht.

---

## 1) Executive Summary

**Mission:** Einsamkeit unter jungen Menschen spürbar reduzieren, indem **spontane, sichere Mikro‑Begegnungen** dort entstehen, wo sie sich ohnehin aufhalten: Mensa, Bibliothek, Cafés, ÖPNV‑Haltestellen, Sportplätze, Coworking.

**Produkt:** **Loop** ist eine **PWA (Progressive Web App)** + **Ortspartner‑Netz**. Vor Ort **Check‑in** (QR/NFC/WLAN), **15‑Minuten‑Slots** („offen für Smalltalk/Co‑Study/Walk“) und **kontextuelles Matching** (2–4 Personen). **Offline‑first**, **kein Feed**, **keine Chatschlachten** – Begegnung passiert im Alltag.

**Warum jetzt:**

* **Hohe Betroffenheit**: In Deutschland fühlen sich **6 von 10 Erwachsenen** mindestens selten einsam; unter **18–39‑Jährigen** berichten **68 %** Erfahrungen mit Einsamkeit. 
* **Junge Menschen besonders**: **51 %** der 18–35‑Jährigen in DE sind zumindest „moderat“ einsam, **12 %** schwer einsam. 
* **Studierende**: In einer Multi‑Uni‑Studie (n=7.203) berichteten **20,6 %** „major loneliness“; Einsamkeit korreliert stark mit Depressions‑ (OR 8,29) und Angstsymptomen (OR 6,48). ([Frontiers][1])

**Beachhead Wuppertal:**

* Stadt: **365.655 Einwohner:innen** (Stand 31.12.2024). ([Wuppertal][2])
* Uni: **~19.869 Studierende** (WiSe 2025/26, vorläufig). ([uni-wuppertal.de][3])

**Geschäftsmodell (B2B/B2G‑first):**

* **Orte‑Abo (SaaS):** 59 €/Monat/Ort (Sticker, Live‑Slots, Portal, Stats)
* **Lizenzen:** Uni/Stadt (Impact‑Dashboard, Programme)
* **Sponsoring/ESG:** Krankenkassen/Unternehmen finanzieren Slots/Kampagnen
* **Optional Premium (B2C):** 2,99 €/Monat (personalisierte Insights)

**Break‑even (Wuppertal, Jahr 1):**
OPEX ca. **195 k €**. Nicht‑Orte‑Erlöse (Lizenz 45 k € + Sponsoring 20 k € + Premium 4,5 k €) = **69,5 k €**. Benötigte Orte = ((195.000 – 69.500) / (59×12)) ≈ **178 Orte**. (Rechenweg in §11)

---

## 2) Problem & Evidenz

* **Einsamkeit ist verbreitet und gesundheitlich relevant** (psychische Belastungen, Schlaf, Stimmung). **68 %** der 18–39‑Jährigen berichten Einsamkeitserfahrungen; **6/10** in der Gesamtbevölkerung. 
* **Junge Erwachsene/Studierende** sind überproportional betroffen; **51 %** der 18–35‑Jährigen „moderat oder stärker“ einsam. 
* **Studierende in Deutschland**: **20,6 %** major loneliness (C19‑GSWS, 5 Unis, n=7.203); starke Zusammenhänge zu Depression/Angst (OR 8,29/6,48). ([Frontiers][1])

**Implikation für Loop:** Wir adressieren eine **breite, belegte Bedarfslage** in Wuppertal (große Studierendenschaft + urbane Settings) – und setzen auf **niedrige Interaktionshürden** statt „aktive Partnersuche“.

---

## 3) Lösung & Produkt

### 3.1 Kernmechanik („Social Loops“)

1. **Check‑in** am Ort via QR/NFC/WLAN (PWA; kein Appstore).
2. **Slot** wählen (5–15 Min): „Smalltalk“, „Co‑Study“, „Walk & Talk“.
3. **Matching** 2–4 Personen (Zeitfenster + Interessen + Nähe).
4. **Treffpunkt‑Hinweis** vor Ort („Tisch 7“, „Fensterbank Süd“).
5. **Safety Defaults**: öffentliche Orte, Uni‑E‑Mail‑Verifizierung, Meldesystem, „Meet‑in‑public“.

### 3.2 Produktmodule

* **PWA‑Nutzer‑App**: Check‑in/Slots, dezente Profile (minimal)
* **Partner‑Portal**: Slot‑Zeiten, Kapazitäten, Live‑Übersicht, Reporting
* **Impact‑Dashboard (Lizenz)**: anonymisierte Metriken für Uni/Stadt/Kassen
* **Safety Layer**: Verifizierung, Moderations‑Backoffice, Vorfall‑Workflow

### 3.3 Tech & Datenschutz

* **Architektur:** PWA + API + leichte Graph‑Logik für Kontexte (Ort, Zeit, Interesse)
* **Privacy by Design:** ephemere Signals, **kein öffentlicher Social Graph**, nur opt‑in Location, Pseudonymisierung, rollenbasierte Zugriffe
* **Compliance:** DPIA vor Roll‑out, AV‑Verträge mit Lizenznehmern, Security‑Tests

---

## 4) Zielgruppen & Stakeholder

* **Primärnutzer:innen:** Studierende (Erstis, Internationale, Pendler:innen), 18–28
* **Ortspartner:** Mensa, Bibliothek, Cafés, Coworking, Sportstätten, Studierendenwerk
* **Lizenznehmer:** Universität, Stadt (Sozialamt, Gesundheitsamt), Krankenkassen (Prävention)
* **Multiplikatoren:** AStA, Fachschaften, Hochschulsport, Kulturorte

---

## 5) Markt & Chance

### 5.1 Wuppertal (Pilot)

* **~19.869 Studierende** (WiSe 25/26, vorläufig). ([uni-wuppertal.de][3])
* **365.655 Einwohner:innen** – ausreichend „Orte‑Dichte“ für Loops. ([Wuppertal][2])
* **Adressierbare Orte (Annahme):** 180–260 (Mensa/Uni‑Spots, 50–100 Cafés/Bars, 10–20 Coworkings, Bibliothek, Sportstätten) → **SOM** Pilotjahr: **200 Orte** erreichbar.

### 5.2 Skalierung

* **NRW‑Uni‑Cluster** + Großstädte → 1.000+ Orte/Region realistisch; Lizenzen pro Uni/Stadt; Kassen‑Programme.

---

## 6) Geschäftsmodell & Preise

* **Orte‑Abo (SaaS):** 59 €/Monat (Starter), 79 € (Plus: Branding/Bevorzugung), 99 € (Pro: Event‑Serien, Custom Reports)
* **Lizenzen (Uni/Stadt):** 30–60 k €/Jahr (Impact‑Dashboard, Programme, Governance)
* **Sponsoring/ESG:** 10–50 k €/Jahr (Slot‑Patenschaften, Kampagnen)
* **B2C Premium:** 2,99 €/Monat (Insights, „Priority Loops“) – **Nice‑to‑have**, nicht Kernumsatz.

**Unit Economics (Orte‑Abo 59 €):**
COGS (Infra+Sticker+Support) ≈ 7–10 €/Monat → **Bruttomarge ~83–88 %**. CAC (Sales‑Call + Onboardingmaterial) ≈ 120–150 €. Bei 3 % mtl. Churn: LTV ≈ (59 €×85 %)/0,03 ≈ **1.670 €**.

---

## 7) Go‑to‑Market (Wuppertal, 12 Wochen)

**Woche 1–2** – Setup

* 5 Kernorte (Mensa, Bibliothek, 2 Cafés, AStA‑Hotspot), 15 Campus‑Ambassadors
* PWA‑Skeleton, Uni‑Verifizierung, Safety‑Flows

**Woche 3–4** – Netzaufbau

* 25 Orte, **100 Loop‑Slots/Tag** (Lunch/Study/Walk), On‑Site‑Branding (Sticker, Tischaufsteller)

**Woche 5–8** – Aktivierung

* Kampagne **„1000 Loops“**; tägliche Slot‑Serien (Di: Walk&Talk, Do: Study Pods)
* Partner‑Incentives („Erster Kaffee aufs Haus“), Referral (Bring‑a‑Friend → 1 Monat Premium)

**Woche 9–12** – Konsolidierung

* KPI‑Review, Safety‑Audit, Lizenzvertrag Uni/Stadt, Kassen‑Pitch (Prävention)

---

## 8) Operations & Organisation

* **Team Pilot (Jahr 1):**

  * Community/Partnerships Lead (FTE) – Orte, Ambassadors, Reporting
  * Tech Lead (Teilzeit/Retainer) – PWA, Integrationen, Security
  * Gründer: Produkt, Sales, Fundraising

* **Playbooks:** Onboarding‑Checkliste für Orte, Slot‑Kalender, Moderationsleitlinien, Incident‑Response

* **Qualität & Sicherheit:** Public‑Spaces‑Only, „Meet‑in‑public“‑Hinweise, Melde‑/Sperrprozesse

---

## 9) Wirkung & Evaluation

**Impact‑Hypothese:** Niedrigschwellige, wiederkehrende **Mikro‑Interaktionen** senken Einsamkeit und steigern Zugehörigkeit.

**Messplan (Pre/Post, 8–12 Wochen):**

* **UCLA‑LS‑3** oder **De‑Jong‑Gierveld‑Kurzskala** (Einsamkeit)
* **North‑Star:** „Monthly Micro‑Connections“ (= durchgeführte Loops)
* **Health:** MAU, D7/D30‑Retention, No‑Show‑Rate < 15 %, Safety‑Incidents ≈ 0
* **Partner‑NPS** und **Footfall‑Proxy** (zeitliche Verweildauer, Slot‑Auslastung)

---

## 10) Risiko & Mitigation

| Risiko           | Auswirkung         | Gegenmaßnahme                                                               |
| ---------------- | ------------------ | --------------------------------------------------------------------------- |
| Adoption flach   | Wenig Loops        | Slots an Routinen koppeln (Mensa‑Rush), tägliche Prompts, Ambassador‑Quoten |
| Safety‑Incidents | Reputationsschaden | Uni‑Verifizierung, Public‑Defaults, schnelles Meldesystem, Host‑Briefings   |
| Partner‑Fatigue  | Churn ↑            | Rotierende Themenwochen, transparente Impact‑Reports, Co‑Branding           |
| Datenschutz      | Rechtsrisiko       | DPIA, AVV, Minimaldaten, Pen‑Test, Consent‑Flows                            |
| Saisonalität     | Aktivität ↓        | Prüfungsphasen‑Spezialformate (Co‑Study), Ferien „City‑Loops“               |

---

## 11) Finanzplan (Jahr 1 Wuppertal)

**Kosten (OPEX, konservativ):**

* Personal/Retainer/Founder‑Stipendien 135–150 k €
* Marketing 24–30 k €
* Infra/Legal/Tools/Signage 12–15 k €
  **→ Planwert:** **195 k €**

**Erlösbausteine (Plan):**

* Orte‑Abo: 59 €/Monat
* Lizenzen Uni/Stadt: **45 k €**
* Sponsoring/ESG: **20 k €**
* Premium: **4,5 k €** (kleiner Hebel)

**Break‑even‑Formel:**
Benötigte Orte (N) = ((\text{OPEX} – \text{Lizenzen} – \text{Sponsoring} – \text{Premium}) / (Preis × 12))
= ((195.000 – 45.000 – 20.000 – 4.500) / (59×12))
= (125.500 / 708 ≈ 177,4) → **178 Orte**.

**Szenarien (Y1):**

| Szenario           | Orte x Preis | Orte‑Erlös p.a. | +Lizenzen+Sponsoring+Premium |   Gesamterlös |       OPEX |      Ergebnis |
| ------------------ | -----------: | --------------: | ---------------------------: | ------------: | ---------: | ------------: |
| Konservativ        |   150 × 59 € |       106.200 € |                     69.500 € | **175.700 €** |  195.000 € | **–19.300 €** |
| Basis (Break‑even) |   200 × 59 € |       141.600 € |                     69.500 € | **211.100 €** |  195.000 € | **+16.100 €** |
| Ambitioniert       |   250 × 79 € |       237.000 € |                     92.000 € | **329.000 €** | 294.000 €* | **+35.000 €** |

*Ambitioniert: Team‑Ausbau (3 FTE) + stärkere Kampagnen.

---

## 12) Roadmap (12 Monate)

* **Q1:** 25–50 Orte live, 1.000–1.500 MAU, D30 ≥ 25 %, „1000 Loops“
* **Q2:** 100–150 Orte, Lizenzverträge fixieren, Kassen‑Pilot (Prävention)
* **Q3:** 200 Orte (Break‑even), Programmserien (Study/Language/Walk)
* **Q4:** Roll‑out 2. Uni‑Stadt (NRW), API für Partner‑Apps (AI‑Matching‑Layer)

---

## 13) Governance, Recht & Datenschutz

* **Rechtsgrundlagen:** DSGVO, Minimierung personenbezogener Daten, klare Zweckbindung (Begegnungs‑Orchestrierung)
* **Sicherheitsprinzipien:** public‑only Defaults, Badges/Verifizierung, Moderation, dokumentierte SOPs
* **Strategische Einbettung:** Anschlussfähig an die **„Strategie gegen Einsamkeit“** und das **Kompetenznetz Einsamkeit** (im TK‑Report referenziert). 

---

## 14) Wirkungserzählung (für Förderer & Stadt)

* **Inputs:** Orte‑Netz, Ambassadors, Kampagnen
* **Outputs:** Anzahl Loops, erreichte Personen, Slot‑Auslastung
* **Outcomes (3–6 Monate):** Reduktion Einsamkeit (UCLA‑LS‑3), Zugehörigkeit ↑, Stress/Schlaf besser
* **Impact (12+ Monate):** Verstetigte Freundschaftsnetzwerke, Campus‑Kohäsion, niedrigere Beratungsnachfrage (Proxy)

---

## 15) Funding & Meilensteine

* **Kapitalbedarf (12 Monate):** **200–250 k €** (inkl. Reserve) → Ziel: Break‑even in Wuppertal + Start 2. Stadt
* **Mittelverwendung:** Team (60 %), Produkt/Infra (15 %), GTM (20 %), Recht/Reserve (5 %)
* **Meilensteine:** 200 Orte → Break‑even; 1 Uni‑Lizenz + 1 Stadt‑Lizenz; Kassen‑Pilot (≥ 10 k €)

---

## 16) Warum **Loop** besser funktioniert als eine klassische App

| Kriterium         | Klassische Social‑App        | **Loop**                        |
| ----------------- | ---------------------------- | ------------------------------- |
| Nutzeraktivierung | aktiv suchen/planen          | **passiv – Begegnung passiert** |
| Reibung           | Registrierung, Chat, Planung | **Check‑in & Treffpunkt**       |
| Sicherheit        | 1:1, private Orte            | **Micro‑Groups, public‑only**   |
| Monetarisierung   | B2C‑Premium                  | **B2B/B2G‑SaaS + ESG**          |
| Skalierung        | kanalintensiv                | **Orte‑Netz replizierbar**      |

---

## 17) KPI‑Ziele Pilot (90 Tage)

* **North‑Star:** ≥ 10.000 Loops
* **MAU:** 1.000–1.500 (Studierende)
* **Retention:** D30 ≥ 25 %
* **No‑Show:** < 15 %
* **Partner‑NPS:** > 40
* **Safety‑Incidents:** ≈ 0

---

### Verwendete Belege (Auszug)

* **TK Einsamkeitsreport 2024** – 6/10 Erwachsene kennen Einsamkeit; **68 %** der 18–39‑Jährigen berichten Einsamkeitserfahrungen. 
* **Bertelsmann Stiftung 2024** – **51 %** der 18–35‑Jährigen in DE mindestens moderat einsam; **12 %** stark einsam. 
* **Frontiers (C19‑GSWS) 2023** – 7.203 Studierende; **20,6 %** major loneliness; starker Zusammenhang mit Depressions‑/Angstsymptomen. ([Frontiers][1])
* **Stadt Wuppertal** – **365.655 Einwohner:innen** (31.12.2024). ([Wuppertal][2])
* **Uni Wuppertal** – **~19.869 Studierende** (WiSe 2025/26, vorläufig). ([uni-wuppertal.de][3])

---

## Nächste Schritte (sofort umsetzbar)

1. **1‑seitiges Pitch‑Memo** für Uni/Stadt/Kasse (Problem, Lösung, KPIs, Preis).
2. **Partner‑Pricing‑Matrix** (49/59/79 €) + **Break‑even‑Tabelle** für verschiedene Lizenz‑/Sponsoring‑Niveaus.
3. **30‑Tage‑MVP‑Plan** mit konkreten Orten (Mensa, Bibliothek, 2–3 Cafés) und „1000 Loops“‑Challenge.
4. **Evaluation‑Setup** (UCLA‑LS‑3 Pre/Post, Consent‑Flows, Datenschutztexte).

Wenn du möchtest, bereite ich dir daraus direkt ein **10‑seitiges Pitch‑Deck** (Storyline, Screens/Wireframes, KPI‑Baum, Finanz‑Tabellen) **oder** ein **1‑Seiten‑Memo** für Gespräche mit AStA/Uni/Stadt/Kassen.

[1]: https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2023.1284460/full "Frontiers | Associations of loneliness with mental health and with social and physical activity among university students in Germany: results of the COVID-19 German student well-being study (C19 GSWS)"
[2]: https://www.wuppertal.de/wirtschaft-stadtentwicklung/daten_fakten/index.php "Daten und Fakten | Wuppertal"
[3]: https://www.uni-wuppertal.de/de/universitaet/informationen/zahlen-daten-fakten/ "Zahlen, Daten, Fakten"