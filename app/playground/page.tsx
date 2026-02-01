'use client';

import { useState } from 'react';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  cached?: boolean;
  cacheExpiresAt?: string;
  timestamp?: string;
}

export default function PlaygroundPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGet = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/abfuhrkalender');
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch data'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/abfuhrkalender', {
        method: 'POST',
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh data'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          API Playground
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Teste die Abfuhrkalender API-Endpunkte
        </p>
      </div>

      {/* API Endpoints */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Endpunkte
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {/* GET Endpoint */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="inline-block rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  GET
                </span>
                <code className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  /api/abfuhrkalender
                </code>
              </div>
            </div>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              Ruft die Abfuhrkalender-Daten ab. Verwendet Cache, falls verfügbar.
            </p>
            <button
              onClick={handleGet}
              disabled={loading}
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? 'Lädt...' : 'GET Request senden'}
            </button>
          </div>

          {/* POST Endpoint */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  POST
                </span>
                <code className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                  /api/abfuhrkalender
                </code>
              </div>
            </div>
            <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
              Aktualisiert den Cache und ruft frische Daten von der BAV API ab.
            </p>
            <button
              onClick={handlePost}
              disabled={loading}
              className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? 'Lädt...' : 'POST Request senden'}
            </button>
          </div>
        </div>
      </div>

      {/* Response */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Antwort
        </h2>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-900 dark:text-red-400">
              Fehler
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        {response ? (
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Response Details
                </h3>
                <div className="flex gap-2">
                  {response.cached && (
                    <span className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Aus Cache
                    </span>
                  )}
                  {response.success ? (
                    <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Erfolg
                    </span>
                  ) : (
                    <span className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      Fehler
                    </span>
                  )}
                </div>
              </div>
              {response.cacheExpiresAt && (
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Cache läuft ab:{' '}
                  {(() => {
                    try {
                      const date = new Date(response.cacheExpiresAt);
                      if (isNaN(date.getTime())) {
                        return response.cacheExpiresAt;
                      }
                      return date.toLocaleString('de-DE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });
                    } catch {
                      return response.cacheExpiresAt;
                    }
                  })()}
                </p>
              )}
              {response.timestamp && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Zeitstempel:{' '}
                  {(() => {
                    try {
                      const date = new Date(response.timestamp);
                      if (isNaN(date.getTime())) {
                        return response.timestamp;
                      }
                      return date.toLocaleString('de-DE', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      });
                    } catch {
                      return response.timestamp;
                    }
                  })()}
                </p>
              )}
            </div>
            <div className="p-4">
              <pre className="max-h-96 overflow-auto rounded bg-zinc-50 p-4 text-xs dark:bg-zinc-900">
                <code>{JSON.stringify(response, null, 2)}</code>
              </pre>
            </div>
          </div>
        ) : !error && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <p className="text-sm">Noch keine Antwort. Sende einen Request, um die Antwort zu sehen.</p>
          </div>
        )}
      </div>
    </div>
  );
}
