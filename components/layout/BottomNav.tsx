'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Home, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAddressStore } from '@/lib/stores/address.store';
import { createStreetSlug } from '@/lib/utils/seo';

// Module-level flag to track if initial animation has played
// Persists across component remounts (route changes)
let hasAnimatedOnce = false;

export default function BottomNav() {
  const pathname = usePathname();
  const lastLocation = useAddressStore((s) => s.lastLocation);
  const lastStreet = useAddressStore((s) => s.lastStreet);
  const hasHydrated = useAddressStore((s) => s._hasHydrated);

  // Start with no animation to match server render, then animate on client
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    // Only animate if this is the first time the component has mounted
    if (!hasAnimatedOnce) {
      setShouldAnimate(true);
      hasAnimatedOnce = true;
    }
  }, []);

  // Only use address data after store has hydrated from localStorage
  // This prevents hydration mismatch between server (no localStorage) and client
  const hasAddress = hasHydrated && Boolean(lastLocation?.trim() && lastStreet?.trim());

  // Build calendar URL with SEO-friendly path
  const calendarHref = hasAddress
    ? `/${lastLocation.toLowerCase()}/${createStreetSlug(lastStreet)}`
    : '#';

  // Check if we're on a street page (calendar view)
  const pathSegments = pathname.split('/').filter(Boolean);
  const isOnCalendar = pathSegments.length >= 2 && pathname !== '/playground';

  // Check if we're on the home/search form
  const isOnHome = pathname === '/';

  const navItems = [
    { href: '/', label: 'Home', icon: Home, active: isOnHome },
    {
      href: calendarHref,
      label: 'Kalender',
      icon: Calendar,
      active: isOnCalendar,
      disabled: !hasAddress,
    },
    { href: '/playground', label: 'API', icon: Code2, active: pathname === '/playground' },
  ];

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-500 ease-out',
        shouldAnimate ? 'animate-slide-up' : ''
      )}
      style={{ transform: 'translateY(0)' }}
    >
      <div className="glass border-t border-white/20 dark:border-zinc-700/50 pb-safe">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isDisabled = 'disabled' in item && item.disabled;

            if (isDisabled) {
              return (
                <div
                  key={item.label}
                  className="relative flex flex-col items-center justify-center gap-1 px-4 py-2 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors',
                  item.active ? 'text-primary' : 'text-zinc-500 dark:text-zinc-400'
                )}
              >
                {/* Use CSS transition instead of layoutId for better performance */}
                <div
                  className={cn(
                    'absolute -top-0.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-primary transition-all duration-300',
                    item.active ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  )}
                />
                <item.icon className={cn('h-5 w-5', item.active && 'text-primary')} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
