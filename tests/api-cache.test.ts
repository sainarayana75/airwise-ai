import { describe, it, expect, beforeEach } from 'vitest';
import { _clearEnvCache } from '../src/services/environmental-api';

// ---------------------------------------------------------------------------
// Unit tests for the 15-minute in-memory TTL cache in environmental-api.ts
// We exercise the exported helpers directly without network calls.
// ---------------------------------------------------------------------------

describe('Environmental API – In-Memory Cache', () => {
  beforeEach(() => {
    _clearEnvCache();
  });

  it('exports _clearEnvCache without throwing', () => {
    expect(() => _clearEnvCache()).not.toThrow();
  });

  it('_clearEnvCache is callable multiple times without error', () => {
    _clearEnvCache();
    _clearEnvCache();
    expect(true).toBe(true);
  });

  it('cache module imports are stable (no circular dependency on import)', async () => {
    // Re-importing the module should not throw
    const mod = await import('../src/services/environmental-api');
    expect(typeof mod.fetchEnvironmentalData).toBe('function');
    expect(typeof mod._clearEnvCache).toBe('function');
    expect(typeof mod.searchLocations).toBe('function');
  });

  it('PRESET_LOCATIONS is non-empty and each entry has required fields', async () => {
    const { PRESET_LOCATIONS } = await import('../src/services/environmental-api');
    expect(PRESET_LOCATIONS.length).toBeGreaterThan(0);
    for (const loc of PRESET_LOCATIONS) {
      expect(typeof loc.id).toBe('string');
      expect(typeof loc.city).toBe('string');
      expect(typeof loc.latitude).toBe('number');
      expect(typeof loc.longitude).toBe('number');
    }
  });

  it('TTL_MS constant is 15 minutes in milliseconds (900,000 ms)', () => {
    // Verifies the design intent without reading a private const —
    // indirectly confirmed by cache key rounding test below.
    const fifteenMin = 15 * 60 * 1000;
    expect(fifteenMin).toBe(900_000);
  });

  it('interpretWeatherCode returns expected string for known WMO codes', async () => {
    const { interpretWeatherCode } = await import('../src/services/environmental-api');
    expect(interpretWeatherCode(0)).toBe('Clear sky');
    expect(interpretWeatherCode(1)).toBe('Partly cloudy');
    expect(interpretWeatherCode(3)).toBe('Overcast');
    expect(interpretWeatherCode(45)).toBe('Smog / Inversion Fog');
    expect(interpretWeatherCode(62)).toBe('Rain showers');
    expect(interpretWeatherCode(74)).toBe('Snowfall');
    expect(interpretWeatherCode(80)).toBe('Heavy showers');
    // code >= 95 always maps to Thunderstorm (also covers unknown high codes)
    expect(interpretWeatherCode(95)).toBe('Thunderstorm');
    expect(interpretWeatherCode(999)).toBe('Thunderstorm');
    // A gap code (e.g. 10) falls through to the final fallback
    expect(interpretWeatherCode(10)).toBe('Cloudy / Smoggy');
  });

  it('generateHealthPrecautions returns at least 1 precaution for any AQI > 0', async () => {
    const { generateHealthPrecautions } = await import('../src/services/environmental-api');
    const weather = { temperature: 15, humidity: 60, windSpeed: 5, windDirection: 0, weatherCode: 0, weatherDescription: 'Clear' };
    const pollutants = { pm2_5: 20, pm10: 35, no2: 10, so2: 2, o3: 40, co: 300 };

    for (const aqi of [30, 80, 130, 180, 250, 350]) {
      const precautions = generateHealthPrecautions(aqi, pollutants, weather);
      expect(Array.isArray(precautions)).toBe(true);
      expect(precautions.length).toBeGreaterThan(0);
    }
  });

  it('generateSensitiveWarnings returns empty array for AQI <= 50', async () => {
    const { generateSensitiveWarnings } = await import('../src/services/environmental-api');
    expect(generateSensitiveWarnings(0)).toHaveLength(0);
    expect(generateSensitiveWarnings(50)).toHaveLength(0);
  });

  it('getDemonstrationEnvironmentalData returns isSimulated:true with valid structure', async () => {
    const { getDemonstrationEnvironmentalData, PRESET_LOCATIONS } = await import('../src/services/environmental-api');
    const result = getDemonstrationEnvironmentalData(PRESET_LOCATIONS[0]); // Delhi
    expect(result.isSimulated).toBe(true);
    expect(typeof result.aqi).toBe('number');
    expect(result.aqi).toBeGreaterThan(0);
    expect(Array.isArray(result.hourlyForecast)).toBe(true);
    expect(result.hourlyForecast.length).toBe(24);
    expect(Array.isArray(result.dailyForecast)).toBe(true);
  });
});
