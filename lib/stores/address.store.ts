import { create } from 'zustand';
import { LAST_ADDRESS_STORAGE_KEY } from '@/lib/config/constants';

export interface LastAddress {
  location: string;
  street: string;
}

interface AddressState {
  location: string;
  street: string;
  setLocation: (location: string) => void;
  setStreet: (street: string) => void;
  setAddress: (location: string, street: string) => void;
  getLastAddress: () => LastAddress;
  setLastAddress: (location: string, street: string) => void;
}

function readLastAddressFromStorage(): LastAddress {
  if (typeof window === 'undefined') {
    return { location: '', street: '' };
  }
  try {
    const raw = localStorage.getItem(LAST_ADDRESS_STORAGE_KEY);
    if (!raw) return { location: '', street: '' };
    const parsed = JSON.parse(raw) as { location?: string; street?: string };
    return {
      location: parsed?.location?.trim() ?? '',
      street: parsed?.street?.trim() ?? '',
    };
  } catch {
    return { location: '', street: '' };
  }
}

function writeLastAddressToStorage(location: string, street: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      LAST_ADDRESS_STORAGE_KEY,
      JSON.stringify({ location: location.trim(), street: street.trim() })
    );
  } catch {
    // Ignore storage errors
  }
}

export const useAddressStore = create<AddressState>((set, get) => ({
  location: '',
  street: '',
  setLocation: (location) => set({ location }),
  setStreet: (street) => set({ street }),
  setAddress: (location, street) => set({ location, street }),
  getLastAddress: () => readLastAddressFromStorage(),
  setLastAddress: (location, street) => {
    const trimmedLocation = location.trim();
    const trimmedStreet = street.trim();
    writeLastAddressToStorage(trimmedLocation, trimmedStreet);
    set({ location: trimmedLocation, street: trimmedStreet });
  },
}));
