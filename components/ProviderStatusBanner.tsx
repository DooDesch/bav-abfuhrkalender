'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ProviderStatusResponse } from '@/app/api/status/providers/route';

export default function ProviderStatusBanner() {
  const [downNames, setDownNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/status/providers')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProviderStatusResponse | null) => {
        if (cancelled || !data) return;
        const names = Object.values(data.providers)
          .filter((p) => p.status !== 'ok')
          .map((p) => p.name);
        setDownNames(names);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  if (downNames.length === 0) return null;

  return (
    <div className="border-b border-amber-200/60 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/40">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p>
          <span className="font-medium">{downNames.join(', ')}</span>
          {' '}
          {downNames.length === 1 ? 'ist' : 'sind'} derzeit nicht erreichbar
          {' '}&ndash; Termine können verzögert oder nicht verfügbar sein.
        </p>
      </div>
    </div>
  );
}
