'use client';

import { useCallback, useEffect, useRef, useState, useId, type DependencyList, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface AutocompleteOption {
  id: number | string;
  name: string;
}

export interface AutocompleteProps<TOption extends AutocompleteOption = AutocompleteOption> {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  /** Called when the input gains focus */
  onFocus?: () => void;
  id?: string;
  label?: string;
  placeholder?: string;
  placeholderWhenDisabled?: string;
  loadingPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
  getOptionLabel?: (option: TOption) => string;
  options?: TOption[];
  loadOptions?: (signal: AbortSignal) => Promise<TOption[]>;
  loadOptionsDeps?: DependencyList;
}

function filterOptions<TOption extends AutocompleteOption>(
  options: TOption[],
  query: string,
  getOptionLabel: (option: TOption) => string
): TOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  
  // Filter and sort results intelligently:
  // 1. Exact matches first
  // 2. Starts with query second
  // 3. Contains query elsewhere third
  // Within each category, sort alphabetically
  return options
    .filter((o) => getOptionLabel(o).toLowerCase().includes(q))
    .sort((a, b) => {
      const labelA = getOptionLabel(a).toLowerCase();
      const labelB = getOptionLabel(b).toLowerCase();
      
      const aExact = labelA === q;
      const bExact = labelB === q;
      const aStarts = labelA.startsWith(q);
      const bStarts = labelB.startsWith(q);
      
      // Exact matches first
      if (aExact && !bExact) return -1;
      if (bExact && !aExact) return 1;
      
      // Then entries that start with query
      if (aStarts && !bStarts) return -1;
      if (bStarts && !aStarts) return 1;
      
      // Within same category, sort alphabetically
      // This naturally puts "Osterholz-Scharmbeck" before "Osterholz-Scharmbeck - Buschhausen"
      return labelA.localeCompare(labelB, 'de');
    });
}

export default function Autocomplete<TOption extends AutocompleteOption = AutocompleteOption>({
  value,
  onChange,
  onSelect,
  onFocus: onFocusProp,
  id: idProp,
  label,
  placeholder = '',
  placeholderWhenDisabled,
  loadingPlaceholder,
  emptyMessage = 'Keine passenden Einträge gefunden',
  required = false,
  disabled = false,
  getOptionLabel = (o) => (o as { name: string }).name,
  options: optionsProp,
  loadOptions,
  loadOptionsDeps = [],
}: AutocompleteProps<TOption>) {
  const [options, setOptions] = useState<TOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const id = idProp ?? listId;

  const hasLoadOptions = typeof loadOptions === 'function';

  useEffect(() => {
    if (!hasLoadOptions || !loadOptions) return;

    const controller = new AbortController();
    setLoading(true);
    loadOptions(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setOptions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoadOptions, ...loadOptionsDeps]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const resolvedOptions = hasLoadOptions ? options : (optionsProp ?? []);
  const filtered = filterOptions(resolvedOptions, value, getOptionLabel);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [filtered.length, value]);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      const highlightedItem = items[highlightedIndex];
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      onChange(selectedValue);
      onSelect?.(selectedValue);
      setOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    },
    [onChange, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          setOpen(true);
          return;
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filtered.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filtered.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
            const option = filtered[highlightedIndex];
            if (option) {
              handleSelect(getOptionLabel(option));
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          setHighlightedIndex(-1);
          break;
        case 'Tab':
          setOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [open, filtered, highlightedIndex, handleSelect, getOptionLabel]
  );

  const displayPlaceholder = disabled
    ? placeholderWhenDisabled ?? placeholder
    : loading
      ? loadingPlaceholder ?? placeholder
      : placeholder;

  const highlightedOptionId =
    highlightedIndex >= 0 && filtered[highlightedIndex]
      ? `${listId}-option-${highlightedIndex}`
      : undefined;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <Label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            if (!disabled) {
              setOpen(true);
              // Notify parent component about focus
              onFocusProp?.();
              // Scroll input into view on mobile when keyboard opens
              // Small delay to allow keyboard to appear first
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }
          }}
          onBlur={() => {
            // When losing focus, check if the current value matches an option exactly
            // If so, trigger onSelect to mark it as a valid selection
            if (!disabled && value.trim()) {
              const exactMatch = resolvedOptions.find(
                (o) => getOptionLabel(o).toLowerCase() === value.trim().toLowerCase()
              );
              if (exactMatch) {
                const matchedLabel = getOptionLabel(exactMatch);
                // Update to exact casing if different
                if (matchedLabel !== value) {
                  onChange(matchedLabel);
                }
                onSelect?.(matchedLabel);
              }
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={displayPlaceholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={highlightedOptionId}
          role="combobox"
          className={cn(
            'flex h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm pl-10 pr-10 py-2 text-base ring-offset-background placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            open && 'ring-2 ring-primary ring-offset-2'
          )}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </div>

      <AnimatePresence>
        {open && !disabled && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[100] mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl py-1 shadow-xl"
            style={{ scrollbarGutter: 'stable' }}
          >
            {loading ? (
              // Show skeleton loading items while data is being fetched
              <>
                {[75, 60, 85, 55].map((width, index) => (
                  <li
                    key={`skeleton-${index}`}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse"
                      style={{ width: `${width}%` }}
                    />
                  </li>
                ))}
                <li className="flex items-center justify-center gap-2 px-4 py-2 text-xs text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Daten werden geladen…
                </li>
              </>
            ) : filtered.length === 0 ? (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option, index) => {
                const labelText = getOptionLabel(option);
                const isHighlighted = index === highlightedIndex;
                const isSelected = value === labelText;
                return (
                  <motion.li
                    key={option.id}
                    id={`${listId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      'flex cursor-pointer items-center px-4 py-3 text-sm transition-colors',
                      isHighlighted
                        ? 'bg-primary/10 text-primary'
                        : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                      isSelected && 'font-medium'
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(labelText);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {labelText}
                  </motion.li>
                );
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
