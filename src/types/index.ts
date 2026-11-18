// ==========================================
// AIRWISE AI - CORE DOMAIN TYPES
// ==========================================

export type AQIStandard = 'US_AQI' | 'EAQI' | 'IN_CPCB_AQI';

export type AQICategory = 
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous';

export interface PollutantValues {
  pm2_5: number | null;
  pm10: number | null;
  no2: number | null;
  so2: number | null;
  o3: number | null;
  co: number | null;
}

export interface WeatherValues {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface HourlyForecastItem {
  time: string;
  hour: number;
  aqi: number;
  pm2_5: number;
  pm10: number;
  temperature: number;
  windSpeed: number;
}

export interface DailyForecastItem {
  date: string;
  avgAqi: number;
  maxAqi: number;
  category: AQICategory;
  dominantPollutant: string;
}

export interface AirQualityData {
  aqi: number;
  standard: AQIStandard;
  standardLabel: string;
  category: AQICategory;
  color: string;
  dominantPollutant: string;
  pollutants: PollutantValues;
  weather: WeatherValues;
  hourlyForecast: HourlyForecastItem[];
  dailyForecast: DailyForecastItem[];
  source: string;
  timestamp: string;
  isSimulated: boolean;
  isForecast: boolean;
  healthPrecautions: string[];
  sensitiveGroupsWarning: string[];
}

export interface LocationOption {
  id: string;
  city: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  isDemo?: boolean;
}

export type AgeGroup = 'infant' | 'child' | 'adult' | 'elderly';

export interface FamilyMember {
  id: string;
  name: string;
  ageGroup: AgeGroup;
  hasRespiratoryCondition: boolean;
  isPregnant: boolean;
}

export type CommuteMode =
  | 'car_petrol'
  | 'car_diesel'
  | 'car_ev'
  | 'carpool'
  | 'bus'
  | 'train_metro'
  | 'bicycle'
  | 'walking'
  | 'remote_work';

export type BudgetLevel = 'low' | 'moderate' | 'high';

export type HomeType = 'apartment' | 'detached_house' | 'high_rise' | 'shared';

export type WorkSchedule = 'fixed_office' | 'hybrid' | 'remote' | 'outdoor';

export type OutdoorPreference = 'morning_runs' | 'evening_walks' | 'weekend_sports' | 'minimal';

export interface UserProfile {
  location: LocationOption;
  familySize: number;
  familyMembers: FamilyMember[];
  workSchedule: WorkSchedule;
  dailyCommuteDistanceKm: number;
  primaryCommuteMode: CommuteMode;
  outdoorActivityPreference: OutdoorPreference;
  budget: BudgetLevel;
  homeType: HomeType;
  hasAirPurifier: boolean;
  hasKitchenExhaust: boolean;
  isOnboarded: boolean;
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export type RecommendationCategory =
  | 'outdoor_activity'
  | 'commute'
  | 'indoor_ventilation'
  | 'health_protection'
  | 'energy_conservation';

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'info';

export interface RoutineRecommendation {
  id: string;
  timeOfDay: TimeOfDay;
  title: string;
  suggestedAction: string;
  reason: string;
  pollutionConsideration: string;
  personalBenefit: string;
  environmentalBenefit?: string;
  estimatedImpact: string;
  assumptions: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  completed: boolean;
  isIndoorAlternative: boolean;
}

export interface DailyRoutinePlan {
  date: string;
  summary: string;
  overallExposureRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  morning: RoutineRecommendation[];
  afternoon: RoutineRecommendation[];
  evening: RoutineRecommendation[];
}

export interface VentilationWindow {
  startHour: string;
  endHour: string;
  avgAqi: number;
  recommended: boolean;
  advisory: string;
  reason: string;
}

export interface IndoorHack {
  id: string;
  title: string;
  category: 'ventilation' | 'filtration' | 'cooking' | 'dust_cleaning' | 'source_control';
  costLevel: 'free' | 'low_cost' | 'investment';
  costEstimate: string;
  efficacy: string;
  steps: string[];
  scientificRationale: string;
  importantWarning: string;
  appliesToBudget: BudgetLevel[];
  tag: string;
}

export interface SustainableAlternative {
  id: string;
  category: 'transport' | 'household_energy' | 'waste_management' | 'daily_habits';
  title: string;
  currentHabit: string;
  alternativeAction: string;
  co2ReductionKgPerTrip: number;
  exposureImpact: string;
  safetyPrecondition: string;
  isSafeToday: boolean;
  costComparison: string;
  practicalTip: string;
}

export interface ActivityLogEntry {
  id: string;
  date: string;
  category: 'transport' | 'indoor_action' | 'energy_habit' | 'routine_completion';
  title: string;
  avoidedCo2Kg: number;
  exposureAvoidedScore: number;
  formula: string;
  assumptions: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isFallback?: boolean;
  suggestedFollowUps?: string[];
}
