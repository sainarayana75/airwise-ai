import { describe, it, expect } from 'vitest';
import {
  generateDailyPlan,
  calculateVentilationWindows,
  getTailoredIndoorHacks,
  getSustainableAlternatives,
} from '../src/engine/decision-engine';
import { AirQualityData, UserProfile } from '../src/types';
import { PRESET_LOCATIONS } from '../src/services/environmental-api';

describe('Intelligent Decision Engine – Extreme & Real-World Edge Cases', () => {
  const baseUser: UserProfile = {
    location: PRESET_LOCATIONS[0],
    familySize: 4,
    familyMembers: [
      { id: '1', name: 'Baby Ayla', ageGroup: 'infant', hasRespiratoryCondition: false, isPregnant: false },
      { id: '2', name: 'Mom Fatima', ageGroup: 'adult', hasRespiratoryCondition: false, isPregnant: true },
      { id: '3', name: 'Grandpa Omar', ageGroup: 'elderly', hasRespiratoryCondition: true, isPregnant: false },
      { id: '4', name: 'Dad Hassan', ageGroup: 'adult', hasRespiratoryCondition: false, isPregnant: false },
    ],
    workSchedule: 'fixed_office',
    dailyCommuteDistanceKm: 20,
    primaryCommuteMode: 'car_diesel',
    outdoorActivityPreference: 'morning_runs',
    budget: 'low',
    homeType: 'apartment',
    hasAirPurifier: false,
    hasKitchenExhaust: false,
    isOnboarded: true,
  };

  const hazardousEnv: AirQualityData = {
    aqi: 385,
    standard: 'US_AQI',
    standardLabel: 'US EPA AQI Standard (0-500)',
    category: 'Hazardous',
    color: '#7E0023',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 335.2, pm10: 480.0, no2: 85.0, so2: 30.0, o3: 20.0, co: 3500.0 },
    weather: {
      temperature: 4, // Freezing winter inversion
      humidity: 88,
      windSpeed: 3,
      windDirection: 310,
      weatherCode: 45,
      weatherDescription: 'Smog / Inversion Fog',
    },
    hourlyForecast: [
      { time: '08:00', hour: 8, aqi: 410, pm2_5: 350, pm10: 500, temperature: 3, windSpeed: 2 },
      { time: '14:00', hour: 14, aqi: 320, pm2_5: 270, pm10: 380, temperature: 7, windSpeed: 4 },
      { time: '20:00', hour: 20, aqi: 430, pm2_5: 370, pm10: 520, temperature: 4, windSpeed: 2 },
    ],
    dailyForecast: [],
    source: 'Open-Meteo',
    timestamp: new Date().toISOString(),
    isSimulated: false,
    isForecast: false,
    healthPrecautions: ['Emergency conditions'],
    sensitiveGroupsWarning: ['Pregnant women and infants at risk'],
  };

  const pristineEnv: AirQualityData = {
    aqi: 28,
    standard: 'US_AQI',
    standardLabel: 'US EPA AQI Standard (0-500)',
    category: 'Good',
    color: '#00E400',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 6.8, pm10: 12.0, no2: 8.0, so2: 2.0, o3: 35.0, co: 250.0 },
    weather: {
      temperature: 22,
      humidity: 45,
      windSpeed: 14,
      windDirection: 180,
      weatherCode: 0,
      weatherDescription: 'Clear sky',
    },
    hourlyForecast: [
      { time: '08:00', hour: 8, aqi: 30, pm2_5: 7, pm10: 14, temperature: 18, windSpeed: 12 },
      { time: '14:00', hour: 14, aqi: 25, pm2_5: 6, pm10: 10, temperature: 24, windSpeed: 15 },
      { time: '20:00', hour: 20, aqi: 28, pm2_5: 7, pm10: 12, temperature: 20, windSpeed: 10 },
    ],
    dailyForecast: [],
    source: 'Open-Meteo',
    timestamp: new Date().toISOString(),
    isSimulated: false,
    isForecast: false,
    healthPrecautions: ['Ideal clean air conditions'],
    sensitiveGroupsWarning: [],
  };

  it('classifies overall exposure risk as Severe during hazardous smog episodes (AQI > 250)', () => {
    const plan = generateDailyPlan(baseUser, hazardousEnv);
    expect(plan.overallExposureRisk).toBe('Severe');
    expect(plan.summary).toContain('Severe smog alert');
  });

  it('cancels outdoor cardio and mandates indoor alternatives during smog', () => {
    const plan = generateDailyPlan(baseUser, hazardousEnv);
    const morningCardio = plan.morning.find(r => r.category === 'outdoor_activity');
    expect(morningCardio).toBeDefined();
    expect(morningCardio?.priority).toBe('critical');
    expect(morningCardio?.isIndoorAlternative).toBe(true);
    expect(morningCardio?.suggestedAction).toContain('indoor bodyweight circuits');
  });

  it('permits outdoor cardio when ambient air is clean (AQI < 50)', () => {
    const plan = generateDailyPlan(baseUser, pristineEnv);
    const morningCardio = plan.morning.find(r => r.category === 'outdoor_activity');
    expect(morningCardio).toBeDefined();
    expect(morningCardio?.priority).toBe('info');
    expect(morningCardio?.isIndoorAlternative).toBe(false);
  });

  it('generates critical warning for active bicycle/walking commuters during unhealthy air', () => {
    const cyclingUser: UserProfile = { ...baseUser, primaryCommuteMode: 'bicycle' };
    const plan = generateDailyPlan(cyclingUser, hazardousEnv);
    const commuteRec = plan.morning.find(r => r.category === 'commute');
    expect(commuteRec).toBeDefined();
    expect(commuteRec?.priority).toBe('critical');
    expect(commuteRec?.title).toContain('Pause Active Commuting');
  });

  it('handles remote workers by not generating morning vehicular transit recommendations', () => {
    const remoteUser: UserProfile = { ...baseUser, workSchedule: 'remote' };
    const plan = generateDailyPlan(remoteUser, hazardousEnv);
    const commuteRec = plan.morning.find(r => r.category === 'commute');
    expect(commuteRec).toBeUndefined();
  });

  it('strictly advises against opening windows during hazardous episodes', () => {
    const windows = calculateVentilationWindows(hazardousEnv);
    expect(windows.length).toBeGreaterThan(0);
    for (const w of windows) {
      expect(w.recommended).toBe(false);
      expect(w.advisory).toContain('DO NOT open windows');
    }
  });

  it('recommends opening windows when air is clean in afternoon', () => {
    const windows = calculateVentilationWindows(pristineEnv);
    const safeWindow = windows.find(w => w.recommended);
    expect(safeWindow).toBeDefined();
    expect(safeWindow?.advisory).toContain('Safe to open windows');
  });

  it('prioritizes low-cost and DIY Corsi-Rosenthal boxes for low-budget households', () => {
    const hacks = getTailoredIndoorHacks(baseUser, hazardousEnv);
    expect(hacks.length).toBeGreaterThan(0);
    // The top items for low budget should be free or low_cost
    expect(hacks[0].costLevel).toMatch(/free|low_cost/);
  });

  it('marks active cycling/walking as UNSAFE in sustainable alternatives during smog', () => {
    const alts = getSustainableAlternatives(baseUser, hazardousEnv);
    const cyclingAlt = alts.find(a => a.id === 'alt-cycling-walking');
    expect(cyclingAlt).toBeDefined();
    expect(cyclingAlt?.isSafeToday).toBe(false);
    expect(cyclingAlt?.exposureImpact).toContain('CRITICAL WARNING');
  });

  it('marks active cycling/walking as SAFE in sustainable alternatives during clean air', () => {
    const alts = getSustainableAlternatives(baseUser, pristineEnv);
    const cyclingAlt = alts.find(a => a.id === 'alt-cycling-walking');
    expect(cyclingAlt).toBeDefined();
    expect(cyclingAlt?.isSafeToday).toBe(true);
    expect(cyclingAlt?.exposureImpact).toContain('Positive Health Balance');
  });
});
