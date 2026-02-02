'use client';

import useSWR from 'swr';
import type { Street, ApiResponse } from '@/lib/types/bav-api.types';

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

interface UseStreetsReturn {
  /** List of streets for the given location */
  streets: Street[];
  /** Whether the data is loading */
  isLoading: boolean;
  /** Error if the request failed */
  error: Error | undefined;
}

/**
 * SWR hook for fetching streets by location
 * Data is cached per location
 */
export function useStreets(location: string | undefined): UseStreetsReturn {
  const trimmedLocation = location?.trim();
  const url = trimmedLocation
    ? `/api/streets?location=${encodeURIComponent(trimmedLocation)}`
    : null;

  const { data, error, isLoading } = useSWR<Street[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // Dedupe for 5 minutes
    }
  );

  return {
    streets: data ?? [],
    isLoading,
    error,
  };
}
