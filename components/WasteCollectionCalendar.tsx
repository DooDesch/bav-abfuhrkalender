'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { WasteCalendarResponse } from '@/lib/types/bav-api.types';
import { FRACTION_FILTER_STORAGE_KEY } from '@/lib/config/constants';
import { useAddressStore } from '@/lib/stores/address.store';
import AppointmentList from './AppointmentList';
import FractionFilter from './FractionFilter';
import Modal from './Modal';

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

  // Stable context key so restore runs on mount and when address/data changes
  const contextKey = useMemo(
    () =>
      [locationProp?.trim() ?? '', streetProp?.trim() ?? ''].join('|'),
    [locationProp, streetProp]
  );

  // Normalized address key for per-address storage (same normalization as cache)
  const storageKey = useMemo(() => {
    const loc = locationProp?.trim().toLowerCase() ?? '';
    const str = streetProp?.trim().toLowerCase() ?? '';
    return loc && str ? `${loc}|${str}` : '';
  }, [locationProp, streetProp]);

  // Gate save effect until first restore has run (avoids overwriting localStorage with initial state)
  const initialRestoreDoneRef = useRef(false);

  // After mount, restore saved filter from localStorage; re-run when context changes
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(FRACTION_FILTER_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as number[] | Record<string, number[]>;
      const rawIds: number[] = Array.isArray(parsed)
        ? parsed
        : storageKey
          ? parsed[storageKey] ?? []
          : [];
      const savedSet = new Set(rawIds);
      const filtered = new Set(
        Array.from(savedSet).filter((id) => availableFractionIds.has(id))
      );
      if (filtered.size > 0) {
        setSelectedFractions(filtered);
      }
    } catch {
      // Ignore errors
    } finally {
      initialRestoreDoneRef.current = true;
    }
  }, [mounted, contextKey, storageKey, availableFractionIds]);

  // Save to localStorage when selection changes (per-address)
  useEffect(() => {
    if (!initialRestoreDoneRef.current || typeof window === 'undefined' || !storageKey) return;
    try {
      const raw = localStorage.getItem(FRACTION_FILTER_STORAGE_KEY);
      let byAddress: Record<string, number[]> = {};
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            byAddress = parsed as Record<string, number[]>;
          }
        } catch {
          // Invalid JSON or legacy array format, start fresh
        }
      }
      byAddress[storageKey] = Array.from(selectedFractions);
      localStorage.setItem(
        FRACTION_FILTER_STORAGE_KEY,
        JSON.stringify(byAddress)
      );
    } catch {
      // Ignore errors (e.g., localStorage full)
    }
  }, [selectedFractions, storageKey]);

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

  // Export: date range (default today to +1 year)
  const defaultDateFrom = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);
  const defaultDateTo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const exportValid = dateFrom <= dateTo;

  // Export modal: own fraction selection (synced when modal opens)
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportSelectedFractions, setExportSelectedFractions] = useState<
    Set<number>
  >(() => new Set());
  const exportTriggerRef = useRef<HTMLButtonElement>(null);

  // When modal opens, initialize export fractions from current calendar filter
  useEffect(() => {
    if (exportModalOpen) {
      setExportSelectedFractions(new Set(selectedFractions));
    }
  }, [exportModalOpen, selectedFractions]);

  const handleExportModalClose = () => {
    setExportModalOpen(false);
    exportTriggerRef.current?.focus();
  };

  const modalExportUrl =
    locationProp &&
    streetProp &&
    exportValid &&
    exportSelectedFractions.size > 0
      ? `/api/export/ics?location=${encodeURIComponent(locationProp)}&street=${encodeURIComponent(streetProp)}&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&fractions=${Array.from(exportSelectedFractions).join(',')}`
      : null;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Abfuhrkalender
        </h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
            <span className="font-semibold">{data.street.name}</span>
            <span className="mx-2">•</span>
            <span>{data.location.name}</span>
          </div>
          <Link
            href="/?form=1"
            className="flex min-h-[44px] cursor-pointer items-center self-start rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Andere Adresse suchen
          </Link>
        </div>
        {data.houseNumbers.length > 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            {data.houseNumbers.length} Hausnummer{data.houseNumbers.length !== 1 ? 'n' : ''} verfügbar
          </p>
        )}
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Termine für die gewählte Adresse. Sie können die Adresse oben ändern.
        </p>
      </div>

      {/* Appointments */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Abfuhrtermine
          </h2>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
            <FractionFilter
              fractions={availableFractions}
              selectedFractions={selectedFractions}
              onFilterChange={setSelectedFractions}
            />
            <button
              ref={exportTriggerRef}
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="In Kalender exportieren"
            >
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              In Kalender exportieren
            </button>
          </div>
        </div>

        <Modal
          open={exportModalOpen}
          onClose={handleExportModalClose}
          title="In Kalender exportieren"
        >
          <p className="mb-4 text-zinc-600 dark:text-zinc-400">
            Wählen Sie die Fraktionen und den Zeitraum für den Export.
          </p>
          <div className="mb-4">
            <span className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Fraktionen für die .ics-Datei
            </span>
            <FractionFilter
              fractions={availableFractions}
              selectedFractions={exportSelectedFractions}
              onFilterChange={setExportSelectedFractions}
            />
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <span>Von</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </label>
            <label className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <span>Bis</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </label>
          </div>
          {!exportValid && (
            <p className="mb-3 text-xs text-amber-600 dark:text-amber-400">
              Bitte wählen Sie ein „Von“-Datum vor dem „Bis“-Datum.
            </p>
          )}
          {modalExportUrl ? (
            <a
              href={modalExportUrl}
              download="abfuhrkalender.ics"
              className="inline-flex min-h-[44px] cursor-pointer items-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              .ics herunterladen
            </a>
          ) : (
            <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-md border border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-500">
              .ics herunterladen
            </span>
          )}
        </Modal>

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
