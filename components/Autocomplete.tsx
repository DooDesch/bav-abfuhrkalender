'use client';

import { useCallback, useEffect, useRef, useState, useId, type DependencyList } from 'react';

export interface AutocompleteOption {
  id: number | string;
  name: string;
}

const inputClassName =
  'w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400';
const dropdownClassName =
  'absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900';

export interface AutocompleteProps<TOption extends AutocompleteOption = AutocompleteOption> {
  value: string;
  onChange: (value: string) => void;
  /** Called when user selects an option from the dropdown (e.g. to clear dependent fields). */
  onSelect?: (value: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  placeholderWhenDisabled?: string;
  loadingPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
  getOptionLabel?: (option: TOption) => string;
  /** Static options (use when not loading from API). */
  options?: TOption[];
  /** Load options asynchronously; when provided, loadOptionsDeps controls when to refetch. */
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
  return options.filter((o) => getOptionLabel(o).toLowerCase().includes(q));
}

export default function Autocomplete<TOption extends AutocompleteOption = AutocompleteOption>({
  value,
  onChange,
  onSelect,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    // Refetch when loadOptionsDeps change; loadOptions is called but not in deps so caller can pass inline loader that closes over deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoadOptions, ...loadOptionsDeps]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const resolvedOptions = hasLoadOptions ? options : (optionsProp ?? []);
  const filtered = filterOptions(resolvedOptions, value, getOptionLabel);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      onChange(selectedValue);
      onSelect?.(selectedValue);
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange, onSelect]
  );

  const displayPlaceholder = disabled
    ? placeholderWhenDisabled ?? placeholder
    : loading
      ? loadingPlaceholder ?? placeholder
      : placeholder;

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (!disabled) setOpen(true);
        }}
        placeholder={displayPlaceholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        role="combobox"
        className={`${inputClassName} ${disabled ? 'disabled:opacity-60 disabled:cursor-not-allowed' : ''}`}
      />
      {open && !disabled && (
        <ul id={listId} role="listbox" className={dropdownClassName}>
          {filtered.length === 0 ? (
            <li className="flex min-h-[44px] items-center px-3 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              {loading ? 'Lade…' : emptyMessage}
            </li>
          ) : (
            filtered.map((option) => {
              const labelText = getOptionLabel(option);
              return (
                <li
                  key={option.id}
                  role="option"
                  aria-selected={value === labelText}
                  tabIndex={-1}
                  className="flex min-h-[44px] cursor-pointer items-center px-3 py-3 text-sm text-zinc-900 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(labelText);
                  }}
                >
                  {labelText}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
