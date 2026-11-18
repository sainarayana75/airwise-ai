// ==============================================================
// VENTILATION ADVISOR
// Calculates safe natural cross-ventilation windows from hourly forecast
// ==============================================================

import { AirQualityData, VentilationWindow } from '../types';

/**
 * Determine safe ventilation windows based on hourly forecast
 */
export function calculateVentilationWindows(envData: AirQualityData): VentilationWindow[] {
  const { hourlyForecast, aqi } = envData;
  if (!hourlyForecast || hourlyForecast.length === 0) {
    return [
      {
        startHour: '13:00',
        endHour: '15:00',
        avgAqi: Math.round(aqi * 0.85),
        recommended: aqi <= 150,
        advisory: aqi > 150 
          ? 'Outdoor air quality is too degraded for natural ventilation today. Keep windows sealed.'
          : 'Brief mid-afternoon ventilation recommended when boundary layer is highest.',
        reason: 'Diurnal solar heating promotes vertical air mixing and slight dispersion of surface smog.',
      }
    ];
  }

  // Find 3 distinct daytime/evening blocks: Morning (8-11), Afternoon (13-16), Evening (18-22)
  const blocks = [
    { start: 8, end: 11, label: 'Morning Rush' },
    { start: 13, end: 16, label: 'Mid-Afternoon' },
    { start: 18, end: 22, label: 'Evening' },
  ];

  return blocks.map(b => {
    const hours = hourlyForecast.filter(h => h.hour >= b.start && h.hour <= b.end);
    const avgAqi = hours.length > 0
      ? Math.round(hours.reduce((acc, curr) => acc + curr.aqi, 0) / hours.length)
      : aqi;

    const isSafe = avgAqi <= 100;
    const isMarginal = avgAqi > 100 && avgAqi <= 150;

    let advisory = '';
    let reason = '';

    if (isSafe) {
      advisory = `Safe to open windows for 20-30 minutes of natural cross-ventilation.`;
      reason = `Average AQI of ${avgAqi} is within safe standards; clears indoor CO2 and moisture.`;
    } else if (isMarginal) {
      advisory = `Marginal: limit window opening to 5-10 minutes if indoor air feels stuffy, then seal and filter.`;
      reason = `AQI of ${avgAqi} indicates mild particulate infiltration risk for sensitive members.`;
    } else {
      advisory = `Strictly DO NOT open windows. Keep home envelope sealed.`;
      reason = `Outdoor AQI of ${avgAqi} will severely degrade indoor air and overwhelm purifiers.`;
    }

    return {
      startHour: `${b.start.toString().padStart(2, '0')}:00`,
      endHour: `${b.end.toString().padStart(2, '0')}:00`,
      avgAqi,
      recommended: isSafe,
      advisory,
      reason,
    };
  });
}
