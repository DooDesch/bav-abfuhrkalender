import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { COOKIE_CONSENT_STORAGE_KEY } from '@/lib/config/constants';

/**
 * Cookie consent categories according to GDPR requirements
 */
export interface ConsentCategories {
  /** Always true - required for basic functionality */
  necessary: boolean;
  /** Vercel Analytics & Speed Insights */
  statistics: boolean;
}

export interface ConsentState {
  /** Whether the user has made a consent decision */
  hasConsented: boolean;
  /** Timestamp when consent was given/updated */
  consentTimestamp: number | null;
  /** Individual category consents */
  categories: ConsentCategories;
  /** Whether to show the banner */
  showBanner: boolean;
  /** Whether to show detailed settings view */
  showDetails: boolean;
  
  // Actions
  /** Accept all cookie categories */
  acceptAll: () => void;
  /** Reject all optional cookies (only necessary remains) */
  rejectAll: () => void;
  /** Save custom category selection */
  savePreferences: (categories: Partial<ConsentCategories>) => void;
  /** Open the banner (for changing preferences) */
  openBanner: () => void;
  /** Close the banner */
  closeBanner: () => void;
  /** Toggle details view */
  toggleDetails: () => void;
  /** Check if a specific category is consented */
  hasConsentFor: (category: keyof ConsentCategories) => boolean;
  /** Reset all consent (for testing) */
  resetConsent: () => void;
}

const defaultCategories: ConsentCategories = {
  necessary: true, // Always true
  statistics: false, // Opt-in required for GDPR
};

export const useConsentStore = create<ConsentState>()(
  persist(
    (set, get) => ({
      hasConsented: false,
      consentTimestamp: null,
      categories: { ...defaultCategories },
      showBanner: true,
      showDetails: false,

      acceptAll: () => {
        set({
          hasConsented: true,
          consentTimestamp: Date.now(),
          categories: {
            necessary: true,
            statistics: true,
          },
          showBanner: false,
          showDetails: false,
        });
      },

      rejectAll: () => {
        set({
          hasConsented: true,
          consentTimestamp: Date.now(),
          categories: {
            necessary: true,
            statistics: false,
          },
          showBanner: false,
          showDetails: false,
        });
      },

      savePreferences: (categories) => {
        set((state) => ({
          hasConsented: true,
          consentTimestamp: Date.now(),
          categories: {
            ...state.categories,
            ...categories,
            necessary: true, // Always keep necessary true
          },
          showBanner: false,
          showDetails: false,
        }));
      },

      openBanner: () => {
        set({ showBanner: true, showDetails: false });
      },

      closeBanner: () => {
        set({ showBanner: false, showDetails: false });
      },

      toggleDetails: () => {
        set((state) => ({ showDetails: !state.showDetails }));
      },

      hasConsentFor: (category) => {
        const state = get();
        return state.hasConsented && state.categories[category];
      },

      resetConsent: () => {
        set({
          hasConsented: false,
          consentTimestamp: null,
          categories: { ...defaultCategories },
          showBanner: true,
          showDetails: false,
        });
      },
    }),
    {
      name: COOKIE_CONSENT_STORAGE_KEY,
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
      // Only persist consent-related fields, not UI state
      partialize: (state) => ({
        hasConsented: state.hasConsented,
        consentTimestamp: state.consentTimestamp,
        categories: state.categories,
      }),
      // After rehydration, set showBanner based on hasConsented
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If user has already consented, don't show banner
          // If user hasn't consented yet, show banner
          state.showBanner = !state.hasConsented;
        }
      },
    }
  )
);
