'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Fraction } from '@/lib/types/bav-api.types';
import { FRACTION_FILTER_STORAGE_KEY } from '@/lib/config/constants';

/** Key used to store the last used filters for suggestions */
const LAST_USED_FILTERS_KEY = '_lastUsedFilters';

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
  /** Whether this address is being used for the first time (no saved filters) */
  isFirstTimeForAddress: boolean;
  /** Mark this address as configured (dismisses the setup dialog) */
  markAsConfigured: () => void;
}

/**
 * Helper to get the stored filter data from localStorage
 */
function getStoredFilterData(): Record<string, number[]> {
  if (typeof window === 'undefined') return {};
  
  try {
    const raw = localStorage.getItem(FRACTION_FILTER_STORAGE_KEY);
    if (!raw) return {};
    
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, number[]>;
    }
  } catch {
    // Ignore errors
  }
  return {};
}

/**
 * Helper to save filter data to localStorage
 */
function saveFilterData(data: Record<string, number[]>): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(FRACTION_FILTER_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore errors (e.g., localStorage full)
  }
}

/**
 * Hook to manage fraction filter state with localStorage persistence
 * Handles hydration safely and persists filter state per address
 * 
 * Features:
 * - Persists filter selection per address (location + street)
 * - Detects first-time usage for an address to show setup dialog
 * - Uses last used filters as suggestion for new addresses
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

  // Track if this is the first time for this address
  const [isFirstTimeForAddress, setIsFirstTimeForAddress] = useState(false);
  
  // Track if user has explicitly configured (dismissed the dialog)
  const hasConfiguredRef = useRef(false);

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
      const storedData = getStoredFilterData();
      
      // Check if we have saved filters for this specific address
      const hasAddressFilters = storageKey && storedData[storageKey] !== undefined;
      
      if (hasAddressFilters) {
        // Address has saved filters - restore them
        const rawIds = storedData[storageKey];
        const savedSet = new Set(rawIds);
        const filtered = new Set(
          Array.from(savedSet).filter((id) => availableFractionIds.has(id))
        );

        if (filtered.size > 0) {
          setSelectedFractions(filtered);
        }
        setIsFirstTimeForAddress(false);
      } else {
        // First time for this address
        // Check if we have lastUsedFilters to use as suggestion
        const lastUsedFilters = storedData[LAST_USED_FILTERS_KEY];
        
        if (lastUsedFilters && lastUsedFilters.length > 0) {
          // Use last used filters as suggestion (filtered to available fractions)
          const suggested = new Set(
            lastUsedFilters.filter((id) => availableFractionIds.has(id))
          );
          if (suggested.size > 0) {
            setSelectedFractions(suggested);
          }
        }
        // else: keep all fractions selected (default)
        
        setIsFirstTimeForAddress(true);
      }
    } catch {
      // Ignore errors
    } finally {
      initialRestoreDoneRef.current = true;
    }
  }, [mounted, storageKey, availableFractionIds]);

  // Persist to localStorage when selection changes (only after initial restore and configuration)
  useEffect(() => {
    if (!initialRestoreDoneRef.current || typeof window === 'undefined' || !storageKey) {
      return;
    }
    
    // Only save if user has configured or this isn't the first time
    if (isFirstTimeForAddress && !hasConfiguredRef.current) {
      return;
    }

    try {
      const storedData = getStoredFilterData();
      const fractionArray = Array.from(selectedFractions);
      
      // Save for this address
      storedData[storageKey] = fractionArray;
      
      // Also update lastUsedFilters for suggestions on new addresses
      storedData[LAST_USED_FILTERS_KEY] = fractionArray;
      
      saveFilterData(storedData);
    } catch {
      // Ignore errors
    }
  }, [selectedFractions, storageKey, isFirstTimeForAddress]);

  // Clean up selection when available fractions change
  useEffect(() => {
    const currentAvailableIds = new Set(availableFractions.map((f) => f.id));
    
    setSelectedFractions((prev) => {
      const filtered = new Set(
        Array.from(prev).filter((id) => currentAvailableIds.has(id))
      );

      // If all selected fractions were removed, select all available
      if (filtered.size === 0) {
        return new Set(availableFractions.map((f) => f.id));
      }
      
      // Only update if something was actually filtered out
      if (filtered.size !== prev.size) {
        return filtered;
      }
      
      // No change needed - return previous to avoid re-render
      return prev;
    });
  }, [availableFractions]);

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

  /**
   * Mark this address as configured by the user
   * This will:
   * 1. Save the current filter selection
   * 2. Update lastUsedFilters
   * 3. Dismiss the first-time setup dialog
   */
  const markAsConfigured = useCallback(() => {
    if (!storageKey) return;
    
    hasConfiguredRef.current = true;
    setIsFirstTimeForAddress(false);
    
    // Immediately save the current selection
    try {
      const storedData = getStoredFilterData();
      const fractionArray = Array.from(selectedFractions);
      
      storedData[storageKey] = fractionArray;
      storedData[LAST_USED_FILTERS_KEY] = fractionArray;
      
      saveFilterData(storedData);
    } catch {
      // Ignore errors
    }
  }, [storageKey, selectedFractions]);

  return {
    selectedFractions,
    setSelectedFractions,
    selectAll,
    deselectAll,
    toggleFraction,
    mounted,
    isFirstTimeForAddress,
    markAsConfigured,
  };
}
