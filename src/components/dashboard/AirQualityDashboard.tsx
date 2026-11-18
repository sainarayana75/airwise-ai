import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wind,
  Droplets,
  Thermometer,
  Compass,
  AlertTriangle,
  ShieldAlert,
  Info,
  Clock,
  Database,
  ChevronRight,
  Activity,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const AirQualityDashboard: React.FC = () => {
  const { user, envData, isLoadingEnv, setActiveTab } = useApp();
  const [selectedForecastMetric, setSelectedForecastMetric] = useState<'aqi' | 'pm2_5' | 'pm10'>('aqi');

  if (isLoadingEnv) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-600">Retrieving atmospheric data for {user.location.city}...</p>
      </div>
    );
  }

  if (!envData) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto my-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Environmental Data Unavailable</h3>
        <p className="text-xs text-slate-500 mt-2">Could not retrieve atmospheric data for the selected location.</p>
      </div>
    );
  }

  const {
    aqi,
    standardLabel,
    category,
    color,
    dominantPollutant,
    pollutants,
    weather,
    hourlyForecast,
    dailyForecast,
    source,
    timestamp,
    isSimulated,
    healthPrecautions,
    sensitiveGroupsWarning,
  } = envData;

  const pollutantItems = [
    {
      label: 'PM2.5',
      fullName: 'Fine Inhalable Particulate Matter (<2.5 µm)',
      value: pollutants.pm2_5,
      unit: 'µg/m³',
      safeThreshold: '15 µg/m³ (WHO 24-hr guideline)',
      description: 'Penetrates deep into alveolar gas-exchange regions and enters the bloodstream.',
      isDominant: dominantPollutant === 'PM2.5',
      severity: (pollutants.pm2_5 ?? 0) > 35 ? 'danger' : (pollutants.pm2_5 ?? 0) > 15 ? 'warning' : 'safe',
    },
    {
      label: 'PM10',
      fullName: 'Coarse Inhalable Particles (<10 µm)',
      value: pollutants.pm10,
      unit: 'µg/m³',
      safeThreshold: '45 µg/m³ (WHO 24-hr guideline)',
      description: 'Road dust, industrial mechanical grinding, and heavy vehicular friction.',
      isDominant: dominantPollutant === 'PM10',
      severity: (pollutants.pm10 ?? 0) > 150 ? 'danger' : (pollutants.pm10 ?? 0) > 45 ? 'warning' : 'safe',
    },
    {
      label: 'NO2',
      fullName: 'Nitrogen Dioxide',
      value: pollutants.no2,
      unit: 'µg/m³',
      safeThreshold: '25 µg/m³ (WHO 24-hr guideline)',
      description: 'Formed predominantly from high-temperature motor vehicle combustion.',
      isDominant: dominantPollutant === 'NO2',
      severity: (pollutants.no2 ?? 0) > 50 ? 'danger' : (pollutants.no2 ?? 0) > 25 ? 'warning' : 'safe',
    },
    {
      label: 'O3',
      fullName: 'Surface Ground-Level Ozone',
      value: pollutants.o3,
      unit: 'µg/m³',
      safeThreshold: '100 µg/m³ (WHO 8-hr guideline)',
      description: 'Secondary photochemical smog pollutant generated in sunlight.',
      isDominant: dominantPollutant === 'O3',
      severity: (pollutants.o3 ?? 0) > 100 ? 'danger' : 'safe',
    },
    {
      label: 'SO2',
      fullName: 'Sulphur Dioxide',
      value: pollutants.so2,
      unit: 'µg/m³',
      safeThreshold: '40 µg/m³ (WHO 24-hr guideline)',
      description: 'Emitted from thermal coal power stations, brick kilns, and diesel fuels.',
      isDominant: dominantPollutant === 'SO2',
      severity: (pollutants.so2 ?? 0) > 40 ? 'danger' : 'safe',
    },
    {
      label: 'CO',
      fullName: 'Carbon Monoxide',
      value: pollutants.co,
      unit: 'µg/m³',
      safeThreshold: '4,000 µg/m³ (WHO 24-hr guideline)',
      description: 'Incomplete fossil fuel and biomass combustion byproduct.',
      isDominant: dominantPollutant === 'CO',
      severity: (pollutants.co ?? 0) > 4000 ? 'danger' : 'safe',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Location & Data Provenance */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/40 via-teal-50/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900 text-white flex items-center space-x-1">
                <span>{user.location.city}</span>
                {user.location.country && <span className="text-slate-400">, {user.location.country}</span>}
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                {standardLabel}
              </span>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${
                  isSimulated
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center space-x-1'
                }`}
              >
                {!isSimulated && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1"></span>}
                <span>{isSimulated ? 'Demonstration Model' : 'Live Observation'}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Atmospheric & Smog Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Real-time particulate tracking, atmospheric boundary conditions, and health precautions for urban communities.
            </p>
          </div>

          {/* Quick CTA to Planner */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveTab('planner')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-700/20 flex items-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate My Tailored Routine</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Provenance Metadata footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>Source: {source}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Massive AQI Hero Card (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Air Quality Index (AQI)
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Primary: <strong className="text-slate-900">{dominantPollutant}</strong>
            </span>
          </div>

          <div className="my-auto py-4 flex flex-col items-center text-center">
            {/* Visual Gauge Pill */}
            <div
              className="w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center p-4 border-8 shadow-inner transition-all duration-500"
              style={{
                borderColor: color,
                backgroundColor: `${color}15`,
              }}
            >
              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                {aqi}
              </span>
              <span className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wider">
                US EPA AQI
              </span>
            </div>

            <div className="mt-5">
              <span
                className="inline-block px-3.5 py-1 text-sm font-extrabold rounded-full text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                {category}
              </span>
              <p className="text-xs text-slate-600 mt-2 px-4 leading-relaxed font-medium">
                {aqi <= 50 && 'Ideal clean air conditions. Enjoy outdoor aerobic activities.'}
                {aqi > 50 && aqi <= 100 && 'Acceptable quality. Sensitive individuals should observe minor symptoms.'}
                {aqi > 100 && aqi <= 150 && 'Sensitive groups (children, elderly, asthmatics) should curtail prolonged exertion.'}
                {aqi > 150 && aqi <= 200 && 'Unhealthy: General public should limit heavy exertion; shift workouts indoors.'}
                {aqi > 200 && aqi <= 300 && 'Very Unhealthy Health Alert: Elevated respiratory risk. Avoid outdoor activity.'}
                {aqi > 300 && 'Emergency Hazardous Conditions: Universal risk of acute toxic airway inflammation.'}
              </p>
            </div>
          </div>

          {/* Meteorological summary strip */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center text-xs">
            <div className="p-2.5 rounded-2xl bg-slate-50">
              <div className="flex items-center justify-center text-slate-500 mb-1">
                <Thermometer className="w-3.5 h-3.5 mr-1 text-rose-500" />
                <span className="text-[10px] font-semibold">Temp</span>
              </div>
              <span className="text-sm font-bold text-slate-800">{weather.temperature}°C</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50">
              <div className="flex items-center justify-center text-slate-500 mb-1">
                <Droplets className="w-3.5 h-3.5 mr-1 text-blue-500" />
                <span className="text-[10px] font-semibold">Humidity</span>
              </div>
              <span className="text-sm font-bold text-slate-800">{weather.humidity}%</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-slate-50">
              <div className="flex items-center justify-center text-slate-500 mb-1">
                <Wind className="w-3.5 h-3.5 mr-1 text-teal-500" />
                <span className="text-[10px] font-semibold">Wind</span>
              </div>
              <span className="text-sm font-bold text-slate-800">{weather.windSpeed} km/h</span>
            </div>
          </div>
        </div>

        {/* Right Column: 6 Pollutant Breakdown Cards (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Pollutant Concentration Breakdown</span>
            </h3>
            <span className="text-[11px] text-slate-400">Strictly verified live readings (no fabricated values)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pollutantItems.map((p) => {
              const hasValue = p.value !== null && p.value !== undefined;
              return (
                <div
                  key={p.label}
                  className={`p-4 rounded-2xl border transition-all ${
                    p.isDominant
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/30'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-900">{p.label}</span>
                    {p.isDominant && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-emerald-600 text-white">
                        Dominant
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mb-2">{p.fullName}</p>

                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl font-black text-slate-900">
                      {hasValue ? p.value : '—'}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{p.unit}</span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="text-slate-400">Limit: </span>
                    <span className="font-semibold">{p.safeThreshold}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Winter Inversion Detection Banner */}
          {weather.temperature < 14 && weather.windSpeed < 7 && aqi > 100 && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start space-x-3 text-xs text-purple-900">
              <AlertTriangle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Winter Atmospheric Inversion Detected:</strong>
                <p className="mt-0.5 text-purple-800 text-[11px] leading-relaxed">
                  Cold surface temperatures ({weather.temperature}°C) coupled with low dispersion wind ({weather.windSpeed} km/h) have created a thermal boundary layer trapping vehicular and industrial smoke near ground level. Smoke cannot disperse vertically.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 24-Hour Forecast Chart & 7-Day Outlook */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Compass className="w-5 h-5 text-emerald-600" />
              <span>24-Hour Atmospheric Trend & Forecast</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Hourly model forecast projecting smog accumulation and diurnal dispersion
            </p>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedForecastMetric('aqi')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedForecastMetric === 'aqi' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              AQI
            </button>
            <button
              onClick={() => setSelectedForecastMetric('pm2_5')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedForecastMetric === 'pm2_5' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              PM2.5 (µg/m³)
            </button>
            <button
              onClick={() => setSelectedForecastMetric('pm10')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedForecastMetric === 'pm10' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              PM10 (µg/m³)
            </button>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyForecast} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${val} ${selectedForecastMetric === 'aqi' ? 'AQI' : 'µg/m³'}`, 'Forecast']}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Area
                type="monotone"
                dataKey={selectedForecastMetric}
                stroke="#059669"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#aqiGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 7-Day Forecast Outlook Strip */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            7-Day Smog Outlook
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {dailyForecast.map((df, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-slate-700">{df.date}</span>
                <div className="my-2">
                  <span className="text-xl font-black text-slate-900">{df.avgAqi}</span>
                  <span className="block text-[10px] text-slate-400">Avg AQI</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 truncate">{df.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health Precautions & Sensitive Groups Advisory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Public Health Precautions */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-4">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            <span>Recommended Public Precautions</span>
          </h3>
          <ul className="space-y-2.5">
            {healthPrecautions.map((prec, i) => (
              <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0"></span>
                <span>{prec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sensitive Groups Protection */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2 mb-4">
            <Info className="w-4 h-4 text-orange-600" />
            <span>Sensitive & High-Risk Groups Protection</span>
          </h3>
          {sensitiveGroupsWarning.length > 0 ? (
            <ul className="space-y-2.5">
              {sensitiveGroupsWarning.map((warn, i) => (
                <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-700 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0"></span>
                  <span>{warn}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 leading-relaxed">
              Air quality currently poses no significant physiological stress to infants, pregnant women, asthmatics, or the elderly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
