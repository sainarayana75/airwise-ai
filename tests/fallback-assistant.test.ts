import { describe, it, expect } from 'vitest';
import {
  generateFallbackResponse,
  buildGeminiPrompt,
  SUGGESTED_PROMPT_CHIPS,
} from '../src/engine/fallback-assistant';
import { AirQualityData, UserProfile } from '../src/types';

describe('Fallback Assistant & Grounded Engine', () => {
  const mockUser: UserProfile = {
    location: { id: 'lahore', city: 'Lahore', country: 'Pakistan', latitude: 31.5, longitude: 74.3 },
    familySize: 4,
    familyMembers: [
      { id: '1', name: 'Child', ageGroup: 'child', hasRespiratoryCondition: false, isPregnant: false },
      { id: '2', name: 'Adult', ageGroup: 'adult', hasRespiratoryCondition: false, isPregnant: false },
    ],
    workSchedule: 'fixed_office',
    dailyCommuteDistanceKm: 18,
    primaryCommuteMode: 'car_petrol',
    outdoorActivityPreference: 'morning_runs',
    budget: 'low',
    homeType: 'apartment',
    hasAirPurifier: false,
    hasKitchenExhaust: true,
    isOnboarded: true,
  };

  const severeEnv: AirQualityData = {
    aqi: 290,
    standard: 'US_AQI',
    standardLabel: 'US EPA AQI Standard',
    category: 'Very Unhealthy',
    color: '#8B5CF6',
    dominantPollutant: 'PM2.5',
    pollutants: { pm2_5: 210.0, pm10: 340.0, no2: 65.0, so2: 20.0, o3: 35.0, co: 1800.0 },
    weather: { temperature: 14, humidity: 82, windSpeed: 4, windDirection: 300, weatherCode: 45, weatherDescription: 'Smog' },
    hourlyForecast: [],
    dailyForecast: [],
    source: 'Open-Meteo',
    timestamp: new Date().toISOString(),
    isSimulated: false,
    isForecast: false,
    healthPrecautions: [],
    sensitiveGroupsWarning: [],
  };

  it('correctly warns that outdoor play is NOT safe for children during severe smog', () => {
    const res = generateFallbackResponse('Is it safe for my kids to play outside today?', mockUser, severeEnv);
    expect(res.sender).toBe('assistant');
    expect(res.isFallback).toBe(true);
    expect(res.content).toContain('NOT SAFE TODAY');
    expect(res.content).toContain('Lahore');
    expect(res.content).toContain('290');
    expect(res.content).toContain('KF94 or N95');
  });

  it('provides budget-conscious DIY filtration guidance for users asking what to do without money for a purifier', () => {
    const res = generateFallbackResponse('What can I do if I cannot afford an air purifier?', mockUser, severeEnv);
    expect(res.content).toContain('Corsi-Rosenthal Box');
    expect(res.content).toContain('MERV 13');
    expect(res.content).toContain('Houseplants do NOT clean PM2.5 particulate smog');
  });

  it('provides personal vehicle recirculation advice and avoided emissions for commute queries', () => {
    const res = generateFallbackResponse('How can I reduce pollution exposure during my commute?', mockUser, severeEnv);
    expect(res.content).toContain('internal air recirculation');
    expect(res.content).toContain('18 km');
    expect(res.content).toContain('kg CO2');
  });

  it('builds system prompt for Gemini strictly containing verified numbers and ground truth constraints', () => {
    const { systemInstruction, userPrompt } = buildGeminiPrompt(
      'Should I walk to work today?',
      mockUser,
      severeEnv,
      []
    );
    expect(systemInstruction).toContain('Current AQI: 290');
    expect(systemInstruction).toContain('Dominant Pollutant: PM2.5');
    expect(systemInstruction).toContain('Lahore');
    expect(systemInstruction).toContain('NEVER recommend outdoor cycling or jogging when AQI > 100');
    expect(userPrompt).toContain('Should I walk to work today?');
  });

  it('includes pre-configured prompt chips', () => {
    expect(SUGGESTED_PROMPT_CHIPS.length).toBeGreaterThanOrEqual(5);
    expect(SUGGESTED_PROMPT_CHIPS).toContain('Is it safe for my children to play outside today?');
  });
});
