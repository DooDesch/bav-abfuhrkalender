'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface UseExportModalOptions {
  /** Location name for building export URL */
  location: string;
  /** Street name for building export URL */
  street: string;
  /** Currently selected fractions from the main filter */
  selectedFractions: Set<number>;
}

interface UseExportModalReturn {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Ref for the trigger button (for focus management) */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Date range start */
  dateFrom: string;
  /** Date range end */
  dateTo: string;
  /** Set date range start */
  setDateFrom: (date: string) => void;
  /** Set date range end */
  setDateTo: (date: string) => void;
  /** Whether the date range is valid */
  isDateRangeValid: boolean;
  /** Selected fractions for export (separate from main filter) */
  exportSelectedFractions: Set<number>;
  /** Set the export fractions */
  setExportSelectedFractions: (fractions: Set<number>) => void;
  /** The export URL if valid, otherwise null */
  exportUrl: string | null;
}

/**
 * Hook to manage export modal state and logic
 * Handles date range, fraction selection, and URL building
 */
export function useExportModal({
  location,
  street,
  selectedFractions,
}: UseExportModalOptions): UseExportModalReturn {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Export-specific fraction selection (synced when modal opens)
  const [exportSelectedFractions, setExportSelectedFractions] = useState<Set<number>>(
    () => new Set()
  );

  // Date range with sensible defaults (today to +1 year)
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

  const isDateRangeValid = dateFrom <= dateTo;

  // Sync export fractions from main filter when modal opens
  useEffect(() => {
    if (isOpen) {
      setExportSelectedFractions(new Set(selectedFractions));
    }
  }, [isOpen, selectedFractions]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Return focus to trigger button
    triggerRef.current?.focus();
  }, []);

  // Build export URL
  const exportUrl = useMemo(() => {
    if (!location || !street || !isDateRangeValid || exportSelectedFractions.size === 0) {
      return null;
    }

    const params = new URLSearchParams({
      location,
      street,
      dateFrom,
      dateTo,
      fractions: Array.from(exportSelectedFractions).join(','),
    });

    return `/api/export/ics?${params.toString()}`;
  }, [location, street, dateFrom, dateTo, isDateRangeValid, exportSelectedFractions]);

  return {
    isOpen,
    open,
    close,
    triggerRef,
    dateFrom,
    dateTo,
    setDateFrom,
    setDateTo,
    isDateRangeValid,
    exportSelectedFractions,
    setExportSelectedFractions,
    exportUrl,
  };
}
