'use client';

import Link from 'next/link';
import { Cookie, Shield } from 'lucide-react';
import { useConsentStore } from '@/lib/stores/consent.store';

/**
 * Minimal footer for mobile devices
 * Contains cookie settings and privacy links
 * Only visible on mobile (hidden on md and up)
 */
export default function Footer() {
  const { openBanner } = useConsentStore();

  return (
    <footer className="md:hidden pb-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={openBanner}
            className="group flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all"
          >
            <Cookie className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            Cookies
          </button>
          
          <Link
            href="/datenschutz"
            className="group flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all"
          >
            <Shield className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
}
