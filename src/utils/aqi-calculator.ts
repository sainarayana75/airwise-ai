// ==============================================================
// AIR QUALITY STANDARDS & AQI BREAKPOINT CALCULATOR
// Complies with official US EPA, European EAQI, and Indian CPCB standards
// ==============================================================

import { AQICategory, AQIStandard, PollutantValues } from '../types';

export interface AQIBreakpoint {
  cLow: number;
  cHigh: number;
  iLow: number;
  iHigh: number;
  category: AQICategory;
}

// Official US EPA Breakpoints for PM2.5 (µg/m³, 24-hr average)
// Reference: US EPA 2024 revisions
export const US_EPA_PM25_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0.0, cHigh: 9.0, iLow: 0, iHigh: 50, category: 'Good' },
  { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100, category: 'Moderate' },
  { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150, category: 'Unhealthy for Sensitive Groups' },
  { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200, category: 'Unhealthy' },
  { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300, category: 'Very Unhealthy' },
  { cLow: 225.5, cHigh: 500.4, iLow: 301, iHigh: 500, category: 'Hazardous' },
];

// Official US EPA Breakpoints for PM10 (µg/m³, 24-hr average)
export const US_EPA_PM10_BREAKPOINTS: AQIBreakpoint[] = [
  { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50, category: 'Good' },
  { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100, category: 'Moderate' },
  { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150, category: 'Unhealthy for Sensitive Groups' },
  { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200, category: 'Unhealthy' },
  { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300, category: 'Very Unhealthy' },
  { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500, category: 'Hazardous' },
];

/**
 * Calculate linear interpolation for US EPA AQI formula:
 * I = ((I_high - I_low) / (C_high - C_low)) * (C - C_low) + I_low
 */
export function calculateEPAIndex(concentration: number, breakpoints: AQIBreakpoint[]): number {
  if (concentration < 0 || isNaN(concentration)) return 0;
  
  for (const bp of breakpoints) {
    if (concentration >= bp.cLow && concentration <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (concentration - bp.cLow) + bp.iLow;
      return Math.round(aqi);
    }
  }

  // If concentration exceeds the top breakpoint, extrapolate or cap at hazardous maximum
  if (concentration > breakpoints[breakpoints.length - 1].cHigh) {
    const highest = breakpoints[breakpoints.length - 1];
    return Math.min(500, Math.round(highest.iHigh + (concentration - highest.cHigh)));
  }

  return 0;
}

/**
 * Determine US EPA AQI category from index
 */
