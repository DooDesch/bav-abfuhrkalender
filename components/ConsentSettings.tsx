'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import { useConsentStore } from '@/lib/stores/consent.store';
import { cn } from '@/lib/utils';

interface ConsentSettingsProps {
  /** Additional CSS classes */
  className?: string;
  /** Display variant */
  variant?: 'icon' | 'text' | 'full' | 'floating';
}

/**
 * Button to open cookie consent settings
 * Can be placed in footer or navigation for GDPR compliance
 * (users must be able to change their preferences at any time)
 */
export default function ConsentSettings({ className, variant = 'full' }: ConsentSettingsProps) {
  const { openBanner, hasConsented, showBanner } = useConsentStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render on server
  if (!mounted) {
    return null;
  }

  if (variant === 'floating') {
    // Don't show floating button if banner is already visible or user hasn't consented yet
    if (showBanner || !hasConsented) {
      return null;
    }

    return (
      <AnimatePresence>
        <motion.button
          type="button"
          onClick={openBanner}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={cn(
            'fixed bottom-4 left-4 z-90 flex h-11 w-11 items-center justify-center rounded-full',
            'bg-white/90 dark:bg-zinc-800/90 backdrop-blur-lg',
            'border border-zinc-200/50 dark:border-zinc-700/50',
            'shadow-lg shadow-zinc-900/10 dark:shadow-black/20',
            'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
            'transition-colors cursor-pointer',
            // Hide on mobile when BottomNav is visible (it overlaps)
            'hidden sm:flex',
            className
          )}
          aria-label="Cookie-Einstellungen ändern"
          title="Cookie-Einstellungen"
        >
          <Cookie className="h-5 w-5" />
        </motion.button>
      </AnimatePresence>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openBanner}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
          'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
          'hover:bg-zinc-100 dark:hover:bg-zinc-800',
          className
        )}
        aria-label="Cookie-Einstellungen öffnen"
        title="Cookie-Einstellungen"
      >
        <Cookie className="h-4 w-4" />
      </button>
    );
  }

  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={openBanner}
        className={cn(
          'text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
          'underline underline-offset-2 transition-colors cursor-pointer',
          className
        )}
      >
        Cookie-Einstellungen
      </button>
    );
  }

  // Full variant with icon and text
  return (
    <button
      type="button"
      onClick={openBanner}
      className={cn(
        'flex items-center gap-2 text-sm transition-colors cursor-pointer',
        'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
        className
      )}
    >
      <Cookie className="h-4 w-4" />
      <span>Cookie-Einstellungen</span>
      {hasConsented && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
          Aktiv
        </span>
      )}
    </button>
  );
}
