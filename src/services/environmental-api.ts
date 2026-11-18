// ==============================================================
// ENVIRONMENTAL DATA SERVICE (OPEN-METEO INTEGRATION)
// Real-world, free, high-resolution Air Quality & Weather APIs
// ==============================================================

import { AirQualityData, DailyForecastItem, HourlyForecastItem, LocationOption, PollutantValues, WeatherValues } from '../types';
import { calculateOverallAQI, getAQICategory } from '../utils/aqi-calculator';

// Well-known locations for quick selection and offline demonstration
export const PRESET_LOCATIONS: LocationOption[] = [
  {
    id: 'delhi',
    city: 'New Delhi',
    country: 'India',
    admin1: 'Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    timezone: 'Asia/Kolkata',
  },
  {
    id: 'lahore',
    city: 'Lahore',
    country: 'Pakistan',
    admin1: 'Punjab',
    latitude: 31.5204,
    longitude: 74.3587,
    timezone: 'Asia/Karachi',
  },
  {
    id: 'beijing',
    city: 'Beijing',
    country: 'China',
    admin1: 'Beijing',
    latitude: 39.9042,
    longitude: 116.4074,
    timezone: 'Asia/Shanghai',
  },
  {
    id: 'london',
    city: 'London',
    country: 'United Kingdom',
    admin1: 'England',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
  },
  {
    id: 'los-angeles',
    city: 'Los Angeles',
    country: 'United States',
    admin1: 'California',
    latitude: 34.0522,
    longitude: -118.2437,
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'salt-lake-city',
    city: 'Salt Lake City',
    country: 'United States',
    admin1: 'Utah',
    latitude: 40.7608,
    longitude: -111.8910,
    timezone: 'America/Denver',
  },
  {
    id: 'mumbai',
    city: 'Mumbai',
    country: 'India',
    admin1: 'Maharashtra',
    latitude: 19.0760,
    longitude: 72.8777,
    timezone: 'Asia/Kolkata',
  },
];

/**
 * Interpret WMO weather codes into human-readable descriptions
 */
export function interpretWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1 || code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Smog / Inversion Fog';
  if (code >= 51 && code <= 55) return 'Light drizzle';
  if (code >= 61 && code <= 65) return 'Rain showers';
  if (code >= 71 && code <= 77) return 'Snowfall';
  if (code >= 80 && code <= 82) return 'Heavy showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy / Smoggy';
}

/**
 * Search locations using Open-Meteo Geocoding API
 */
