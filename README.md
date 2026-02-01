# BAV Abfuhrkalender API

Eine Next.js App, die Abfuhrkalender-Daten von der BAV API abruft und als REST API sowie Frontend bereitstellt. Ort und Straße werden vom Nutzer eingegeben – die App zeigt ein Formular zur Eingabe; nach Angabe beider Werte erscheint der Abfuhrkalender.

## Features

- REST API Endpoint für Abfuhrkalender-Daten (Ort und Straße per Query-Parameter)
- Frontend mit Formular zur Eingabe von Ort und Straße
- Modernes Frontend mit React Server Components
- In-Memory Caching pro Ort/Straße
- Next.js Built-in Caching
- TypeScript für vollständige Type-Safety
- Responsive Design mit Tailwind CSS

## Technologie-Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS
- **Caching:** node-cache + Next.js Caching

## Installation

1. Dependencies installieren:
```bash
pnpm install
```

2. Environment-Variablen konfigurieren (optional):
```bash
cp .env.example .env.local
```

Die App funktioniert auch ohne `.env.local`, da Standardwerte für BAV API und Cache verwendet werden.

## Entwicklung

Development Server starten:
```bash
pnpm dev
```

Die App ist dann unter `http://localhost:3000` verfügbar. Auf der Startseite können Ort und Straße eingegeben werden; nach dem Absenden wird der Abfuhrkalender für diese Kombination angezeigt.

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

### GET `/api/abfuhrkalender?location=<Ort>&street=<Straße>`

Gibt die Abfuhrkalender-Daten für den angegebenen Ort und die Straße zurück. Beide Query-Parameter sind erforderlich.

**Query-Parameter:**
- `location` (erforderlich): Ortsname, z. B. „Beispielstadt“
- `street` (erforderlich): Straßenname, z. B. „Beispielstraße“

**Beispiel:**
```
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
│   │   └── abfuhrkalender/
│   │       ├── route.ts          # API Route Handler
│   │       └── route.test.ts      # Route Tests
│   ├── layout.tsx                # Root Layout
│   ├── page.tsx                  # Frontend Homepage
│   └── globals.css               # Global Styles
├── components/
│   ├── AddressSearchForm.tsx     # Formular Ort/Straße
│   ├── WasteCollectionCalendar.tsx
│   ├── AppointmentList.tsx
│   ├── FractionBadge.tsx
│   ├── FractionFilter.tsx
│   └── Navigation.tsx
├── lib/
│   ├── config/
│   │   └── constants.ts          # Konfiguration
│   ├── types/
│   │   └── bav-api.types.ts       # TypeScript Types
│   ├── services/
│   │   ├── bav-api.service.ts    # BAV API Service
│   │   └── cache.service.ts      # Cache Service
│   └── utils/
│       └── error-handler.ts      # Error Handling
└── package.json
```

## Konfiguration

Die App kann über Environment-Variablen konfiguriert werden:

- `BAV_API_BASE_URL`: Base URL der BAV API (Standard: `https://bav-abfallapp.regioit.de/abfall-app-bav/rest`)
- `CACHE_TTL`: Cache TTL in Sekunden (Standard: 3600 = 1 Stunde)

Ort und Straße werden nicht über die Umgebung konfiguriert, sondern vom Nutzer im Frontend oder per API-Query-Parameter angegeben.

## License

MIT
