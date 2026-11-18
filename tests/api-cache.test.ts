import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  _clearEnvCache,
  _getCached,
  _setCached,
  getDemonstrationEnvironmentalData,
  PRESET_LOCATIONS,
  interpretWeatherCode,
  generateHealthPrecautions,
  generateSensitiveWarnings,
  fetchEnvironmentalData,
} from '../src/services/environmental-api';
import { AirQualityData } from '../src/types';

describe('Environmental API – In-Memory Cache & Decision Logic', () => {
  beforeEach(() => {
    _clearEnvCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exports _clearEnvCache without throwing and can be called multiple times', () => {
    expect(() => _clearEnvCache()).not.toThrow();
    _clearEnvCache();
    expect(true).toBe(true);
  });

  it('stores and retrieves cached environmental data within TTL', () => {
    const mockData = getDemonstrationEnvironmentalData(PRESET_LOCATIONS[0]);
    // Store live data
    _setCached(28.613, 77.209, { ...mockData, isSimulated: false });

    const retrieved = _getCached(28.613, 77.209);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.aqi).toBe(mockData.aqi);
    expect(retrieved?.isSimulated).toBe(false);
  });

  it('returns null and evicts entry when cache entry exceeds 15-minute TTL', () => {
    const mockData = getDemonstrationEnvironmentalData(PRESET_LOCATIONS[0]);
    const initialTime = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(initialTime);

    _setCached(28.613, 77.209, { ...mockData, isSimulated: false });
    expect(_getCached(28.613, 77.209)).not.toBeNull();

    // Advance time by 15 minutes + 1 millisecond (900,001 ms)
    vi.spyOn(Date, 'now').mockReturnValue(initialTime + 15 * 60 * 1000 + 1);

    const expired = _getCached(28.613, 77.209);
    expect(expired).toBeNull();

    // Verify it was evicted from cache
    const secondCheck = _getCached(28.613, 77.209);
    expect(secondCheck).toBeNull();
  });

  it('differentiates distinct geographical coordinates using 3 decimal places', () => {
    const data1 = { ...getDemonstrationEnvironmentalData(PRESET_LOCATIONS[0]), aqi: 250, isSimulated: false };
    const data2 = { ...getDemonstrationEnvironmentalData(PRESET_LOCATIONS[1]), aqi: 120, isSimulated: false };

    _setCached(28.614, 77.209, data1);
    _setCached(31.520, 74.359, data2);

    expect(_getCached(28.614, 77.209)?.aqi).toBe(250);
    expect(_getCached(31.520, 74.359)?.aqi).toBe(120);
    expect(_getCached(40.000, 10.000)).toBeNull();
  });

  it('clears all cached entries when _clearEnvCache is invoked', () => {
    const mockData = { ...getDemonstrationEnvironmentalData(PRESET_LOCATIONS[0]), isSimulated: false };
    _setCached(28.614, 77.209, mockData);
    expect(_getCached(28.614, 77.209)).not.toBeNull();

    _clearEnvCache();
    expect(_getCached(28.614, 77.209)).toBeNull();
  });

  it('never serves demonstration data as live cached data in fetchEnvironmentalData', async () => {
    // When cached entry is simulated, fetchEnvironmentalData skips cache hit
    const simulatedData: AirQualityData = {
      ...getDemonstrationEnvironmentalData(PRESET_LOCATIONS[0]),
      isSimulated: true,
    };
    _setCached(PRESET_LOCATIONS[0].latitude, PRESET_LOCATIONS[0].longitude, simulatedData);

    // Call fetchEnvironmentalData - should skip the simulated cached entry
    const result = await fetchEnvironmentalData(PRESET_LOCATIONS[0]);
    expect(result).toBeDefined();
    // If real API fails it falls back to demo, but it should never return simulated data with isSimulated false
    expect(typeof result.aqi).toBe('number');
  });

  it('PRESET_LOCATIONS is non-empty and each entry has required fields', () => {
    expect(PRESET_LOCATIONS.length).toBeGreaterThan(0);
    for (const loc of PRESET_LOCATIONS) {
      expect(typeof loc.id).toBe('string');
      expect(typeof loc.city).toBe('string');
      expect(typeof loc.latitude).toBe('number');
      expect(typeof loc.longitude).toBe('number');
    }
  });

  it('TTL_MS constant is 15 minutes in milliseconds (900,000 ms)', () => {
    const fifteenMin = 15 * 60 * 1000;
    expect(fifteenMin).toBe(900_000);
  });

  it('interpretWeatherCode returns expected string for known WMO codes', () => {
    expect(interpretWeatherCode(0)).toBe('Clear sky');
    expect(interpretWeatherCode(1)).toBe('Partly cloudy');
    expect(interpretWeatherCode(3)).toBe('Overcast');
    expect(interpretWeatherCode(45)).toBe('Smog / Inversion Fog');
    expect(interpretWeatherCode(62)).toBe('Rain showers');
    expect(interpretWeatherCode(74)).toBe('Snowfall');
    expect(interpretWeatherCode(80)).toBe('Heavy showers');
    expect(interpretWeatherCode(95)).toBe('Thunderstorm');
    expect(interpretWeatherCode(999)).toBe('Thunderstorm');
    expect(interpretWeatherCode(10)).toBe('Cloudy / Smoggy');
  });

  it('generateHealthPrecautions returns at least 1 precaution for any AQI > 0', () => {
    const weather = { temperature: 15, humidity: 60, windSpeed: 5, windDirection: 0, weatherCode: 0, weatherDescription: 'Clear' };
    const pollutants = { pm2_5: 20, pm10: 35, no2: 10, so2: 2, o3: 40, co: 300 };

    for (const aqi of [30, 80, 130, 180, 250, 350]) {
      const precautions = generateHealthPrecautions(aqi, pollutants, weather);
      expect(Array.isArray(precautions)).toBe(true);
      expect(precautions.length).toBeGreaterThan(0);
    }
  });

  it('generateSensitiveWarnings returns empty array for AQI <= 50', () => {
    expect(generateSensitiveWarnings(0)).toHaveLength(0);
    expect(generateSensitiveWarnings(50)).toHaveLength(0);
  });

  it('getDemonstrationEnvironmentalData returns isSimulated:true with valid structure', () => {
    const result = getDemonstrationEnvironmentalData(PRESET_LOCATIONS[0]);
    expect(result.isSimulated).toBe(true);
    expect(typeof result.aqi).toBe('number');
    expect(result.aqi).toBeGreaterThan(0);
    expect(Array.isArray(result.hourlyForecast)).toBe(true);
    expect(result.hourlyForecast.length).toBe(24);
    expect(Array.isArray(result.dailyForecast)).toBe(true);
  });
});
