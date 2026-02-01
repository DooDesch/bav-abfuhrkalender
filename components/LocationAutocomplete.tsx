'use client';

import Autocomplete from '@/components/Autocomplete';
import type { AutocompleteOption } from '@/components/Autocomplete';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  /** Called when user selects an option from the dropdown (e.g. to clear dependent street field) */
  onSelect?: (value: string) => void;
  id?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

async function loadLocations(signal: AbortSignal): Promise<AutocompleteOption[]> {
  const res = await fetch('/api/locations', { signal });
  const json = await res.json();
  return json.success && Array.isArray(json.data) ? json.data : [];
}

export default function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  id,
  label = 'Ort',
  placeholder = 'z. B. Ort suchen',
  required = false,
  disabled = false,
}: LocationAutocompleteProps) {
  return (
    <Autocomplete
      value={value}
      onChange={onChange}
      onSelect={onSelect}
      id={id}
      label={label}
      placeholder={placeholder}
      loadingPlaceholder="Lade Orte…"
      emptyMessage="Keine passenden Orte gefunden"
      required={required}
      disabled={disabled}
      loadOptions={loadLocations}
      loadOptionsDeps={[]}
    />
  );
}
