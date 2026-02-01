import { NextResponse } from 'next/server';
import { BAVApiError } from '@/lib/types/bav-api.types';
import type { ApiResponse } from '@/lib/types/bav-api.types';

/**
 * Handle errors and return appropriate NextResponse
 */
export function handleApiError(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): NextResponse<ApiResponse<never>> {
  console.error('API Error:', error);

  if (error instanceof BAVApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || defaultMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: defaultMessage,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Create success response
 */
export function createSuccessResponse<T>(
  data: T,
  cached: boolean = false,
  cacheExpiresAt?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    cached,
    cacheExpiresAt,
    timestamp: new Date().toISOString(),
  };
}
