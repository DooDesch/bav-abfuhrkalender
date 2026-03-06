'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useConsentStore } from '@/lib/stores/consent.store';

/**
 * Conditional Analytics wrapper that only loads Vercel Analytics and Speed Insights
 * when the user has given consent for statistics cookies.
 * 
 * This is required for GDPR compliance - analytics must not be loaded
 * until explicit user consent is given.
 */
export default function ConditionalAnalytics() {
  const { hasConsented, categories } = useConsentStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch (client-only mount flag)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Only render analytics if:
  // 1. Component is mounted (client-side)
  // 2. User has consented
  // 3. Statistics category is enabled
  if (!mounted || !hasConsented || !categories.statistics) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
