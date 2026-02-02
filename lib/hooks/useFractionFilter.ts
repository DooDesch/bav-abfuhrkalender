'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Fraction } from '@/lib/types/bav-api.types';
import { FRACTION_FILTER_STORAGE_KEY } from '@/lib/config/constants';

interface UseFractionFilterOptions {
  /** Available fractions to filter */
  availableFractions: Fraction[];
  /** Storage key for per-address persistence (normalized address key) */
  storageKey: string;
}

interface UseFractionFilterReturn {
  /** Currently selected fraction IDs */
  selectedFractions: Set<number>;
  /** Set the selected fractions */
  setSelectedFractions: (fractions: Set<number>) => void;
  /** Select all available fractions */
  selectAll: () => void;
  /** Deselect all fractions */
  deselectAll: () => void;
  /** Toggle a single fraction */
  toggleFraction: (fractionId: number) => void;
  /** Whether the component has mounted (for hydration safety) */
  mounted: boolean;
}

/**
 * Hook to manage fraction filter state with localStorage persistence
 * Handles hydration safely and persists filter state per address
 */
export function useFractionFilter({
  availableFractions,
  storageKey,
}: UseFractionFilterOptions): UseFractionFilterReturn {
  const availableFractionIds = useMemo(
    () => new Set(availableFractions.map((f) => f.id)),
    [availableFractions]
  );

  // Initialize with all available fractions selected
  const [selectedFractions, setSelectedFractions] = useState<Set<number>>(
    () => new Set(availableFractions.map((f) => f.id))
  );

  // Gate save effect until first restore has run
  const initialRestoreDoneRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // Mark as mounted after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Restore from localStorage after mount
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(FRACTION_FILTER_STORAGE_KEY);
      if (!saved) {
        initialRestoreDoneRef.current = true;
        return;
      }

      const parsed = JSON.parse(saved) as number[] | Record<string, number[]>;
      const rawIds: number[] = Array.isArray(parsed)
        ? parsed
        : storageKey
          ? (parsed[storageKey] ?? [])
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
  }, [mounted, storageKey, availableFractionIds]);

  // Persist to localStorage when selection changes
  useEffect(() => {
    if (!initialRestoreDoneRef.current || typeof window === 'undefined' || !storageKey) {
      return;
    }

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
      localStorage.setItem(FRACTION_FILTER_STORAGE_KEY, JSON.stringify(byAddress));
    } catch {
      // Ignore errors (e.g., localStorage full)
    }
  }, [selectedFractions, storageKey]);

  // Clean up selection when available fractions change
  useEffect(() => {
    const currentAvailableIds = new Set(availableFractions.map((f) => f.id));
    const filtered = new Set(
      Array.from(selectedFractions).filter((id) => currentAvailableIds.has(id))
    );

    if (filtered.size === 0) {
      setSelectedFractions(new Set(availableFractions.map((f) => f.id)));
    } else if (filtered.size !== selectedFractions.size) {
      setSelectedFractions(filtered);
    }
  }, [availableFractions, selectedFractions]);

  const selectAll = useCallback(() => {
    setSelectedFractions(new Set(availableFractions.map((f) => f.id)));
  }, [availableFractions]);

  const deselectAll = useCallback(() => {
    setSelectedFractions(new Set());
  }, []);

  const toggleFraction = useCallback((fractionId: number) => {
    setSelectedFractions((prev) => {
      const next = new Set(prev);
      if (next.has(fractionId)) {
        next.delete(fractionId);
      } else {
        next.add(fractionId);
      }
      return next;
    });
  }, []);

  return {
    selectedFractions,
    setSelectedFractions,
    selectAll,
    deselectAll,
    toggleFraction,
    mounted,
  };
}
