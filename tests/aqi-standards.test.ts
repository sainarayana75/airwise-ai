import { describe, it, expect } from 'vitest';
import {
  calculateEPAIndex,
  getAQICategory,
  calculateOverallAQI,
  US_EPA_PM25_BREAKPOINTS,
  US_EPA_PM10_BREAKPOINTS,
} from '../src/utils/aqi-calculator';
import { PollutantValues } from '../src/types';

describe('AQI Standards & Breakpoint Calculator', () => {
  it('correctly calculates US EPA PM2.5 index across all breakpoints', () => {
    // 0 to 9.0 -> 0 to 50
    expect(calculateEPAIndex(0, US_EPA_PM25_BREAKPOINTS)).toBe(0);
    expect(calculateEPAIndex(4.5, US_EPA_PM25_BREAKPOINTS)).toBe(25);
    expect(calculateEPAIndex(9.0, US_EPA_PM25_BREAKPOINTS)).toBe(50);

    // 9.1 to 35.4 -> 51 to 100
    expect(calculateEPAIndex(12.0, US_EPA_PM25_BREAKPOINTS)).toBe(56);
    expect(calculateEPAIndex(35.4, US_EPA_PM25_BREAKPOINTS)).toBe(100);

    // 35.5 to 55.4 -> 101 to 150
    expect(calculateEPAIndex(45.0, US_EPA_PM25_BREAKPOINTS)).toBe(124);
    expect(calculateEPAIndex(55.4, US_EPA_PM25_BREAKPOINTS)).toBe(150);

    // 55.5 to 125.4 -> 151 to 200
    expect(calculateEPAIndex(125.4, US_EPA_PM25_BREAKPOINTS)).toBe(200);

    // 125.5 to 225.4 -> 201 to 300
    expect(calculateEPAIndex(225.4, US_EPA_PM25_BREAKPOINTS)).toBe(300);

    // 225.5 to 500.4 -> 301 to 500
    expect(calculateEPAIndex(350.0, US_EPA_PM25_BREAKPOINTS)).toBe(391);
  });

  it('correctly calculates US EPA PM10 index', () => {
    expect(calculateEPAIndex(25, US_EPA_PM10_BREAKPOINTS)).toBe(23);
    expect(calculateEPAIndex(54, US_EPA_PM10_BREAKPOINTS)).toBe(50);
    expect(calculateEPAIndex(154, US_EPA_PM10_BREAKPOINTS)).toBe(100);
    expect(calculateEPAIndex(254, US_EPA_PM10_BREAKPOINTS)).toBe(150);
  });

  it('handles negative or invalid concentrations gracefully', () => {
    expect(calculateEPAIndex(-15, US_EPA_PM25_BREAKPOINTS)).toBe(0);
    expect(calculateEPAIndex(NaN, US_EPA_PM25_BREAKPOINTS)).toBe(0);
  });

  it('caps extreme concentrations safely at 500 max AQI', () => {
    expect(calculateEPAIndex(800, US_EPA_PM25_BREAKPOINTS)).toBe(500);
  });

  it('accurately categorizes US EPA AQI levels', () => {
    expect(getAQICategory(30, 'US_AQI').category).toBe('Good');
    expect(getAQICategory(75, 'US_AQI').category).toBe('Moderate');
    expect(getAQICategory(125, 'US_AQI').category).toBe('Unhealthy for Sensitive Groups');
    expect(getAQICategory(175, 'US_AQI').category).toBe('Unhealthy');
    expect(getAQICategory(250, 'US_AQI').category).toBe('Very Unhealthy');
    expect(getAQICategory(350, 'US_AQI').category).toBe('Hazardous');
  });

  it('accurately maps European AQI (EAQI) standard bands', () => {
    expect(getAQICategory(15, 'EAQI').category).toBe('Good');
    expect(getAQICategory(35, 'EAQI').category).toBe('Good');
    expect(getAQICategory(55, 'EAQI').category).toBe('Moderate');
    expect(getAQICategory(75, 'EAQI').category).toBe('Unhealthy for Sensitive Groups');
    expect(getAQICategory(95, 'EAQI').category).toBe('Unhealthy');
    expect(getAQICategory(120, 'EAQI').category).toBe('Hazardous');
  });

  it('accurately maps Indian CPCB AQI standard bands', () => {
    expect(getAQICategory(40, 'IN_CPCB_AQI').category).toBe('Good');
    expect(getAQICategory(90, 'IN_CPCB_AQI').category).toBe('Good');
    expect(getAQICategory(150, 'IN_CPCB_AQI').category).toBe('Moderate');
    expect(getAQICategory(250, 'IN_CPCB_AQI').category).toBe('Unhealthy');
    expect(getAQICategory(350, 'IN_CPCB_AQI').category).toBe('Very Unhealthy');
    expect(getAQICategory(450, 'IN_CPCB_AQI').category).toBe('Hazardous');
  });

  it('calculates overall dominant pollutant correctly from multi-pollutant values', () => {
    const pollutants: PollutantValues = {
      pm2_5: 85.0, // High PM2.5
      pm10: 45.0,  // Moderate PM10
      no2: 20.0,
      so2: 5.0,
      o3: 40.0,
      co: 300.0,
    };
    const overall = calculateOverallAQI(pollutants);
    expect(overall.dominantPollutant).toBe('PM2.5');
    expect(overall.aqi).toBeGreaterThan(150);
  });

  it('handles missing pollutant values without failing', () => {
    const sparsePollutants: PollutantValues = {
      pm2_5: null,
      pm10: 100.0,
      no2: null,
      so2: null,
      o3: null,
      co: null,
    };
    const overall = calculateOverallAQI(sparsePollutants);
    expect(overall.dominantPollutant).toBe('PM10');
    expect(overall.aqi).toBeGreaterThan(50);
  });
});
