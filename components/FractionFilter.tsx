'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Check, X } from 'lucide-react';
import type { Fraction } from '@/lib/types/bav-api.types';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FractionFilterProps {
  fractions: Fraction[];
  selectedFractions: Set<number>;
  onFilterChange: (selected: Set<number>) => void;
  inline?: boolean;
}

export default function FractionFilter({
  fractions,
  selectedFractions,
  onFilterChange,
  inline = false,
}: FractionFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

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

  const activeCount = selectedFractions.size;
  const totalCount = fractions.length;

  const filterContent = (
    <div className="p-3">
      {/* Header with quick actions */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Filter
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={selectAll}
            className="px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors cursor-pointer"
          >
            Alle
          </button>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
          >
            Keine
          </button>
        </div>
      </div>

      {/* Fraction toggles */}
      {fractions.length === 0 ? (
        <p className="text-sm text-zinc-500 py-2">Keine Abfallarten verfügbar</p>
      ) : (
        <div className="space-y-1">
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
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer',
                  isSelected
                    ? 'bg-primary/10'
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
      )}
    </div>
  );

  // Inline mode - just render the content
  if (inline) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
        {filterContent}
      </div>
    );
  }

  // Popover mode
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          aria-label="Abfallarten filtern"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
          {activeCount > 0 && activeCount < totalCount && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-white">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        {filterContent}
      </PopoverContent>
    </Popover>
  );
}
