'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Check, Sparkles } from 'lucide-react';
import type { Fraction } from '@/lib/types/bav-api.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface FilterSetupDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** All available fractions to choose from */
  fractions: Fraction[];
  /** Currently selected fraction IDs */
  selectedFractions: Set<number>;
  /** Callback when fraction selection changes */
  onFilterChange: (selected: Set<number>) => void;
  /** Callback when user confirms their selection */
  onConfirm: () => void;
}

/**
 * Dialog shown to users when they use an address for the first time.
 * Allows them to configure which waste fractions are relevant to them.
 */
export default function FilterSetupDialog({
  open,
  fractions,
  selectedFractions,
  onFilterChange,
  onConfirm,
}: FilterSetupDialogProps) {
  const toggleFraction = (fractionId: number) => {
    const newSelected = new Set(selectedFractions);
    if (newSelected.has(fractionId)) {
      newSelected.delete(fractionId);
    } else {
      newSelected.add(fractionId);
    }
    onFilterChange(newSelected);
  };

  const selectAll = () => {
    onFilterChange(new Set(fractions.map((f) => f.id)));
  };

  const deselectAll = () => {
    onFilterChange(new Set());
  };

  const hasSelection = selectedFractions.size > 0;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" aria-describedby="filter-setup-description">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
              <Settings2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Filter einrichten</DialogTitle>
            </div>
          </div>
          <DialogDescription id="filter-setup-description" className="text-left">
            Wähle die Abfallarten aus, die für dich relevant sind. Diese Auswahl wird für diese Adresse gespeichert.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Quick actions */}
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-200 dark:border-zinc-700">
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {selectedFractions.size} von {fractions.length} ausgewählt
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors cursor-pointer"
              >
                Alle
              </button>
              <span className="text-zinc-300 dark:text-zinc-600">|</span>
              <button
                type="button"
                onClick={deselectAll}
                className="px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                Keine
              </button>
            </div>
          </div>

          {/* Fraction list */}
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
            {fractions.map((fraction) => {
              const isSelected = selectedFractions.has(fraction.id);
              const color = fraction.color || '#71717a';

              return (
                <motion.button
                  key={fraction.id}
                  type="button"
                  onClick={() => toggleFraction(fraction.id)}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 cursor-pointer',
                    isSelected
                      ? 'bg-primary/10 ring-1 ring-primary/20'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-zinc-300 dark:border-zinc-600'
                    )}
                  >
                    <AnimatePresence>
                      {isSelected && (
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

                  {/* Fraction info */}
                  <span className="flex-1 text-left text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {fraction.name}
                  </span>

                  {/* Color indicator */}
                  <div
                    className="h-4 w-4 flex-shrink-0 rounded-full border border-white/50 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                </motion.button>
              );
            })}
          </div>

          {/* Hint */}
          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 flex items-start gap-2">
            <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/70" />
            <span>
              Du kannst diese Einstellung jederzeit über den Filter-Button im Kalender ändern.
            </span>
          </p>
        </div>

        <DialogFooter>
          <Button
            onClick={onConfirm}
            disabled={!hasSelection}
            className="w-full sm:w-auto gap-2"
          >
            <Check className="h-4 w-4" />
            Speichern & fortfahren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
