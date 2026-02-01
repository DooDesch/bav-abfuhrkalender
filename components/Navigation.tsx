'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAddressStore } from '@/lib/stores/address.store';
import { useEffect, useState } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  // Avoid hydration mismatch: only use store (localStorage) after mount so server and initial client render match
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasLocationAndStreet =
    pathname === '/' &&
    searchParams.get('location')?.trim() &&
    searchParams.get('street')?.trim();

  const isActive = (path: string) => pathname === path;

  const linkClass = (active: boolean) =>
    `cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
    }`;

  // During SSR and initial client render use only URL (searchParams) so server and client match
  const last = mounted ? getLastAddress() : { location: '', street: '' };
  const calendarHref =
    pathname === '/' && searchParams.toString()
      ? `/?${searchParams.toString()}`
      : last.location && last.street
        ? `/?location=${encodeURIComponent(last.location)}&street=${encodeURIComponent(last.street)}`
        : '/';

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href={calendarHref}
              className="cursor-pointer text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              BAV Abfuhrkalender
            </Link>
            <div className="flex gap-1">
              <Link
                href={calendarHref}
                className={linkClass(isActive('/'))}
              >
                Kalender
              </Link>
              <Link
                href="/playground"
                className={linkClass(isActive('/playground'))}
              >
                API Playground
              </Link>
            </div>
          </div>
          {hasLocationAndStreet && (
            <Link
              href="/?form=1"
              className="cursor-pointer rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-zinc-500"
            >
              Andere Adresse
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
