'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function FormSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Hero Skeleton */}
      <div className="text-center space-y-4 py-8">
        <Skeleton className="h-12 w-64 mx-auto rounded-xl" />
        <Skeleton className="h-5 w-80 mx-auto" />
        <Skeleton className="h-5 w-60 mx-auto" />
        <div className="flex justify-center gap-2 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Form Card Skeleton */}
      <Card glass>
        <CardContent className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Inputs */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>

          {/* Button */}
          <Skeleton className="h-12 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}
