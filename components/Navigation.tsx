'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAddressStore } from '@/lib/stores/address.store';
import { createStreetSlug } from '@/lib/utils/seo';
import { useEffect, useState } from 'react';
import { Calendar, Code2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils';

// Module-level flag to track if initial animation has played
// Persists across component remounts (route changes)
let hasAnimatedOnce = false;

export default function Navigation() {
  const pathname = usePathname();
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if we should animate (only on first ever mount)
  const shouldAnimate = !hasAnimatedOnce;

  useEffect(() => {
    setMounted(true);
    // Mark animation as complete after first mount
    hasAnimatedOnce = true;
  }, []);

  // Track scroll position for glass effect intensity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if we're on a street page (has location and street in path)
  const isOnStreetPage = pathname.split('/').filter(Boolean).length >= 2 && pathname !== '/playground';

  const isActive = (path: string) => pathname === path;

  const last = mounted ? getLastAddress() : { location: '', street: '' };
  
  // Determine calendar href based on current state
  const calendarHref = (() => {
    // If we have a last address saved, use SEO-friendly URL
    if (last.location && last.street) {
      const locationSlug = last.location.toLowerCase();
      const streetSlug = createStreetSlug(last.street);
      return `/${locationSlug}/${streetSlug}`;
    }
    // Default to homepage
    return '/';
  })();

  // Kalender is active on home page or any calendar route (location/street pages)
  const isCalendarActive = pathname === '/' || isOnStreetPage;

  const navItems = [
    { href: calendarHref, label: 'Kalender', icon: Calendar, active: isCalendarActive },
    { href: '/playground', label: 'API Playground', icon: Code2, active: isActive('/playground') },
  ];

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'glass-nav' : 'bg-transparent',
          shouldAnimate ? 'animate-slide-down' : ''
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2"
            >
              <Logo size={36} animate />
              <span className="text-lg tracking-tight text-zinc-900 dark:text-zinc-50">
                <span className="font-bold">Dein</span>
                <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400 font-normal ml-1">
                  Abfuhrkalender
                </span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.active ? 'secondary' : 'ghost'}
                    className={cn(
                      'gap-2 transition-all duration-200',
                      item.active && 'bg-white/80 dark:bg-zinc-800/80 shadow-sm'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>

            {/* Right side actions - Desktop only */}
            {isOnStreetPage && (
              <Link
                href="/"
                className="hidden md:block"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Andere Adresse
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-16" />
    </>
  );
}