export function getAQICategory(aqi: number, standard: AQIStandard = 'US_AQI'): {
  category: AQICategory;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
} {
  if (standard === 'US_AQI') {
    if (aqi <= 50) {
      return {
        category: 'Good',
        color: '#10B981',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
        description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
      };
    } else if (aqi <= 100) {
      return {
        category: 'Moderate',
        color: '#F59E0B',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        description: 'Air quality is acceptable; however, sensitive individuals may experience mild symptoms.',
      };
    } else if (aqi <= 150) {
      return {
        category: 'Unhealthy for Sensitive Groups',
        color: '#F97316',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-800',
        description: 'Members of sensitive groups may experience health effects. General public is less likely to be affected.',
      };
    } else if (aqi <= 200) {
      return {
        category: 'Unhealthy',
        color: '#EF4444',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-800',
        description: 'Some members of the general public may experience health effects; sensitive groups experience more serious effects.',
      };
    } else if (aqi <= 300) {
      return {
        category: 'Very Unhealthy',
        color: '#8B5CF6',
        badgeBg: 'bg-purple-100',
        badgeText: 'text-purple-800',
        description: 'Health alert: The risk of health effects is increased for everyone.',
      };
    } else {
      return {
        category: 'Hazardous',
        color: '#7F1D1D',
        badgeBg: 'bg-rose-950 text-white',
        badgeText: 'text-rose-100',
        description: 'Health warning of emergency conditions: Everyone is more likely to be affected.',
      };
    }
  }

  // European Air Quality Index (EAQI) standard
  if (standard === 'EAQI') {
    if (aqi <= 20) {
      return {
        category: 'Good',
        color: '#10B981',
        badgeBg: 'bg-emerald-100',
        badgeText: 'text-emerald-800',
        description: 'EAQI: Very Good air quality (clean European standard baseline).',
      };
    } else if (aqi <= 40) {
      return {
        category: 'Good',
        color: '#34D399',
        badgeBg: 'bg-teal-100',
        badgeText: 'text-teal-800',
        description: 'EAQI: Good air quality.',
      };
    } else if (aqi <= 60) {
      return {
        category: 'Moderate',
        color: '#F59E0B',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
        description: 'EAQI: Medium air quality.',
      };
    } else if (aqi <= 80) {
      return {
        category: 'Unhealthy for Sensitive Groups',
        color: '#F97316',
        badgeBg: 'bg-orange-100',
        badgeText: 'text-orange-800',
        description: 'EAQI: Poor air quality.',
      };
    } else if (aqi <= 100) {
      return {
        category: 'Unhealthy',
        color: '#EF4444',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-800',
        description: 'EAQI: Very Poor air quality.',
      };
    } else {
      return {
        category: 'Hazardous',
        color: '#7F1D1D',
        badgeBg: 'bg-rose-950 text-white',
        badgeText: 'text-rose-100',
        description: 'EAQI: Extremely Poor air quality.',
      };
    }
  }

  // Indian CPCB AQI Standard (0-50 Good, 51-100 Satisfactory, 101-200 Moderate, 201-300 Poor, 301-400 Very Poor, 401-500 Severe)
  if (aqi <= 50) {
    return {
      category: 'Good',
      color: '#10B981',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      description: 'CPCB: Good. Minimal impact.',
    };
  } else if (aqi <= 100) {
    return {
      category: 'Good',
      color: '#34D399',
      badgeBg: 'bg-teal-100',
      badgeText: 'text-teal-800',
      description: 'CPCB: Satisfactory. Minor breathing discomfort to sensitive people.',
    };
  } else if (aqi <= 200) {
    return {
      category: 'Moderate',
      color: '#F59E0B',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      description: 'CPCB: Moderate. Breathing discomfort to people with lung disease, children and older adults.',
    };
  } else if (aqi <= 300) {
    return {
      category: 'Unhealthy',
      color: '#EF4444',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800',
      description: 'CPCB: Poor. Breathing discomfort to most people on prolonged exposure.',
    };
  } else if (aqi <= 400) {
    return {
      category: 'Very Unhealthy',
      color: '#8B5CF6',
      badgeBg: 'bg-purple-100',
      badgeText: 'text-purple-800',
      description: 'CPCB: Very Poor. Respiratory illness on prolonged exposure.',
    };
  } else {
    return {
      category: 'Hazardous',
      color: '#7F1D1D',
      badgeBg: 'bg-rose-950 text-white',
      badgeText: 'text-rose-100',
      description: 'CPCB: Severe. Affects healthy people and seriously impacts those with existing diseases.',
    };
  }
}

/**
 * Determine overall AQI from multiple pollutant concentrations according to US EPA standard
 */
export function calculateOverallAQI(pollutants: PollutantValues): {
  aqi: number;
  dominantPollutant: string;
} {
  let maxAQI = 0;
  let dominant = 'PM2.5';

  if (pollutants.pm2_5 !== null && pollutants.pm2_5 !== undefined) {
    const pm25AQI = calculateEPAIndex(pollutants.pm2_5, US_EPA_PM25_BREAKPOINTS);
    if (pm25AQI > maxAQI) {
      maxAQI = pm25AQI;
      dominant = 'PM2.5';
    }
  }

  if (pollutants.pm10 !== null && pollutants.pm10 !== undefined) {
    const pm10AQI = calculateEPAIndex(pollutants.pm10, US_EPA_PM10_BREAKPOINTS);
    if (pm10AQI > maxAQI) {
      maxAQI = pm10AQI;
      dominant = 'PM10';
    }
  }

  return { aqi: maxAQI, dominantPollutant: dominant };
}
