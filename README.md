# BAV Abfuhrkalender API

Eine Next.js App, die Abfuhrkalender-Daten für die Straße "Elbringhausen" in Wermelskirchen von der BAV API abruft und als REST API sowie Frontend bereitstellt.

## Features

- REST API Endpoint für Abfuhrkalender-Daten
- Modernes Frontend mit React Server Components
- In-Memory Caching für bessere Performance
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

Die App funktioniert auch ohne `.env.local`, da Standardwerte verwendet werden.

## Entwicklung

Development Server starten:
```bash
pnpm dev
```

Die App ist dann unter `http://localhost:3000` verfügbar.

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

### GET `/api/abfuhrkalender`

Gibt die Abfuhrkalender-Daten für die Straße "Elbringhausen" in Wermelskirchen zurück.

**Response:**
```json
{
  "success": true,
  "data": {
    "ort": {
      "id": 2813240,
      "name": "Wermelskirchen"
    },
    "strasse": {
      "id": 12345,
      "name": "Elbringhausen"
    },
    "hausnummern": [...],
    "fraktionen": [...],
    "termine": [...]
  },
  "cached": false,
  "cacheExpiresAt": "2026-02-02T16:00:00Z",
  "timestamp": "2026-02-01T16:00:00Z"
}
```

### POST `/api/abfuhrkalender`

Aktualisiert den Cache manuell und gibt frische Daten zurück.

## Projektstruktur

```
├── app/
│   ├── api/
│   │   └── abfuhrkalender/
│   │       └── route.ts          # API Route Handler
│   ├── layout.tsx                # Root Layout
│   ├── page.tsx                  # Frontend Homepage
│   └── globals.css               # Global Styles
├── components/
│   ├── Abfuhrkalender.tsx        # Hauptkomponente
│   ├── TerminListe.tsx           # Termin-Liste
│   └── FraktionBadge.tsx         # Fraktion Badge
├── lib/
│   ├── config/
│   │   └── constants.ts          # Konfiguration
│   ├── types/
│   │   └── bav-api.types.ts      # TypeScript Types
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
- `CACHE_TTL`: Cache TTL in Sekunden (Standard: `86400` = 24 Stunden)
- `NEXT_PUBLIC_APP_URL`: Public URL der App (Standard: `http://localhost:3000`)

## License

MIT
