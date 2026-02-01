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
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  const hasLocationAndStreet =
    pathname === '/' &&
    searchParams.get('location')?.trim() &&
    searchParams.get('street')?.trim();

  const isActive = (path: string) => pathname === path;

  const linkClass = (active: boolean) =>
    `flex min-h-[44px] cursor-pointer items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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

  const otherAddressClass =
    'flex min-h-[44px] cursor-pointer items-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:border-zinc-500';

  const calendarLink = (
    <Link
      href={calendarHref}
      className={linkClass(isActive('/'))}
      onClick={() => setMenuOpen(false)}
    >
      Kalender
    </Link>
  );
  const playgroundLink = (
    <Link
      href="/playground"
      className={linkClass(isActive('/playground'))}
      onClick={() => setMenuOpen(false)}
    >
      API Playground
    </Link>
  );
  const otherAddressLink = hasLocationAndStreet ? (
    <Link
      href="/?form=1"
      className={otherAddressClass}
      onClick={() => setMenuOpen(false)}
    >
      Andere Adresse
    </Link>
  ) : null;

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 min-h-[44px] items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <Link
              href={calendarHref}
              className="cursor-pointer text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              BAV Abfuhrkalender
            </Link>
            {/* Desktop nav: visible from md up */}
            <div className="hidden gap-1 md:flex">
              {calendarLink}
              {playgroundLink}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop: Andere Adresse on the right */}
            {otherAddressLink && (
              <div className="hidden md:block">{otherAddressLink}</div>
            )}
            {/* Mobile: hamburger button */}
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
            >
              {menuOpen ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay + drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-10 cursor-pointer bg-black/20 md:hidden"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div
            id="mobile-nav"
            className="fixed right-0 top-16 z-20 flex w-full max-w-xs flex-col gap-1 border-l border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 md:hidden"
            role="dialog"
            aria-label="Navigation"
          >
            {calendarLink}
            {playgroundLink}
            {otherAddressLink}
          </div>
        </>
      )}
    </nav>
  );
}
