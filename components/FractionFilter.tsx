'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useModalDialog } from '@/components/Modal';
import type { Fraction } from '@/lib/types/bav-api.types';

type DropdownPosition =
  | { type: 'bottom-sheet' }
  | { type: 'dropdown'; top: number; left: number; width: number };

interface FractionFilterProps {
  fractions: Fraction[];
  selectedFractions: Set<number>;
  onFilterChange: (selected: Set<number>) => void;
}

const DESKTOP_BREAKPOINT = 640;

function getDropdownPosition(
  button: HTMLButtonElement | null
): DropdownPosition | null {
  if (!button) return null;
  const rect = button.getBoundingClientRect();
  if (typeof window === 'undefined') return null;
  if (window.innerWidth < DESKTOP_BREAKPOINT) {
    return { type: 'bottom-sheet' };
  }
  return {
    type: 'dropdown',
    top: rect.bottom + 8,
    left: rect.left,
    width: Math.max(rect.width, 256),
  };
}

export default function FractionFilter({
  fractions,
  selectedFractions,
  onFilterChange,
}: FractionFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const modalDialogRef = useModalDialog();
  const [dropdownPosition, setDropdownPosition] =
    useState<DropdownPosition | null>(null);

  // When inside a modal, portal into the dialog (top layer) so the dropdown is above the modal and clickable
  const portalTarget =
    modalDialogRef?.current ?? (typeof document !== 'undefined' ? document.body : null);

  // Measure button and position dropdown (portal avoids clipping inside modals)
  useLayoutEffect(() => {
    if (!isOpen) {
      setDropdownPosition(null);
      return;
    }
    const update = () =>
      setDropdownPosition(getDropdownPosition(buttonRef.current));
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen]);

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

  const panelContent = (
    <>
      <div className="border-b border-zinc-200 p-3 dark:border-zinc-700">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Fraktionen filtern
          </h3>
          <div className="flex min-h-[44px] items-center gap-1">
            <button
              type="button"
              onClick={selectAll}
              className="flex min-h-[44px] cursor-pointer items-center rounded-md px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              Alle
            </button>
            <span className="text-zinc-400" aria-hidden>•</span>
            <button
              type="button"
              onClick={deselectAll}
              className="flex min-h-[44px] cursor-pointer items-center rounded-md px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              Keine
            </button>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 sm:max-h-64">
        {fractions.length === 0 ? (
          <p className="flex min-h-[44px] items-center p-3 text-sm text-zinc-500 dark:text-zinc-400">
            Keine Fraktionen verfügbar
          </p>
        ) : (
          <div className="space-y-1">
            {fractions.map((fraction) => {
              const isSelected = selectedFractions.has(fraction.id);
              return (
                <label
                  key={fraction.id}
                  className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFraction(fraction.id)}
                    className="h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                  />
                  <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                    {fraction.name}
                  </span>
                  {fraction.color && (
                    <div
                      className="h-4 w-4 shrink-0 rounded-full border border-zinc-300 dark:border-zinc-600"
                      style={{ backgroundColor: fraction.color }}
                    />
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  const dropdownPanel =
    isOpen && dropdownPosition ? (
      <>
        <div
          className="fixed inset-0 z-100 cursor-pointer bg-black/20 sm:bg-transparent"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
        <div
          className="fixed z-100 flex max-h-[70vh] flex-col overflow-hidden rounded-t-lg border border-b-0 border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900 sm:max-h-64 sm:rounded-lg sm:border-b"
          style={
            dropdownPosition.type === 'bottom-sheet'
              ? { bottom: 0, left: 0, right: 0 }
              : {
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                }
          }
        >
          {panelContent}
        </div>
      </>
    ) : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Fraktionen filtern"
      >
        <svg
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
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

      {portalTarget && createPortal(dropdownPanel, portalTarget)}
    </div>
  );
}