export async function searchLocations(query: string): Promise<LocationOption[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=6&language=en&format=json`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`Geocoding HTTP error: ${res.status}`);
    
    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((r: any) => ({
      id: `${r.id || r.name}-${r.latitude}-${r.longitude}`,
      city: r.name,
      country: r.country || '',
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone || 'UTC',
      isDemo: false,
    }));
  } catch (error) {
    console.warn('Geocoding search failed, falling back to matching preset locations:', error);
    return PRESET_LOCATIONS.filter(p => 
      p.city.toLowerCase().includes(trimmed.toLowerCase()) || 
      p.country.toLowerCase().includes(trimmed.toLowerCase())
    );
  }
}

/**
 * Fetch verified real-time air quality and weather data
 */
export async function fetchEnvironmentalData(location: LocationOption): Promise<AirQualityData> {
  const { latitude, longitude } = location;

  try {
    // Concurrent fetch for both Air Quality and Weather
    const [aqResponse, weatherResponse] = await Promise.all([
      fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi,european_aqi&hourly=pm10,pm2_5,us_aqi,european_aqi,nitrogen_dioxide,ozone&forecast_days=7&timezone=auto`,
        { headers: { 'Accept': 'application/json' } }
      ),
      fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,wind_speed_10m&forecast_days=7&timezone=auto`,
        { headers: { 'Accept': 'application/json' } }
      ),
    ]);

    if (!aqResponse.ok || !weatherResponse.ok) {
      throw new Error(`API fetch status error: AQ=${aqResponse.status}, Weather=${weatherResponse.status}`);
    }

    const aqJson = await aqResponse.json();
    const weatherJson = await weatherResponse.json();

    const currentAQ = aqJson.current || {};
    const currentWeather = weatherJson.current || {};

    const pollutants: PollutantValues = {
      pm2_5: currentAQ.pm2_5 !== undefined && currentAQ.pm2_5 !== null ? Number(currentAQ.pm2_5.toFixed(1)) : null,
      pm10: currentAQ.pm10 !== undefined && currentAQ.pm10 !== null ? Number(currentAQ.pm10.toFixed(1)) : null,
      no2: currentAQ.nitrogen_dioxide !== undefined && currentAQ.nitrogen_dioxide !== null ? Number(currentAQ.nitrogen_dioxide.toFixed(1)) : null,
      so2: currentAQ.sulphur_dioxide !== undefined && currentAQ.sulphur_dioxide !== null ? Number(currentAQ.sulphur_dioxide.toFixed(1)) : null,
      o3: currentAQ.ozone !== undefined && currentAQ.ozone !== null ? Number(currentAQ.ozone.toFixed(1)) : null,
      co: currentAQ.carbon_monoxide !== undefined && currentAQ.carbon_monoxide !== null ? Number(currentAQ.carbon_monoxide.toFixed(1)) : null,
    };

    const weather: WeatherValues = {
      temperature: currentWeather.temperature_2m !== undefined ? Math.round(currentWeather.temperature_2m) : 20,
      humidity: currentWeather.relative_humidity_2m !== undefined ? Math.round(currentWeather.relative_humidity_2m) : 50,
      windSpeed: currentWeather.wind_speed_10m !== undefined ? Math.round(currentWeather.wind_speed_10m) : 5,
      windDirection: currentWeather.wind_direction_10m !== undefined ? Math.round(currentWeather.wind_direction_10m) : 0,
      weatherCode: currentWeather.weather_code !== undefined ? currentWeather.weather_code : 0,
      weatherDescription: interpretWeatherCode(currentWeather.weather_code || 0),
    };

    // Calculate AQI strictly using the official US EPA standard
    let computedAQI = currentAQ.us_aqi;
    let dominant = 'PM2.5';

    if (computedAQI === undefined || computedAQI === null) {
      const calculated = calculateOverallAQI(pollutants);
      computedAQI = calculated.aqi;
      dominant = calculated.dominantPollutant;
    } else {
      if (pollutants.pm10 && pollutants.pm2_5 && pollutants.pm10 > (pollutants.pm2_5 * 2.5)) {
        dominant = 'PM10';
      }
    }

    const { category, color } = getAQICategory(computedAQI, 'US_AQI');

    // Parse hourly forecast (next 24 hours)
    const hourlyForecast: HourlyForecastItem[] = [];
    const hourlyAQ = aqJson.hourly || {};
    const hourlyWeather = weatherJson.hourly || {};

    if (hourlyAQ.time && Array.isArray(hourlyAQ.time)) {
      for (let i = 0; i < Math.min(24, hourlyAQ.time.length); i++) {
        const timeStr = hourlyAQ.time[i];
        const dateObj = new Date(timeStr);
        const itemHour = dateObj.getHours();

        const hourUsAqi = hourlyAQ.us_aqi ? hourlyAQ.us_aqi[i] : null;
        const hourPm25 = hourlyAQ.pm2_5 ? hourlyAQ.pm2_5[i] : 0;
        const hourPm10 = hourlyAQ.pm10 ? hourlyAQ.pm10[i] : 0;
        const hourTemp = hourlyWeather.temperature_2m ? hourlyWeather.temperature_2m[i] : weather.temperature;
        const hourWind = hourlyWeather.wind_speed_10m ? hourlyWeather.wind_speed_10m[i] : weather.windSpeed;

        hourlyForecast.push({
          time: `${itemHour.toString().padStart(2, '0')}:00`,
          hour: itemHour,
          aqi: hourUsAqi !== null && hourUsAqi !== undefined ? Math.round(hourUsAqi) : Math.round(hourPm25 * 3),
          pm2_5: Math.round(hourPm25),
          pm10: Math.round(hourPm10),
          temperature: Math.round(hourTemp),
          windSpeed: Math.round(hourWind),
        });
      }
    }

    // Parse 7-day daily forecast
    const dailyForecast: DailyForecastItem[] = [];
    for (let day = 0; day < 7; day++) {
      const startIndex = day * 24;
      const endIndex = startIndex + 24;
      if (hourlyAQ.us_aqi && hourlyAQ.us_aqi.length >= endIndex) {
        const dayAqiSlice = hourlyAQ.us_aqi.slice(startIndex, endIndex).filter((v: any) => typeof v === 'number');
        if (dayAqiSlice.length > 0) {
          const avgAqi = Math.round(dayAqiSlice.reduce((a: number, b: number) => a + b, 0) / dayAqiSlice.length);
          const maxAqi = Math.round(Math.max(...dayAqiSlice));
          const dateLabel = new Date(Date.now() + day * 86400000).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const catInfo = getAQICategory(avgAqi, 'US_AQI');
          dailyForecast.push({
            date: day === 0 ? 'Today' : day === 1 ? 'Tomorrow' : dateLabel,
            avgAqi,
            maxAqi,
            category: catInfo.category,
            dominantPollutant: 'PM2.5',
          });
        }
      }
    }

    // Generate actionable health precautions
    const healthPrecautions = generateHealthPrecautions(computedAQI, pollutants, weather);
    const sensitiveGroupsWarning = generateSensitiveWarnings(computedAQI);

    return {
      aqi: computedAQI,
      standard: 'US_AQI',
      standardLabel: 'US EPA AQI Standard (0-500)',
      category,
      color,
      dominantPollutant: dominant,
      pollutants,
      weather,
      hourlyForecast,
      dailyForecast,
      source: 'Open-Meteo Air Quality & Weather API (Copernicus CAMS & GFS)',
      timestamp: new Date().toISOString(),
      isSimulated: false,
      isForecast: false,
      healthPrecautions,
      sensitiveGroupsWarning,
    };
  } catch (error) {
    console.warn(`Falling back to verified simulation data for ${location.city}:`, error);
    return getDemonstrationEnvironmentalData(location);
  }
}

/**
 * Health precautions based on EPA AQI bands
 */
export function generateHealthPrecautions(aqi: number, pollutants: PollutantValues, weather: WeatherValues): string[] {
  const precautions: string[] = [];

  if (aqi <= 50) {
    precautions.push('Air quality is ideal for all outdoor sports, jogging, and active recreation.');
    precautions.push('Natural ventilation is recommended; open windows to freshen indoor air.');
  } else if (aqi <= 100) {
    precautions.push('Unusually sensitive individuals should consider reducing prolonged or heavy outdoor exertion.');
    precautions.push('Good conditions for most daily commutes and outdoor school activities.');
  } else if (aqi <= 150) {
    precautions.push('Sensitive groups (children, pregnant women, elderly, asthmatics) should limit prolonged outdoor exertion.');
    precautions.push('Keep windows closed during peak morning traffic hours (7 AM - 10 AM).');
    precautions.push('Consider wearing an N95/FFP2 respirator if walking or cycling near congested roadways.');
  } else if (aqi <= 200) {
    precautions.push('Everyone should reduce prolonged or heavy outdoor exertion; take frequent breaks indoors.');
    precautions.push('Sensitive groups should avoid outdoor activities and remain in filtered indoor spaces.');
    precautions.push('Wear a certified N95 / KN95 mask if outdoor travel is unavoidable.');
    precautions.push('Run indoor HEPA air purifiers continuously on medium/high speed.');
  } else if (aqi <= 300) {
    precautions.push('HEALTH ALERT: Avoid all non-essential outdoor physical activity.');
    precautions.push('Keep all windows and exterior doors tightly sealed to prevent outdoor smog infiltration.');
    precautions.push('N95 or FFP2 respirators are mandatory for any outdoor exposure.');
    precautions.push('Vulnerable family members should stay in a dedicated clean-air room with HEPA filtration.');
  } else {
    precautions.push('EMERGENCY HAZARD: Remain indoors in a sealed clean-air zone with active air filtration.');
    precautions.push('Do not perform any strenuous physical activities indoors or outdoors.');
    precautions.push('Avoid opening exterior doors unless absolutely essential.');
    precautions.push('Avoid indoor combustion: no frying, gas baking, candles, or incense.');
  }

  if (weather.temperature < 10 && weather.windSpeed < 7 && aqi > 100) {
    precautions.push('Winter thermal inversion detected: cold stagnant air is trapping surface emissions.');
  }

  if (pollutants.pm2_5 && pollutants.pm2_5 > 150) {
    precautions.push(`Extreme fine particulate density (${pollutants.pm2_5} µg/m³ PM2.5): N95 filtration mandatory outdoors.`);
  }

  return precautions;
}

/**
 * Sensitive groups warnings based on EPA AQI
 */
export function generateSensitiveWarnings(aqi: number): string[] {
  if (aqi <= 50) return [];
  if (aqi <= 100) {
    return ['People with existing chronic respiratory illnesses (asthma, COPD) should monitor mild breathing changes.'];
  }
  if (aqi <= 150) {
    return [
      'Children and infants: developing lungs are more susceptible to fine particulate infiltration.',
      'Asthma patients: keep rescue inhalers accessible at all times.',
      'Elderly individuals: avoid strenuous outdoor gardening or long walks.',
    ];
  }
  return [
    'Pregnant women: elevated particulate exposure is linked to maternal and fetal stress.',
    'Children: outdoor sports and PE activities should be moved indoors.',
    'Elderly & cardiac patients: heightened risk of acute cardiovascular and respiratory stress.',
    'Respiratory patients: use prescribed preventative inhalers and maintain clean indoor room air.',
  ];
}

/**
 * Fallback simulation data clearly marked as demonstration data when APIs are unreachable
 */
export function getDemonstrationEnvironmentalData(location: LocationOption): AirQualityData {
  // Use representative seasonal smog characteristics for cities like Delhi/Lahore
  const isSmogProne = ['delhi', 'lahore', 'beijing'].some(k => location.city.toLowerCase().includes(k));
  const demoAqi = isSmogProne ? 285 : 78;
  const pm25 = isSmogProne ? 195.4 : 24.8;
  const pm10 = isSmogProne ? 310.2 : 45.1;

  const { category, color } = getAQICategory(demoAqi, 'US_AQI');

  const pollutants: PollutantValues = {
    pm2_5: pm25,
    pm10: pm10,
    no2: isSmogProne ? 68.4 : 18.2,
    so2: isSmogProne ? 22.1 : 4.5,
    o3: isSmogProne ? 45.0 : 52.0,
    co: isSmogProne ? 1820.0 : 420.0,
  };

  const weather: WeatherValues = {
    temperature: isSmogProne ? 16 : 21,
    humidity: isSmogProne ? 78 : 55,
    windSpeed: isSmogProne ? 4 : 12,
    windDirection: 310,
    weatherCode: isSmogProne ? 45 : 1,
    weatherDescription: isSmogProne ? 'Winter Smog / Inversion Fog' : 'Partly cloudy',
  };

  const hourlyForecast: HourlyForecastItem[] = [];
  for (let h = 0; h < 24; h++) {
    // Diurnal curve: smog spikes at 8-10 AM and 8-11 PM, dips slightly in afternoon 2-4 PM
    const diurnalFactor = Math.sin((h - 8) / 3.8);
    const hourAqi = Math.max(30, Math.round(demoAqi + diurnalFactor * 45));
    hourlyForecast.push({
      time: `${h.toString().padStart(2, '0')}:00`,
      hour: h,
      aqi: hourAqi,
      pm2_5: Math.round(hourAqi * 0.7),
      pm10: Math.round(hourAqi * 1.1),
      temperature: Math.round(weather.temperature + Math.sin((h - 6) / 4) * 4),
      windSpeed: Math.max(2, Math.round(weather.windSpeed + Math.cos(h / 3) * 2)),
    });
  }

  const dailyForecast: DailyForecastItem[] = [
    { date: 'Today', avgAqi: demoAqi, maxAqi: demoAqi + 30, category, dominantPollutant: 'PM2.5' },
    { date: 'Tomorrow', avgAqi: Math.round(demoAqi * 0.95), maxAqi: demoAqi + 20, category, dominantPollutant: 'PM2.5' },
    { date: 'Day 3', avgAqi: Math.round(demoAqi * 0.88), maxAqi: demoAqi + 10, category, dominantPollutant: 'PM2.5' },
    { date: 'Day 4', avgAqi: Math.round(demoAqi * 0.82), maxAqi: demoAqi, category, dominantPollutant: 'PM2.5' },
    { date: 'Day 5', avgAqi: Math.round(demoAqi * 0.9), maxAqi: demoAqi + 15, category, dominantPollutant: 'PM2.5' },
    { date: 'Day 6', avgAqi: Math.round(demoAqi * 0.75), maxAqi: demoAqi - 10, category: 'Unhealthy for Sensitive Groups', dominantPollutant: 'PM2.5' },
    { date: 'Day 7', avgAqi: Math.round(demoAqi * 0.7), maxAqi: demoAqi - 15, category: 'Moderate', dominantPollutant: 'PM2.5' },
  ];

  return {
    aqi: demoAqi,
    standard: 'US_AQI',
    standardLabel: 'US EPA AQI Standard (Demonstration Model)',
    category,
    color,
    dominantPollutant: 'PM2.5',
    pollutants,
    weather,
    hourlyForecast,
    dailyForecast,
    source: 'Demonstration Environmental Model (Offline Fallback)',
    timestamp: new Date().toISOString(),
    isSimulated: true,
    isForecast: false,
    healthPrecautions: generateHealthPrecautions(demoAqi, pollutants, weather),
    sensitiveGroupsWarning: generateSensitiveWarnings(demoAqi),
  };
}
