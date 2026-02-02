'use client';

import useSWR from 'swr';
import type { WasteCalendarResponse, ApiResponse } from '@/lib/types/bav-api.types';

/**
 * Fetcher function for SWR
 */
async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json() as ApiResponse<T>;
  
  if (!data.success) {
    throw new Error(data.error ?? 'An error occurred');
  }
  
  return data.data as T;
}

interface UseWasteCalendarReturn {
  /** The waste calendar data */
  data: WasteCalendarResponse | undefined;
  /** Whether the data is loading */
  isLoading: boolean;
  /** Error if the request failed */
  error: Error | undefined;
  /** Whether the data is being revalidated */
  isValidating: boolean;
  /** Refresh the data */
  refresh: () => Promise<WasteCalendarResponse | undefined>;
  /** Force refresh (bypasses cache) */
  forceRefresh: () => Promise<void>;
}

/**
 * SWR hook for fetching waste calendar data
 * Provides automatic caching, revalidation, and error handling
 */
export function useWasteCalendar(
  location: string | undefined,
  street: string | undefined
): UseWasteCalendarReturn {
  const shouldFetch = Boolean(location?.trim() && street?.trim());
  
  const url = shouldFetch
    ? `/api/abfuhrkalender?location=${encodeURIComponent(location!)}&street=${encodeURIComponent(street!)}`
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<WasteCalendarResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Dedupe requests within 1 minute
      errorRetryCount: 2,
    }
  );

  const refresh = async () => {
    return mutate();
  };

  const forceRefresh = async () => {
    if (!shouldFetch) return;
    
    // Use POST to force cache refresh
    const postUrl = `/api/abfuhrkalender?location=${encodeURIComponent(location!)}&street=${encodeURIComponent(street!)}`;
    await fetch(postUrl, { method: 'POST' });
    await mutate();
  };

  return {
    data,
    isLoading,
    error,
    isValidating,
    refresh,
    forceRefresh,
  };
}
