'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, RefreshCw, Clock, CheckCircle, XCircle, Code2, Zap } from 'lucide-react';
import { useAddressStore } from '@/lib/stores/address.store';
import LocationAutocomplete from '@/components/LocationAutocomplete';
import StreetAutocomplete from '@/components/StreetAutocomplete';
import { formatRelativeTime, formatExactDateTime } from '@/lib/utils/formatRelativeTime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/animations';
import { cn } from '@/lib/utils';

interface ApiResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  cached?: boolean;
  cacheExpiresAt?: string;
  timestamp?: string;
}

export default function PlaygroundPage() {
  const location = useAddressStore((s) => s.location);
  const street = useAddressStore((s) => s.street);
  const setLocation = useAddressStore((s) => s.setLocation);
  const setStreet = useAddressStore((s) => s.setStreet);
  const setLastAddress = useAddressStore((s) => s.setLastAddress);
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  const setAddress = useAddressStore((s) => s.setAddress);

  useEffect(() => {
    if (location !== '' || street !== '') return;
    const last = getLastAddress();
    if (last.location || last.street) {
      setAddress(last.location, last.street);
    }
  }, [getLastAddress, setAddress, location, street]);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeMethod, setActiveMethod] = useState<'GET' | 'POST' | null>(null);

  const canSend = location.trim() !== '' && street.trim() !== '';

  const handleRequest = async (method: 'GET' | 'POST') => {
    const trimmedLocation = location.trim();
    const trimmedStreet = street.trim();
    setLastAddress(trimmedLocation, trimmedStreet);
    setLoading(true);
    setError(null);
    setResponse(null);
    setActiveMethod(method);

    try {
      const url = `/api/abfuhrkalender?location=${encodeURIComponent(trimmedLocation)}&street=${encodeURIComponent(trimmedStreet)}`;
      const res = await fetch(url, { method });
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

  return (
    <main className="min-h-[calc(100vh-4rem)] pb-20 md:pb-8">
      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
        {/* Header */}
        <FadeIn>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <Code2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                  API Playground
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Teste die Abfuhrkalender API interaktiv
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Parameters Card */}
        <FadeIn delay={0.1}>
          <Card glass>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Parameter
              </CardTitle>
              <CardDescription>
                Query-Parameter <code className="rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-mono">location</code> und{' '}
                <code className="rounded bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-mono">street</code> sind erforderlich.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  id="playground-location"
                  label="Ort (location)"
                  placeholder="z. B. Wermelskirchen"
                />
                <StreetAutocomplete
                  location={location}
                  value={street}
                  onChange={setStreet}
                  id="playground-street"
                  label="Straße (street)"
                  placeholder="z. B. Hauptstraße"
                />
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Endpoints */}
        <FadeIn delay={0.2}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Endpunkte
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {/* GET Endpoint */}
              <Card glass className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="static" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                        GET
                      </Badge>
                      <code className="text-sm text-zinc-600 dark:text-zinc-400">
                        /api/abfuhrkalender
                      </code>
                    </div>
                  </div>
                  <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Ruft Daten ab. Verwendet Cache, falls verfügbar.
                  </p>
                  <Button
                    onClick={() => handleRequest('GET')}
                    disabled={loading || !canSend}
                    className={cn(
                      'w-full gap-2',
                      activeMethod === 'GET' && loading && 'animate-pulse'
                    )}
                  >
                    {loading && activeMethod === 'GET' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {loading && activeMethod === 'GET' ? 'Lädt...' : 'GET Request'}
                  </Button>
                </CardContent>
              </Card>

              {/* POST Endpoint */}
              <Card glass className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="static" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                        POST
                      </Badge>
                      <code className="text-sm text-zinc-600 dark:text-zinc-400">
                        /api/abfuhrkalender
                      </code>
                    </div>
                  </div>
                  <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                    Aktualisiert Cache und ruft frische Daten ab.
                  </p>
                  <Button
                    onClick={() => handleRequest('POST')}
                    disabled={loading || !canSend}
                    variant="secondary"
                    className={cn(
                      'w-full gap-2',
                      activeMethod === 'POST' && loading && 'animate-pulse'
                    )}
                  >
                    {loading && activeMethod === 'POST' ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    {loading && activeMethod === 'POST' ? 'Lädt...' : 'POST Request'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </FadeIn>

        {/* Response */}
        <FadeIn delay={0.3}>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Antwort
            </h2>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-4 border-red-200/50 dark:border-red-800/50"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-400">Fehler</p>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {response ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card glass className="overflow-hidden">
                  <CardHeader className="border-b border-zinc-200/50 dark:border-zinc-700/50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Response Details</CardTitle>
                      <div className="flex gap-2">
                        {response.cached && (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                            <Clock className="h-3 w-3 mr-1" />
                            Cache
                          </Badge>
                        )}
                        {response.success ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Erfolg
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                            <XCircle className="h-3 w-3 mr-1" />
                            Fehler
                          </Badge>
                        )}
                      </div>
                    </div>
                    {response.cacheExpiresAt && (
                      <p
                        className="text-xs text-zinc-500 dark:text-zinc-400"
                        title={formatExactDateTime(response.cacheExpiresAt)}
                      >
                        Cache läuft ab: {formatRelativeTime(response.cacheExpiresAt)}
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
                  </CardHeader>
                  <CardContent className="p-0">
                    <pre className="max-h-96 overflow-auto p-4 text-xs font-mono bg-zinc-50 dark:bg-zinc-900/50">
                      <code className="text-zinc-800 dark:text-zinc-200">
                        {JSON.stringify(response, null, 2)}
                      </code>
                    </pre>
                  </CardContent>
                </Card>
              </motion.div>
            ) : !error && (
              <Card glass className="p-8 text-center">
                <Code2 className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
                <p className="text-zinc-600 dark:text-zinc-400">
                  Noch keine Antwort. Sende einen Request.
                </p>
              </Card>
            )}
          </div>
        </FadeIn>
      </div>
    </main>
  );
}
