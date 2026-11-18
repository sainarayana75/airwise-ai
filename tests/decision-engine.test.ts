import { describe, it, expect } from 'vitest';
import {
  generateDailyPlan,
  calculateVentilationWindows,
  getTailoredIndoorHacks,
  getSustainableAlternatives,
} from '../src/engine/decision-engine';
import { AirQualityData, UserProfile } from '../src/types';

describe('Intelligent Decision Engine & Safety Logic', () => {
  const mockUser: UserProfile = {
    location: { id: 'test-city', city: 'Test City', country: 'Testland', latitude: 28.6, longitude: 77.2 },
    familySize: 3,
    familyMembers: [
      { id: '1', name: 'Child 1', ageGroup: 'child', hasRespiratoryCondition: true, isPregnant: false },
      { id: '2', name: 'Adult 1', ageGroup: 'adult', hasRespiratoryCondition: false, isPregnant: false },
      { id: '3', name: 'Elderly 1', ageGroup: 'elderly', hasRespiratoryCondition: false, isPregnant: false },
    ],
    workSchedule: 'fixed_office',
    dailyCommuteDistanceKm: 15,
    primaryCommuteMode: 'car_petrol',
    outdoorActivityPreference: 'morning_runs',
    budget: 'low',
    homeType: 'apartment',
    hasAirPurifier: false,
    hasKitchenExhaust: false,
    isOnboarded: true,
  };

  const highSmogEnv: AirQualityData = {
    aqi: 220,
    standard: 'US_AQI',
    standardLabel: 'US EPA AQI Standard',
    category: 'Very Unhealthy',
    color: '#8B5CF6',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 165.0, pm10: 240.0, no2: 50.0, so2: 15.0, o3: 30.0, co: 1200.0 },
    weather: { temperature: 12, humidity: 75, windSpeed: 5, windDirection: 0, weatherCode: 45, weatherDescription: 'Smog' },
    hourlyForecast: [
      { time: '09:00', hour: 9, aqi: 240, pm2_5: 180, pm10: 260, temperature: 11, windSpeed: 4 },
      { time: '14:00', hour: 14, aqi: 190, pm2_5: 140, pm10: 200, temperature: 16, windSpeed: 6 },
      { time: '20:00', hour: 20, aqi: 230, pm2_5: 170, pm10: 250, temperature: 13, windSpeed: 4 },
    ],
    dailyForecast: [],
    source: 'Test Provider',
    timestamp: new Date().toISOString(),
    isSimulated: false,
    isForecast: false,
    healthPrecautions: [],
    sensitiveGroupsWarning: [],
  };

  const cleanEnv: AirQualityData = {
    ...highSmogEnv,
    aqi: 35,
    category: 'Good',
    color: '#10B981',
    pollutants: { pm2_5: 8.0, pm10: 15.0, no2: 10.0, so2: 2.0, o3: 40.0, co: 200.0 },
  };

  it('strictly shifts outdoor workouts indoors during high smog episodes', () => {
    const plan = generateDailyPlan(mockUser, highSmogEnv);
    const morningWorkout = plan.morning.find(r => r.category === 'outdoor_activity');
    expect(morningWorkout).toBeDefined();
    expect(morningWorkout?.isIndoorAlternative).toBe(true);
    expect(morningWorkout?.suggestedAction).toContain('indoor');
    expect(morningWorkout?.priority).toBe('critical');
  });

  it('allows outdoor exercise safely when air quality is clean', () => {
    const plan = generateDailyPlan(mockUser, cleanEnv);
    const morningWorkout = plan.morning.find(r => r.category === 'outdoor_activity');
    expect(morningWorkout).toBeDefined();
    expect(morningWorkout?.isIndoorAlternative).toBe(false);
    expect(morningWorkout?.title).toContain('Safe');
  });

  it('triggers critical protection recommendations for vulnerable family members (asthma & children)', () => {
    const plan = generateDailyPlan(mockUser, highSmogEnv);
    const vulnerableRec = plan.morning.find(r => r.id === 'rec-morn-vulnerable-protection');
    expect(vulnerableRec).toBeDefined();
    expect(vulnerableRec?.suggestedAction).toContain('inhalers');
    expect(vulnerableRec?.priority).toBe('critical');
  });

  it('prioritizes low-cost and DIY clean-room hacks for low-budget households without purifiers', () => {
    const plan = generateDailyPlan(mockUser, highSmogEnv);
    const nightRec = plan.evening.find(r => r.id === 'rec-eve-clean-room-setup');
    expect(nightRec).toBeDefined();
    expect(nightRec?.title).toContain('Clean-Air Sleeping Zone');
    expect(nightRec?.suggestedAction).toContain('bedroom window cracks');
  });

  it('never recommends opening windows during high smog conditions', () => {
    const windows = calculateVentilationWindows(highSmogEnv);
    // All ventilation windows should be marked NOT recommended
    for (const win of windows) {
      expect(win.recommended).toBe(false);
      expect(win.advisory).toContain('DO NOT open windows');
    }
  });

  it('identifies safe ventilation windows when air quality is clean', () => {
    const cleanHourlyEnv: AirQualityData = {
      ...cleanEnv,
      hourlyForecast: [
        { time: '09:00', hour: 9, aqi: 40, pm2_5: 9, pm10: 20, temperature: 18, windSpeed: 10 },
        { time: '14:00', hour: 14, aqi: 30, pm2_5: 7, pm10: 15, temperature: 22, windSpeed: 12 },
        { time: '20:00', hour: 20, aqi: 35, pm2_5: 8, pm10: 18, temperature: 19, windSpeed: 8 },
      ],
    };
    const windows = calculateVentilationWindows(cleanHourlyEnv);
    const safeWindow = windows.find(w => w.recommended);
    expect(safeWindow).toBeDefined();
    expect(safeWindow?.advisory).toContain('Safe to open windows');
  });

  it('safely disables cycling / active commuting when AQI is dangerously high', () => {
    const alternatives = getSustainableAlternatives(mockUser, highSmogEnv);
    const cyclingAlt = alternatives.find(a => a.id === 'alt-cycling-walking');
    expect(cyclingAlt).toBeDefined();
    expect(cyclingAlt?.isSafeToday).toBe(false);
    expect(cyclingAlt?.exposureImpact).toContain('CRITICAL WARNING');
  });

  it('enables cycling / active commuting when AQI is safe', () => {
    const alternatives = getSustainableAlternatives(mockUser, cleanEnv);
    const cyclingAlt = alternatives.find(a => a.id === 'alt-cycling-walking');
    expect(cyclingAlt).toBeDefined();
    expect(cyclingAlt?.isSafeToday).toBe(true);
  });

  it('provides tailored indoor hacks with evidence-based DIY Corsi-Rosenthal box for low budget', () => {
    const hacks = getTailoredIndoorHacks(mockUser, highSmogEnv);
    const corsi = hacks.find(h => h.id === 'corsi-rosenthal');
    expect(corsi).toBeDefined();
    expect(corsi?.efficacy).toContain('CADR');
    expect(corsi?.scientificRationale).toContain('MERV 13');
  });
});
