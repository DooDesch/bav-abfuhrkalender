'use client';

import { memo, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Newspaper, Package, Wine, Leaf, MapPin, Navigation } from 'lucide-react';
import { useLocationsWithProximity } from '@/lib/hooks/useLocationsWithProximity';
import type { LocationWithCoords } from '@/lib/types/bav-api.types';

const wasteIcons = [
  { Icon: Trash2, color: '#71717a', label: 'Restmüll' },
  { Icon: Package, color: '#eab308', label: 'Gelber Sack' },
  { Icon: Newspaper, color: '#3b82f6', label: 'Papier' },
  { Icon: Wine, color: '#22c55e', label: 'Glas' },
  { Icon: Leaf, color: '#84cc16', label: 'Bio' },
];

// Memoized LocationBadge to prevent re-renders
const LocationBadge = memo(function LocationBadge({ 
  location, 
  isNearby 
}: { 
  location: LocationWithCoords; 
  isNearby: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs border ${
        isNearby 
          ? 'bg-green-500/20 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 dark:border-green-500/25' 
          : 'bg-white/40 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 border-zinc-200/50 dark:border-zinc-700/50'
      }`}
    >
      {isNearby ? (
        <Navigation className="h-3 w-3" />
      ) : (
        <MapPin className="h-3 w-3" />
      )}
      {location.name}
      {isNearby && location.distance !== undefined && (
        <span className="text-[10px] opacity-70">
          {location.distance < 1 
            ? `${Math.round(location.distance * 1000)}m` 
            : `${location.distance.toFixed(1)}km`}
        </span>
      )}
    </span>
  );
});

// Location Marquee Component using CSS animation
// Locations are sorted by proximity to user (nearest first, repeated 4x)
const LocationMarquee = memo(function LocationMarquee() {
  const { locations, isLoading, isGeolocating, userCoords } = useLocationsWithProximity();
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    hasAnimatedRef.current = true;
  }, []);

  // Memoize the animation duration calculation
  const animationDuration = useMemo(
    () => Math.max(30, locations.length * 2.5),
    [locations.length]
  );

  // Check if a location is in the "nearby" section (first 20 items = 5 locations x 4 repeats)
  const isNearbyIndex = (index: number) => userCoords !== null && index < 20;

  // Don't render if no locations available
  if (isLoading || locations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={hasAnimatedRef.current ? false : { opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="mt-8 relative w-full max-w-full"
    >
      {/* Marquee container with CSS mask for clean fade edges and contain for performance */}
      <div 
        className="overflow-hidden py-2"
        style={{
          contain: 'content',
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        }}
      >
        <div 
          className="inline-flex gap-3" 
          style={{ 
            animation: `marquee ${animationDuration}s linear infinite`,
          }}
        >
          {/* First group - sorted by proximity with nearby locations highlighted */}
          {locations.map((location, index) => (
            <LocationBadge 
              key={`${index}-${location.id}`} 
              location={location} 
              isNearby={isNearbyIndex(index)}
            />
          ))}
          {/* Duplicate group for seamless loop */}
          {locations.map((location, index) => (
            <LocationBadge 
              key={`dup-${index}-${location.id}`} 
              location={location} 
              isNearby={isNearbyIndex(index)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
});

export default function Hero() {
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    hasAnimatedRef.current = true;
  }, []);

  return (
    <div className="relative w-full max-w-full py-8 sm:py-12 min-h-[300px] sm:min-h-[350px]">
      {/* Static Background Elements - subtle, blurred (no infinite animations for performance) */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {wasteIcons.map((item, index) => (
          <div
            key={item.label}
            className="absolute blur-[2px] opacity-[0.06]"
            style={{
              left: `${8 + index * 19}%`,
              top: `${18 + (index % 2) * 30}%`,
            }}
          >
            <item.Icon 
              className="h-14 w-14 sm:h-20 sm:w-20 md:h-24 md:w-24" 
              style={{ color: item.color }}
              strokeWidth={1}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative text-center">
        <motion.div
          initial={hasAnimatedRef.current ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 px-2">
            Dein{' '}
            <span className="bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
              Abfuhrkalender
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={hasAnimatedRef.current ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: hasAnimatedRef.current ? 0 : 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mt-4 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto"
        >
          Finde alle Abfuhrtermine für deine Adresse.
          <br className="hidden sm:block" />
          Einfach Ort und Straße eingeben.
        </motion.p>

        {/* Waste Type Pills - no stagger animation on revisit */}
        <motion.div
          initial={hasAnimatedRef.current ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: hasAnimatedRef.current ? 0 : 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mt-6 flex flex-wrap justify-center gap-2"
        >
          {wasteIcons.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: `${item.color}0a`,
                color: item.color,
                border: `1px solid ${item.color}20`,
              }}
            >
              <item.Icon className="h-3.5 w-3.5" />
              {item.label}
            </div>
          ))}
        </motion.div>

        {/* Location Marquee */}
        <LocationMarquee />
      </div>
    </div>
  );
}
