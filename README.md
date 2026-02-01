# BAV Abfuhrkalender API

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-orange?logo=pnpm)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Eine Next.js App, die Abfuhrkalender-Daten von der BAV API abruft und als REST API sowie Frontend bereitstellt. Zielgruppe sind Nutzer im BAV-Gebiet sowie Entwickler, die die API anbinden wollen. Ort und Straße werden im Frontend per Autocomplete eingegeben; nach Auswahl erscheint der Abfuhrkalender.

## Inhaltsverzeichnis

- [Features](#features)
- [Technologie-Stack](#technologie-stack)
- [Installation](#installation)
- [Entwicklung](#entwicklung)
- [Build](#build)
- [API Endpoints](#api-endpoints)
- [Projektstruktur](#projektstruktur)
- [Konfiguration](#konfiguration)
- [License](#license)

## Features

- REST API Endpoints für Abfuhrkalender, Orte und Straßen (Autocomplete)
- Frontend mit Autocomplete für Ort und Straße
- Modernes Frontend mit React Server Components
- In-Memory Caching pro Ort/Straße
- Next.js Built-in Caching
- TypeScript für vollständige Type-Safety
- Responsive Design mit Tailwind CSS
- Tests mit Vitest

## Technologie-Stack

- **Framework:** Next.js 16+ (App Router)
- **Sprache:** TypeScript
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS
- **Caching:** node-cache + Next.js Caching
- **Client-State:** Zustand (Adresse, letzte Suche)
- **Tests:** Vitest
- **Frontend:** Autocomplete für Ort und Straße

## Installation

Dependencies installieren:

```bash
pnpm install
```

## Entwicklung

Development Server starten:

```bash
pnpm dev
```

Die App ist dann unter `http://localhost:3000` verfügbar. Auf der Startseite können Ort und Straße per Autocomplete eingegeben werden; nach dem Absenden wird der Abfuhrkalender für diese Kombination angezeigt. Unter `/playground` steht eine Entwicklerseite zum Testen bereit.

Tests ausführen:

```bash
pnpm test
```

Tests im Watch-Modus:

```bash
pnpm test:watch
```

Linting ausführen:

```bash
pnpm lint
```

## Build

Production Build erstellen:

```bash
pnpm build
```

Production Server starten:

```bash
pnpm start
```

## API Endpoints

Bei Fehlern (z. B. fehlende Query-Parameter, 404, 500) liefern alle Endpoints einheitlich: `{ "success": false, "error": string, "timestamp": string }` (ISO). Der HTTP-Status entspricht dem Fehlertyp (400, 404, 500).

### GET `/api/locations`

Gibt die Liste der verfügbaren Orte (Orte) für das Autocomplete zurück. Keine Query-Parameter.

**Beispiel:**

```bash
GET /api/locations
```

**Response:** `{ "success": true, "data": [ { "id": number, "name": string }, ... ] }`

### GET `/api/streets?location=<Ort>`

Gibt die Liste der Straßen für den angegebenen Ort zurück (für Autocomplete). Query-Parameter `location` ist erforderlich.

**Query-Parameter:**

- `location` (erforderlich): Ortsname

**Beispiel:**

```bash
GET /api/streets?location=Beispielstadt
```

**Response:** `{ "success": true, "data": [ { "id": number, "name": string }, ... ] }`

Fehlt `location`, antwortet die API mit Status 400.

### GET `/api/abfuhrkalender?location=<Ort>&street=<Straße>`

Gibt die Abfuhrkalender-Daten für den angegebenen Ort und die Straße zurück. Beide Query-Parameter sind erforderlich.

**Query-Parameter:**

- `location` (erforderlich): Ortsname, z. B. „Beispielstadt“
- `street` (erforderlich): Straßenname, z. B. „Beispielstraße“

**Beispiel:**

```bash
GET /api/abfuhrkalender?location=Beispielstadt&street=Beispielstraße
```

**Response:**

```json
{
  "success": true,
  "data": {
    "location": {
      "id": 1234567,
      "name": "Beispielstadt"
    },
    "street": {
      "id": 1,
      "name": "Beispielstraße"
    },
    "houseNumbers": [],
    "fractions": [],
    "appointments": []
  },
  "cached": false,
  "cacheExpiresAt": "2026-02-02T16:00:00Z",
  "timestamp": "2026-02-01T16:00:00Z"
}
```

Fehlen `location` oder `street`, antwortet die API mit Status 400 und einer Fehlermeldung.

### POST `/api/abfuhrkalender?location=<Ort>&street=<Straße>`

Aktualisiert den Cache für die angegebene Ort/Straße-Kombination und gibt frische Daten zurück. Gleiche Query-Parameter wie bei GET.

## Projektstruktur

```
├── app/
│   ├── api/
│   │   ├── abfuhrkalender/
│   │   │   ├── route.ts          # API Route Handler
│   │   │   └── route.test.ts     # Route Tests
│   │   ├── locations/
│   │   │   └── route.ts          # Orte für Autocomplete
│   │   └── streets/
│   │       └── route.ts          # Straßen pro Ort
│   ├── layout.tsx                # Root Layout
│   ├── page.tsx                  # Frontend Homepage
│   ├── playground/
│   │   └── page.tsx              # Playground für Entwickler
│   └── globals.css               # Global Styles
├── components/
│   ├── AddressSearchForm.tsx     # Formular Ort/Straße
│   ├── Autocomplete.tsx          # Generische Autocomplete-Komponente
│   ├── LocationAutocomplete.tsx  # Ort-Autocomplete
│   ├── StreetAutocomplete.tsx    # Straßen-Autocomplete
│   ├── WasteCollectionCalendar.tsx
│   ├── AppointmentList.tsx
│   ├── FractionBadge.tsx
│   ├── FractionFilter.tsx
│   ├── HomeWithoutParams.tsx     # Startansicht ohne Adresse
│   └── Navigation.tsx
├── lib/
│   ├── config/
│   │   └── constants.ts          # Konfiguration
│   ├── types/
│   │   └── bav-api.types.ts      # TypeScript Types
│   ├── services/
│   │   ├── bav-api.service.ts    # BAV API Service
│   │   ├── cache.service.ts      # Cache Service
│   │   └── cache.service.test.ts # Cache Tests
│   ├── stores/
│   │   └── address.store.ts      # Zustand-Store (Adresse)
│   └── utils/
│       ├── error-handler.ts      # Error Handling
│       └── formatRelativeTime.ts
└── package.json
```

## Konfiguration

Die App kann über Environment-Variablen konfiguriert werden:

- `BAV_API_BASE_URL`: Base URL der BAV API (Standard: `https://bav-abfallapp.regioit.de/abfall-app-bav/rest`)
- `CACHE_TTL`: Cache TTL in Sekunden (Standard: 3600 = 1 Stunde)

Ort und Straße werden nicht über die Umgebung konfiguriert, sondern vom Nutzer im Frontend oder per API-Query-Parameter angegeben.

## License

MIT
