'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAddressStore } from '@/lib/stores/address.store';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Code2, MapPin, Recycle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Module-level flag to track if initial animation has played
// Persists across component remounts (route changes)
let hasAnimatedOnce = false;

export default function Navigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const getLastAddress = useAddressStore((s) => s.getLastAddress);
  const wantsNewAddress = useAddressStore((s) => s.wantsNewAddress);
  const setWantsNewAddress = useAddressStore((s) => s.setWantsNewAddress);
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

  const hasLocationAndStreet =
    pathname === '/' &&
    searchParams.get('location')?.trim() &&
    searchParams.get('street')?.trim();

  const isActive = (path: string) => pathname === path;

  const last = mounted ? getLastAddress() : { location: '', street: '' };
  
  // Determine calendar href based on current state
  const calendarHref = (() => {
    // If user explicitly wants to select a new address, go to form
    if (mounted && wantsNewAddress) {
      return '/?form=1';
    }
    // If currently on homepage with address params, keep them
    if (pathname === '/' && searchParams.get('location') && searchParams.get('street')) {
      return `/?${searchParams.toString()}`;
    }
    // If we have a last address saved, use it
    if (last.location && last.street) {
      return `/?location=${encodeURIComponent(last.location)}&street=${encodeURIComponent(last.street)}`;
    }
    // Default to homepage
    return '/';
  })();

  const navItems = [
    { href: calendarHref, label: 'Kalender', icon: Calendar, active: isActive('/') },
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
              href={calendarHref}
              className="group flex items-center gap-2"
            >
              <div className="relative h-9 w-9 rounded-xl shadow-lg shadow-green-500/25">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600"
                >
                  <Recycle className="h-5 w-5 text-white" />
                </motion.div>
              </div>
              <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Abfuhr
                <span className="hidden sm:inline text-zinc-500 dark:text-zinc-400 font-normal ml-1">
                  Kalender
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
            {hasLocationAndStreet && (
              <Link
                href="/?form=1"
                className="hidden md:block"
                onClick={() => setWantsNewAddress(true)}
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
