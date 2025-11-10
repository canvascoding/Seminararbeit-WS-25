# Firestore Security Rules – Loop Pilot Wuppertal

Diese Regeln entsprechen den Anforderungen aus `prd-loop-mvp.md` und sichern die Collections `users`, `slots`, `slotAttendees`, `loops`, `venues`, `incidents` sowie Partner-spezifische Ressourcen.

## Grundsätze

- **Authentifizierung**: Jede schreibende Operation benötigt `request.auth != null`.
- **Least Privilege**: Nutzer:innen dürfen ausschließlich ihre eigenen Dokumente verändern oder lesen (Ausnahmen: öffentliche Collections).
- **Rollen**: Partner:innen identifizieren sich über einen Custom Claim `role == "partner"`. Admin-spezifische Prozesse laufen über Cloud Functions.
- **Datenkonsistenz**: Server Timestamp (`request.time`) und Feldgrenzen werden geprüft, sodass Kapazitäten, Status und sensible Felder korrekt bleiben.

## Regel-Set

```firebase
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(uid) {
      return isSignedIn() && request.auth.uid == uid;
    }

    function isPartner() {
      return isSignedIn() && request.auth.token.role == "partner";
    }

    //
    // users/{uid}
    //
    match /users/{uid} {
      allow read, update: if isOwner(uid);
      allow create: if isOwner(uid) && request.auth.token.email_verified == true;
    }

    //
    // venues – public read, no client writes (nur Admin/Functions)
    //
    match /venues/{venueId} {
      allow read: if true;
      allow write: if false;
    }

    //
    // slots – public read, Partner-Slot-CRUD beschränkt auf eigene Venues
    //
    match /slots/{slotId} {
      allow read: if true;
      allow create, update: if isPartner() &&
        request.resource.data.venueId in get(/databases/$(database)/documents/venues).where(
          venue => venue.data.partnerId == request.auth.uid
        ).map(v => v.id) &&
        request.resource.data.durationMinutes >= 10 &&
        request.resource.data.durationMinutes <= 30 &&
        request.resource.data.capacity >= 2 &&
        request.resource.data.capacity <= 4;
      allow delete: if false;
    }

    //
    // slotAttendees/{slotId}/{userId}
    //
    match /slotAttendees/{slotId}/{userId} {
      allow create: if isOwner(userId) &&
        request.resource.data.keys().hasOnly(["slotId","userId","joinedAt","status"]) &&
        request.resource.data.status == "pending";
      allow update, delete: if isOwner(userId) &&
        get(/databases/$(database)/documents/slots/$(slotId)).data.startAt > request.time;
      allow read: if isOwner(userId);
    }

    //
    // loops – nur Teilnehmer:innen dürfen lesen, keine Client-Schreibrechte
    //
    match /loops/{loopId} {
      allow read: if isSignedIn() &&
        request.auth.uid in resource.data.participants;
      allow write: if false;
    }

    //
    // incidents – schreiben erlaubt, lesen nur Admin (per Cloud Function/API)
    //
    match /incidents/{incidentId} {
      allow create: if isSignedIn() &&
        request.resource.data.keys().hasOnly(["loopId","reporterId","type","description","createdAt","status"]) &&
        request.resource.data.reporterId == request.auth.uid &&
        request.resource.data.description.size() <= 500;
      allow read: if false;
      allow update, delete: if false;
    }

    //
    // reports collection alias – falls /report API dediziert schreibt
    //
    match /reports/{docId} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```

## Ergänzende Checks (Cloud Functions)

- **Partner-Verifikation**: Die Liste der Venues pro Partner sollte serverseitig auf Überschneidungen geprüft werden, da Firestore Rules keine JOINs erlauben.
- **Incident-Status**: Das Feld `status` kann ausschließlich durch `resolveIncident` (Admin Function) verändert werden.
- **TTL / Cleanup**: Scheduled Functions löschen `slotAttendees` nach 48 h und personenbezogene `feedback` nach 6 Monaten (siehe PRD).

> **Hinweis:** Firestore Rules unterstützen kein direktes Filtern über `get(...).where(...)`. Für produktive Umgebung muss die Partner-Validierung serverseitig erfolgen (Cloud Function oder `partnerVenues/{partnerId}` Cache). Obiger Block dient als Dokumentation der beabsichtigten Logik; die tatsächliche Implementierung sollte `get` auf konkrete Venue-Dokumente nutzen oder per `request.auth.token.venues` arbeiten.
