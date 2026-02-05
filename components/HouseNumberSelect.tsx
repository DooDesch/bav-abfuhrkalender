'use client';

import { useEffect, useState, useCallback, useRef, useId, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Loader2, ChevronDown, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface HouseNumber {
  id: string;
  name: string;
}

interface HouseNumberSelectProps {
  location: string;
  street: string;
  /** Whether a street has been selected from autocomplete (not just typed) */
  streetSelected?: boolean;
  value: string;
  valueId: string;
  onChange: (name: string, id: string) => void;
  /** Called when house numbers are loaded, with whether selection is required */
  onRequiredChange?: (required: boolean) => void;
  id?: string;
  label?: string;
  required?: boolean;
}

export default function HouseNumberSelect({
  location,
  street,
  streetSelected = false,
  value,
  valueId,
  onChange,
  onRequiredChange,
  id: idProp,
  label = 'Hausnummer',
  required = false,
}: HouseNumberSelectProps) {
  const [houseNumbers, setHouseNumbers] = useState<HouseNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listId = useId();
  const id = idProp ?? listId;

  // Track fetch key to avoid refetching for same location+street
  const fetchKeyRef = useRef<string>('');
  
  // Fetch house numbers only when a complete street has been selected
  // Debounced to prevent excessive API calls
  useEffect(() => {
    const trimmedLocation = location.trim();
    const trimmedStreet = street.trim();
    const fetchKey = `${trimmedLocation}|${trimmedStreet}`;

    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    // Only fetch when a street has been explicitly selected from autocomplete
    if (!trimmedLocation || !trimmedStreet || !streetSelected) {
      // Don't clear if we already have data for this key (prevents flicker on re-render)
      if (fetchKeyRef.current !== fetchKey) {
        setHouseNumbers([]);
        setIsRequired(false);
        onRequiredChange?.(false);
      }
      return;
    }

    // Skip fetch if we already have data for this exact location+street
    if (fetchKeyRef.current === fetchKey && houseNumbers.length > 0) {
      return;
    }

    const controller = new AbortController();

    // Debounce the fetch by 300ms
    debounceRef.current = setTimeout(() => {
      setLoading(true);

      fetch(
        `/api/house-numbers?location=${encodeURIComponent(trimmedLocation)}&street=${encodeURIComponent(trimmedStreet)}`,
        { signal: controller.signal }
      )
        .then((res) => res.json())
        .then((data) => {
          if (!controller.signal.aborted) {
            const numbers = data.success && Array.isArray(data.data) ? data.data : [];
            const requiredStatus = data.required === true;
            setHouseNumbers(numbers);
            setIsRequired(requiredStatus);
            onRequiredChange?.(requiredStatus);
            fetchKeyRef.current = fetchKey;
            
            // Don't clear selection - trust the value from localStorage
            // Only clear if this is a NEW street selection (no valueId yet)
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setHouseNumbers([]);
            setIsRequired(false);
            onRequiredChange?.(false);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 300);

    return () => {
      controller.abort();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  // Remove valueId from dependencies to prevent refetch when value changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, street, streetSelected, onRequiredChange]);

  // Close dropdown when clicking outside
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

  // Scroll highlighted item into view
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
    (hn: HouseNumber) => {
      onChange(hn.name, hn.id);
      setOpen(false);
      setHighlightedIndex(-1);
      buttonRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(true);
          // Find current selection index
          const currentIndex = houseNumbers.findIndex((h) => String(h.id) === String(valueId));
          setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
          return;
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < houseNumbers.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : houseNumbers.length - 1
          );
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < houseNumbers.length) {
            const option = houseNumbers[highlightedIndex];
            if (option) {
              handleSelect(option);
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
    [open, houseNumbers, highlightedIndex, handleSelect, valueId]
  );

  // Don't render if no house numbers are available
  if (!isRequired && houseNumbers.length === 0) {
    return null;
  }

  const isDisabled = loading || houseNumbers.length === 0;
  const selectedOption = houseNumbers.find((h) => String(h.id) === String(valueId));
  // Show the passed-in value if we have one (from localStorage), even if options aren't loaded yet
  const displayValue = selectedOption?.name || value || (loading ? 'Lade Hausnummern...' : 'Hausnummer wählen');

  const highlightedOptionId =
    highlightedIndex >= 0 && houseNumbers[highlightedIndex]
      ? `${listId}-option-${highlightedIndex}`
      : undefined;

  return (
    <div ref={containerRef} className="relative space-y-2">
      <Label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
        {required && isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none z-10">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Home className="h-4 w-4" />
          )}
        </div>
        <button
          ref={buttonRef}
          id={id}
          type="button"
          onClick={() => !isDisabled && setOpen(!open)}
          onKeyDown={handleKeyDown}
          disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={highlightedOptionId}
          className={cn(
            'flex h-11 w-full items-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm pl-10 pr-10 py-2 text-base text-left ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            open && 'ring-2 ring-primary ring-offset-2',
            !valueId && 'text-zinc-400 dark:text-zinc-500',
            valueId && 'text-zinc-900 dark:text-zinc-100'
          )}
        >
          <span className="truncate">{displayValue}</span>
        </button>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
          <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </div>

      <AnimatePresence>
        {open && !isDisabled && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-[100] mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl py-1 shadow-xl"
            style={{ scrollbarGutter: 'stable' }}
          >
            {houseNumbers.map((hn, index) => {
              const isHighlighted = index === highlightedIndex;
              const isSelected = String(valueId) === String(hn.id);
              return (
                <motion.li
                  key={hn.id}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.015 }}
                  className={cn(
                    'flex cursor-pointer items-center justify-between px-4 py-3 text-sm transition-colors',
                    isHighlighted
                      ? 'bg-primary/10 text-primary'
                      : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                    isSelected && 'font-medium'
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(hn);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span>{hn.name}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {isRequired && !valueId && !loading && houseNumbers.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Für diese Straße wird eine Hausnummer benötigt
        </p>
      )}
    </div>
  );
}
