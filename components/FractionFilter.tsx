'use client';

import { useState } from 'react';
import type { Fraction } from '@/lib/types/bav-api.types';

interface FractionFilterProps {
  fractions: Fraction[];
  selectedFractions: Set<number>;
  onFilterChange: (selected: Set<number>) => void;
}

export default function FractionFilter({
  fractions,
  selectedFractions,
  onFilterChange,
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filter
        {activeCount > 0 && activeCount < totalCount && (
          <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">
            {activeCount}/{totalCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10 cursor-pointer"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 p-3 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  Fraktionen filtern
                </h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    Alle
                  </button>
                  <span className="text-zinc-400">•</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    Keine
                  </button>
                </div>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {fractions.length === 0 ? (
                <p className="p-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Keine Fraktionen verfügbar
                </p>
              ) : (
                <div className="space-y-1">
                  {fractions.map((fraction) => {
                    const isSelected = selectedFractions.has(fraction.id);
                    return (
                      <label
                        key={fraction.id}
                        className="flex cursor-pointer items-center gap-2 rounded p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleFraction(fraction.id)}
                          className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                        />
                        <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                          {fraction.name}
                        </span>
                        {fraction.color && (
                          <div
                            className="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600"
                            style={{ backgroundColor: fraction.color }}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
