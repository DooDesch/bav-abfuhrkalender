import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LAST_ADDRESS_STORAGE_KEY } from '@/lib/config/constants';
import type { WasteProviderType } from '@/lib/types/bav-api.types';

export interface LastAddress {
  location: string;
  street: string;
  /** Street API ID (for faster lookups without re-fetching) */
  streetId?: string;
  /** House number display name (e.g., "2") */
  houseNumber?: string;
  /** House number API ID */
  houseNumberId?: string;
  /** Provider that serves this location (for faster lookups) */
  provider?: WasteProviderType;
}

interface AddressState {
  location: string;
  street: string;
  /** Street API ID (for faster lookups without re-fetching) */
  streetId: string;
  /** House number display name (e.g., "2") */
  houseNumber: string;
  /** House number API ID */
  houseNumberId: string;
  lastLocation: string;
  lastStreet: string;
  /** Last used street API ID */
  lastStreetId: string;
  lastHouseNumber: string;
  lastHouseNumberId: string;
  /** Cached provider for current/last address */
  provider?: WasteProviderType;
  // Flag to indicate user wants to select a new address
  wantsNewAddress: boolean;
  setLocation: (location: string) => void;
  /** Set street name and optionally its API ID */
  setStreet: (street: string, streetId?: string) => void;
  setHouseNumber: (houseNumber: string, houseNumberId: string) => void;
  clearHouseNumber: () => void;
  setAddress: (location: string, street: string, streetId?: string, provider?: WasteProviderType) => void;
  getLastAddress: () => LastAddress;
  setLastAddress: (location: string, street: string, streetId?: string, houseNumber?: string, houseNumberId?: string, provider?: WasteProviderType) => void;
  /** Restore complete address state (all fields at once, no clearing) */
  restoreAddress: (address: LastAddress) => void;
  setWantsNewAddress: (wants: boolean) => void;
  /** Get the cached provider for the current address */
  getProvider: () => WasteProviderType | undefined;
}

interface AddressStore extends AddressState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set, get) => ({
      location: '',
      street: '',
      streetId: '',
      houseNumber: '',
      houseNumberId: '',
      lastLocation: '',
      lastStreet: '',
      lastStreetId: '',
      lastHouseNumber: '',
      lastHouseNumberId: '',
      provider: undefined,
      wantsNewAddress: false,
      _hasHydrated: false,
      setLocation: (location) => set({ location, street: '', streetId: '', houseNumber: '', houseNumberId: '' }),
      setStreet: (street, streetId) => set({ street, streetId: streetId || '', houseNumber: '', houseNumberId: '' }),
      setHouseNumber: (houseNumber, houseNumberId) => set({ houseNumber, houseNumberId }),
      clearHouseNumber: () => set({ houseNumber: '', houseNumberId: '' }),
      setAddress: (location, street, streetId, provider) => set({ 
        location, 
        street,
        streetId: streetId || '',
        provider,
        houseNumber: '',
        houseNumberId: '',
      }),
      getLastAddress: () => ({
        location: get().lastLocation,
        street: get().lastStreet,
        streetId: get().lastStreetId,
        houseNumber: get().lastHouseNumber,
        houseNumberId: get().lastHouseNumberId,
        provider: get().provider,
      }),
      setLastAddress: (location, street, streetId, houseNumber, houseNumberId, provider) => {
        const trimmedLocation = location.trim();
        const trimmedStreet = street.trim();
        set({
          location: trimmedLocation,
          street: trimmedStreet,
          streetId: streetId || '',
          houseNumber: houseNumber || '',
          houseNumberId: houseNumberId || '',
          lastLocation: trimmedLocation,
          lastStreet: trimmedStreet,
          lastStreetId: streetId || '',
          lastHouseNumber: houseNumber || '',
          lastHouseNumberId: houseNumberId || '',
          provider,
          wantsNewAddress: false, // Reset flag when new address is set
        });
      },
      restoreAddress: (address) => {
        // Set all address fields in one atomic update (no clearing)
        set({
          location: address.location || '',
          street: address.street || '',
          streetId: address.streetId || '',
          houseNumber: address.houseNumber || '',
          houseNumberId: address.houseNumberId || '',
          provider: address.provider,
        });
      },
      setWantsNewAddress: (wants) => set({ wantsNewAddress: wants }),
      getProvider: () => get().provider,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: LAST_ADDRESS_STORAGE_KEY,
      storage: createJSONStorage(() => {
        // Return a no-op storage for SSR
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      // Persist last address fields and provider
      partialize: (state) => ({
        lastLocation: state.lastLocation,
        lastStreet: state.lastStreet,
        lastStreetId: state.lastStreetId,
        lastHouseNumber: state.lastHouseNumber,
        lastHouseNumberId: state.lastHouseNumberId,
        provider: state.provider,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
