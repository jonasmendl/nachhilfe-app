# Nachhilfe Backend

Ein minimales Node.js-Backend ohne externe Abhängigkeiten. Stellt einige Beispiel-Endpunkte bereit, damit das Frontend angebunden werden kann.

## Installation
Da keine externen Pakete benötigt werden, genügt eine aktuelle Node.js-Installation (>= 18 empfohlen).

## Entwicklung starten

```bash
cd backend
npm run start
```

Setze optional die Umgebungsvariable `PORT`, um einen anderen Port zu verwenden (Standard: `4000`).

## Verfügbare Endpunkte
- `GET /api/health` – einfacher Healthcheck mit Zeitstempel.
- `GET /api/info` – Basisinformationen zur API.
- `GET /api/users` – listet vorhandene User (Lehrer/Schüler) auf.
- `POST /api/users` – legt einen User an. Erwartet `name` und `role` (`student` oder `teacher`). Optional: `subjects`, `location`, `availability`.
- `GET /api/requests` – listet Anfragen. Filter möglich über `status`, `studentId`, `teacherId` (Query-Parameter).
- `POST /api/requests` – legt eine Anfrage an. Erwartet mindestens `studentId` und `subject`, optional `level`, `location`, `availability`, `description`.
- `PATCH /api/requests/:id` – aktualisiert Status oder Teacher-Zuordnung einer Anfrage (`status` = pending/accepted/rejected, `teacherId` für Zuordnung).
- `GET /api/lessons` – liefert eine Beispiel-Liste von Nachhilfestunden.
- `POST /api/lessons` – legt eine neue Stunde an. Erwartet `subject`, `tutor`, `durationMinutes` und `level` im JSON-Body.

Antworten enthalten CORS-Header (`Access-Control-Allow-Origin: *`), sodass lokale Frontend-Instanzen testweise zugreifen können.
