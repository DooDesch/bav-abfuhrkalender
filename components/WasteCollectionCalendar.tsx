'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';
import { FRACTION_FILTER_STORAGE_KEY } from '@/lib/config/constants';
import { useAddressStore } from '@/lib/stores/address.store';
import AppointmentList from './AppointmentList';
import FractionFilter from './FractionFilter';

interface WasteCollectionCalendarProps {
  data: WasteCalendarResponse;
  location?: string;
  street?: string;
}

export default function WasteCollectionCalendar({
  data,
  location: locationProp,
  street: streetProp,
}: WasteCollectionCalendarProps) {
  const setLastAddress = useAddressStore((s) => s.setLastAddress);

  // Save current address as last used when calendar is displayed (e.g. direct link or back)
  useEffect(() => {
    const loc = locationProp?.trim();
    const str = streetProp?.trim();
    if (!loc || !str) return;
    setLastAddress(loc, str);
  }, [locationProp, streetProp, setLastAddress]);
  // Get fractions that actually appear in appointments (stable refs for effect deps)
  const availableFractionIds = useMemo(
    () => new Set(data.appointments.map((t) => t.fractionId)),
    [data.appointments]
  );
  const availableFractions = useMemo(
    () => data.fractions.filter((f) => availableFractionIds.has(f.id)),
    [data.fractions, availableFractionIds]
  );

  // Initialize with all available fractions selected (same on server and first client render to avoid hydration mismatch)
  const [selectedFractions, setSelectedFractions] = useState<Set<number>>(() =>
    new Set(availableFractions.map((f) => f.id))
  );

  // After mount, restore saved filter from localStorage so server and initial client HTML match
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(FRACTION_FILTER_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as number[];
      const savedSet = new Set(parsed);
      const filtered = new Set(
        Array.from(savedSet).filter((id) => availableFractionIds.has(id))
      );
      if (filtered.size > 0) {
        setSelectedFractions(filtered);
      }
    } catch {
      // Ignore errors
    }
  }, [mounted]);

  // Save to localStorage when selection changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          FRACTION_FILTER_STORAGE_KEY,
          JSON.stringify(Array.from(selectedFractions))
        );
      } catch (e) {
        // Ignore errors (e.g., localStorage full)
      }
    }
  }, [selectedFractions]);

  // Clean up selection when available fractions change (e.g. new address)
  useEffect(() => {
    const currentAvailableIds = new Set(availableFractions.map((f) => f.id));
    const filtered = new Set(
      Array.from(selectedFractions).filter((id) =>
        currentAvailableIds.has(id)
      )
    );
    if (filtered.size === 0) {
      setSelectedFractions(new Set(availableFractions.map((f) => f.id)));
    } else if (filtered.size !== selectedFractions.size) {
      setSelectedFractions(filtered);
    }
  }, [availableFractions]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Abfuhrkalender
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-lg text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold">{data.street.name}</span>
            <span className="mx-2">•</span>
            <span>{data.location.name}</span>
          </div>
          <Link
            href="/?form=1"
            className="cursor-pointer rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Andere Adresse suchen
          </Link>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          {data.houseNumbers.length > 0
            ? `${data.houseNumbers.length} Hausnummer${data.houseNumbers.length !== 1 ? 'n' : ''} verfügbar`
            : 'Keine Hausnummern verfügbar'}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Termine für die gewählte Adresse. Sie können die Adresse oben ändern.
        </p>
      </div>

      {/* Appointments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Abfuhrtermine
          </h2>
          <FractionFilter
            fractions={availableFractions}
            selectedFractions={selectedFractions}
            onFilterChange={setSelectedFractions}
          />
        </div>
        <AppointmentList
          appointments={data.appointments}
          fractions={data.fractions}
          selectedFractions={selectedFractions}
        />
      </div>

      {/* Info */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Verfügbare Abfallsorten
        </h3>
        {data.fractions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.fractions.map((fraction) => (
              <span
                key={fraction.id}
                className="text-xs text-zinc-600 dark:text-zinc-400"
              >
                {fraction.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Keine Abfallsorten verfügbar
          </p>
        )}
      </div>
    </div>
  );
}
