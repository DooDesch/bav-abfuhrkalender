import { describe, it, expect, beforeEach } from 'vitest';
import {
  WasteProvider,
  PROVIDERS,
  getASOLocationNames,
  isASOLocation,
  resolveProvider,
  registerLocations,
} from './provider-registry';

describe('Provider Registry', () => {
  describe('WasteProvider enum', () => {
    it('should have BAV provider', () => {
      expect(WasteProvider.BAV).toBe('bav');
    });

    it('should have AbfallIO ASO provider', () => {
      expect(WasteProvider.ABFALL_IO_ASO).toBe('abfall_io_aso');
    });
  });

  describe('PROVIDERS configuration', () => {
    it('should have configuration for BAV', () => {
      expect(PROVIDERS[WasteProvider.BAV]).toBeDefined();
      expect(PROVIDERS[WasteProvider.BAV].name).toBe('BAV');
    });

    it('should have configuration for ASO', () => {
      expect(PROVIDERS[WasteProvider.ABFALL_IO_ASO]).toBeDefined();
      expect(PROVIDERS[WasteProvider.ABFALL_IO_ASO].name).toBe('ASO');
    });
  });

  describe('getASOLocationNames', () => {
    it('should return array of ASO location names', () => {
      const names = getASOLocationNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBeGreaterThan(0);
    });

    it('should include known ASO locations', () => {
      const names = getASOLocationNames();

      expect(names).toContain('Lilienthal');
      expect(names).toContain('Worpswede');
      expect(names).toContain('Osterholz-Scharmbeck');
    });
  });

  describe('isASOLocation', () => {
    it('should return true for ASO locations', () => {
      expect(isASOLocation('Lilienthal')).toBe(true);
      expect(isASOLocation('Worpswede')).toBe(true);
      expect(isASOLocation('Osterholz-Scharmbeck')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isASOLocation('lilienthal')).toBe(true);
      expect(isASOLocation('WORPSWEDE')).toBe(true);
    });

    it('should return false for non-ASO locations', () => {
      expect(isASOLocation('Burscheid')).toBe(false);
      expect(isASOLocation('Berlin')).toBe(false);
    });

    it('should handle whitespace in location names', () => {
      expect(isASOLocation('  Lilienthal  ')).toBe(true);
    });
  });

  describe('resolveProvider', () => {
    it('should resolve ASO locations to ABFALL_IO_ASO provider', () => {
      expect(resolveProvider('Lilienthal')).toBe(WasteProvider.ABFALL_IO_ASO);
      expect(resolveProvider('Worpswede')).toBe(WasteProvider.ABFALL_IO_ASO);
    });

    it('should resolve unknown locations to BAV (default)', () => {
      expect(resolveProvider('Burscheid')).toBe(WasteProvider.BAV);
      expect(resolveProvider('Unknown City')).toBe(WasteProvider.BAV);
    });

    it('should be case-insensitive', () => {
      expect(resolveProvider('lilienthal')).toBe(WasteProvider.ABFALL_IO_ASO);
    });
  });

  describe('registerLocations', () => {
    it('should register locations for a provider', () => {
      const testLocations = [
        { id: 1, name: 'TestCity1' },
        { id: 2, name: 'TestCity2' },
      ];

      registerLocations(testLocations, WasteProvider.BAV);

      // After registration, resolve should find these locations
      expect(resolveProvider('TestCity1')).toBe(WasteProvider.BAV);
      expect(resolveProvider('TestCity2')).toBe(WasteProvider.BAV);
    });
  });
});
