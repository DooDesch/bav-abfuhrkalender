'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Shield, BarChart3, Check, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConsentStore } from '@/lib/stores/consent.store';
import { cn } from '@/lib/utils';

interface CategoryToggleProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  locked?: boolean;
  onChange: (enabled: boolean) => void;
}

function CategoryToggle({ name, description, icon, enabled, locked, onChange }: CategoryToggleProps) {
  return (
    <motion.button
      type="button"
      onClick={() => !locked && onChange(!enabled)}
      disabled={locked}
      whileTap={locked ? {} : { scale: 0.98 }}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 text-left',
        enabled
          ? 'bg-primary/10 ring-1 ring-primary/20'
          : 'bg-zinc-100 dark:bg-zinc-800/50',
        locked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer hover:bg-primary/5'
      )}
    >
      {/* Toggle switch */}
      <div
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          enabled ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-600'
        )}
      >
        <motion.div
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
          animate={{ left: enabled ? '1.5rem' : '0.25rem' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>

      {/* Icon */}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          enabled
            ? 'bg-primary/20 text-primary'
            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
        )}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{name}</span>
          {locked && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
              Erforderlich
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Check indicator */}
      <div
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200',
          enabled
            ? 'border-primary bg-primary'
            : 'border-zinc-300 dark:border-zinc-600'
        )}
      >
        <AnimatePresence>
          {enabled && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="h-3 w-3 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}

/**
 * GDPR-compliant cookie consent banner
 * Shows at the bottom of the screen until user makes a choice
 */
export default function CookieBanner() {
  const {
    hasConsented,
    showBanner,
    showDetails,
    categories,
    acceptAll,
    rejectAll,
    savePreferences,
    toggleDetails,
  } = useConsentStore();

  // Local state for category toggles in detail view
  const [localCategories, setLocalCategories] = useState(categories);

  // Prevent hydration mismatch by only showing after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync local state when categories change
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Don't render on server or if user has already consented and banner is closed
  if (!mounted || (hasConsented && !showBanner)) {
    return null;
  }

  const handleSavePreferences = () => {
    savePreferences(localCategories);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-100 p-4 pb-safe"
        >
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/50 dark:border-zinc-700/50 shadow-2xl shadow-zinc-900/10 dark:shadow-black/30 overflow-hidden">
              {/* Header */}
              <div className="p-5 pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/25">
                    <Cookie className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      Cookie-Einstellungen
                    </h2>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      Wir verwenden Cookies, um dein Erlebnis zu verbessern und anonyme Nutzungsstatistiken zu erheben.
                      Du kannst selbst entscheiden, welche Cookies du zulassen möchtest.
                    </p>
                  </div>
                </div>

                {/* Toggle details button */}
                <button
                  type="button"
                  onClick={toggleDetails}
                  className="flex items-center gap-2 mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  <Settings2 className="h-4 w-4" />
                  {showDetails ? 'Weniger anzeigen' : 'Einstellungen anpassen'}
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Detailed settings */}
              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 space-y-2">
                      <CategoryToggle
                        name="Notwendig"
                        description="Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden."
                        icon={<Shield className="h-4 w-4" />}
                        enabled={true}
                        locked={true}
                        onChange={() => {}}
                      />
                      <CategoryToggle
                        name="Statistik"
                        description="Anonyme Nutzungsstatistiken helfen uns, die Website zu verbessern. Wir verwenden Vercel Analytics."
                        icon={<BarChart3 className="h-4 w-4" />}
                        enabled={localCategories.statistics}
                        onChange={(enabled) =>
                          setLocalCategories((prev) => ({ ...prev, statistics: enabled }))
                        }
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="p-4 pt-0 flex flex-col sm:flex-row gap-2">
                {showDetails ? (
                  // Detail view: Save preferences button
                  <Button
                    onClick={handleSavePreferences}
                    className="w-full sm:w-auto gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Auswahl speichern
                  </Button>
                ) : (
                  // Compact view: Accept/Reject buttons (equally prominent per GDPR)
                  <>
                    <Button
                      onClick={rejectAll}
                      variant="outline"
                      className="w-full sm:flex-1"
                    >
                      Nur notwendige
                    </Button>
                    <Button
                      onClick={acceptAll}
                      className="w-full sm:flex-1"
                    >
                      Alle akzeptieren
                    </Button>
                  </>
                )}
              </div>

              {/* Privacy info */}
              <div className="px-5 pb-4 pt-0">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Weitere Informationen findest du in unserer{' '}
                  <a
                    href="/datenschutz"
                    className="underline underline-offset-2 hover:text-primary transition-colors"
                  >
                    Datenschutzerklärung
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
