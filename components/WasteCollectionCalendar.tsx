'use client';

import { useState, useEffect } from 'react';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';
import AppointmentList from './AppointmentList';
import FractionFilter from './FractionFilter';

interface WasteCollectionCalendarProps {
  data: WasteCalendarResponse;
}

const STORAGE_KEY = 'bav-waste-collection-filter';

export default function WasteCollectionCalendar({
  data,
}: WasteCollectionCalendarProps) {
  // Get fractions that actually appear in appointments
  const availableFractionIds = new Set(
    data.appointments.map((t) => t.fractionId)
  );
  const availableFractions = data.fractions.filter((f) =>
    availableFractionIds.has(f.id)
  );

  // Initialize with all available fractions selected by default
  const [selectedFractions, setSelectedFractions] = useState<Set<number>>(
    () => {
      // Try to load from localStorage
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved) as number[];
            const savedSet = new Set(parsed);
            // Only keep fractions that are still available
            const filtered = new Set(
              Array.from(savedSet).filter((id) =>
                availableFractionIds.has(id)
              )
            );
            // If we have valid saved fractions, use them, otherwise use all available
            return filtered.size > 0 ? filtered : new Set(availableFractions.map((f) => f.id));
          }
        } catch (e) {
          // Ignore errors
        }
      }
      // Default: all available fractions selected
      return new Set(availableFractions.map((f) => f.id));
    }
  );

  // Save to localStorage when selection changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(Array.from(selectedFractions))
        );
      } catch (e) {
        // Ignore errors (e.g., localStorage full)
      }
    }
  }, [selectedFractions]);

  // Update selection when available fractions change
  useEffect(() => {
    const currentAvailableIds = new Set(availableFractions.map((f) => f.id));
    // Remove fractions that are no longer available
    const filtered = new Set(
      Array.from(selectedFractions).filter((id) =>
        currentAvailableIds.has(id)
      )
    );
    // If selection is empty or all available fractions are new, select all
    if (filtered.size === 0 || availableFractions.some((f) => !filtered.has(f.id))) {
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
        <div className="text-lg text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold">{data.street.name}</span>
          <span className="mx-2">•</span>
          <span>{data.location.name}</span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          {data.houseNumbers.length > 0
            ? `${data.houseNumbers.length} Hausnummer${data.houseNumbers.length !== 1 ? 'n' : ''} verfügbar`
            : 'Keine Hausnummern verfügbar'}
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
