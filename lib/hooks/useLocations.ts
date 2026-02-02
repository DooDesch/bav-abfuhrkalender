'use client';

import useSWR from 'swr';
import type { Location, ApiResponse } from '@/lib/types/bav-api.types';

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

interface UseLocationsReturn {
  /** List of available locations */
  locations: Location[];
  /** Whether the data is loading */
  isLoading: boolean;
  /** Error if the request failed */
  error: Error | undefined;
}

/**
 * SWR hook for fetching available locations
 * Data is cached and shared across components
 */
export function useLocations(): UseLocationsReturn {
  const { data, error, isLoading } = useSWR<Location[]>(
    '/api/locations',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Dedupe for 5 minutes (locations rarely change)
    }
  );

  return {
    locations: data ?? [],
    isLoading,
    error,
  };
}
