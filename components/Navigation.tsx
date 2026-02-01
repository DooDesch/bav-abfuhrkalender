'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              BAV Abfuhrkalender
            </Link>
            <div className="flex gap-1">
              <Link
                href="/"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                }`}
              >
                Kalender
              </Link>
              <Link
                href="/playground"
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/playground')
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                }`}
              >
                API Playground
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
