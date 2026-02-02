import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LAST_ADDRESS_STORAGE_KEY } from '@/lib/config/constants';

export interface LastAddress {
  location: string;
  street: string;
}

interface AddressState {
  location: string;
  street: string;
  lastLocation: string;
  lastStreet: string;
  // Flag to indicate user wants to select a new address
  wantsNewAddress: boolean;
  setLocation: (location: string) => void;
  setStreet: (street: string) => void;
  setAddress: (location: string, street: string) => void;
  getLastAddress: () => LastAddress;
  setLastAddress: (location: string, street: string) => void;
  setWantsNewAddress: (wants: boolean) => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      location: '',
      street: '',
      lastLocation: '',
      lastStreet: '',
      wantsNewAddress: false,
      setLocation: (location) => set({ location }),
      setStreet: (street) => set({ street }),
      setAddress: (location, street) => set({ location, street }),
      getLastAddress: () => ({
        location: get().lastLocation,
        street: get().lastStreet,
      }),
      setLastAddress: (location, street) => {
        const trimmedLocation = location.trim();
        const trimmedStreet = street.trim();
        set({
          location: trimmedLocation,
          street: trimmedStreet,
          lastLocation: trimmedLocation,
          lastStreet: trimmedStreet,
          wantsNewAddress: false, // Reset flag when new address is set
        });
      },
      setWantsNewAddress: (wants) => set({ wantsNewAddress: wants }),
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
      // Only persist the "last" address fields
      partialize: (state) => ({
        lastLocation: state.lastLocation,
        lastStreet: state.lastStreet,
      }),
    }
  )
);
