// ==============================================================
// GLOBAL APPLICATION STATE & CONTEXT
// Type-safe, reactive state synchronized with browser localStorage
// ==============================================================

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  ActivityLogEntry,
  AirQualityData,
  DailyRoutinePlan,
  LocationOption,
  UserProfile,
} from '../types';
import { fetchEnvironmentalData, PRESET_LOCATIONS } from '../services/environmental-api';
import { generateDailyPlan } from '../engine/decision-engine';

export type ActiveTab = 'dashboard' | 'planner' | 'indoor' | 'sustainability' | 'impact' | 'chat';

interface AppContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  updateLocation: (loc: LocationOption) => Promise<void>;
  envData: AirQualityData | null;
  isLoadingEnv: boolean;
  envError: string | null;
  refreshEnvironmentalData: () => Promise<void>;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  dailyPlan: DailyRoutinePlan | null;
  toggleRoutineCompletion: (id: string) => void;
  impactLogs: ActivityLogEntry[];
  logActivity: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  clearImpactLogs: () => void;
  isFirstVisit: boolean;
  setIsFirstVisit: (val: boolean) => void;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  location: PRESET_LOCATIONS[0], // New Delhi by default (representative of severe winter urban smog)
  familySize: 4,
  familyMembers: [
    { id: 'mem-1', name: 'Aarav', ageGroup: 'child', hasRespiratoryCondition: false, isPregnant: false },
    { id: 'mem-2', name: 'Priya', ageGroup: 'adult', hasRespiratoryCondition: false, isPregnant: false },
    { id: 'mem-3', name: 'Rahul', ageGroup: 'adult', hasRespiratoryCondition: false, isPregnant: false },
    { id: 'mem-4', name: 'Kavita', ageGroup: 'elderly', hasRespiratoryCondition: true, isPregnant: false },
  ],
  workSchedule: 'fixed_office',
  dailyCommuteDistanceKm: 14,
  primaryCommuteMode: 'car_petrol',
  outdoorActivityPreference: 'morning_runs',
  budget: 'moderate',
  homeType: 'apartment',
  hasAirPurifier: true,
  hasKitchenExhaust: true,
  isOnboarded: true,
};

const INITIAL_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-seed-1',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    category: 'transport',
    title: 'Metro transit instead of solo car commute (14 km)',
    avoidedCo2Kg: 2.2,
    exposureAvoidedScore: 8,
    formula: '14 km × (0.192 car - 0.035 metro) = 2.20 kg CO2',
    assumptions: 'EPA / DEFRA passenger rail emission factors.',
    timestamp: Date.now() - 2 * 86400000,
  },
  {
    id: 'log-seed-2',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    category: 'indoor_action',
    title: 'Pre-filtered bedroom & sealed window drafts during night smog',
    avoidedCo2Kg: 0,
    exposureAvoidedScore: 9,
    formula: 'HEPA filtration maintained clean-air zone (<12 µg/m³ PM2.5)',
    assumptions: 'Prevented acute overnight toxic particulate infiltration.',
    timestamp: Date.now() - 1 * 86400000,
  },
  {
    id: 'log-seed-3',
    date: new Date().toISOString().split('T')[0],
    category: 'energy_habit',
    title: 'Lowered home heating setpoint by 1°C & dressed warmly',
    avoidedCo2Kg: 1.1,
    exposureAvoidedScore: 4,
    formula: 'Avoided heating emissions through 1°C thermostat adjustment',
    assumptions: 'US DOE heating efficiency guidelines.',
    timestamp: Date.now(),
  },
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial user from localStorage or fallback to default
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('airwise_user_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved user profile from localStorage:', e);
    }
    return DEFAULT_USER_PROFILE;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [envData, setEnvData] = useState<AirQualityData | null>(null);
  const [isLoadingEnv, setIsLoadingEnv] = useState<boolean>(true);
  const [envError, setEnvError] = useState<string | null>(null);
  const [completedRoutineIds, setCompletedRoutineIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('airwise_completed_routines');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [impactLogs, setImpactLogs] = useState<ActivityLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('airwise_impact_logs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LOGS;
  });

  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
    return !localStorage.getItem('airwise_user_profile');
  });

  // Save user profile changes
  const updateUser = (updates: Partial<UserProfile>) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('airwise_user_profile', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save user profile:', e);
      }
      return updated;
    });
  };

  // Save completed routines
  const toggleRoutineCompletion = (recId: string) => {
    setCompletedRoutineIds(prev => {
      const next = prev.includes(recId) ? prev.filter(id => id !== recId) : [...prev, recId];
      try {
        localStorage.setItem('airwise_completed_routines', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Add impact log
  const logActivity = (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
    };
    setImpactLogs(prev => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem('airwise_impact_logs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearImpactLogs = () => {
    setImpactLogs([]);
    try {
      localStorage.removeItem('airwise_impact_logs');
    } catch {}
  };

  // Fetch environmental data
  const loadData = async (location: LocationOption) => {
    setIsLoadingEnv(true);
    setEnvError(null);
    try {
      const data = await fetchEnvironmentalData(location);
      setEnvData(data);
    } catch (err: any) {
      setEnvError(err?.message || 'Failed to fetch environmental data.');
    } finally {
      setIsLoadingEnv(false);
    }
  };

  const refreshEnvironmentalData = async () => {
    await loadData(user.location);
  };

  const updateLocation = async (loc: LocationOption) => {
    updateUser({ location: loc });
    await loadData(loc);
  };

  useEffect(() => {
    loadData(user.location);
  }, []);

  // Compute reactive daily routine plan based on user profile and live environmental data
  const dailyPlan = useMemo(() => {
    if (!envData) return null;
    const plan = generateDailyPlan(user, envData);
    
    // Merge completed status
    const updateItems = (items: typeof plan.morning) =>
      items.map(item => ({
        ...item,
        completed: completedRoutineIds.includes(item.id),
      }));

    return {
      ...plan,
      morning: updateItems(plan.morning),
      afternoon: updateItems(plan.afternoon),
      evening: updateItems(plan.evening),
    };
  }, [user, envData, completedRoutineIds]);

  return (
    <AppContext.Provider
      value={{
        user,
        updateUser,
        updateLocation,
        envData,
        isLoadingEnv,
        envError,
        refreshEnvironmentalData,
        activeTab,
        setActiveTab,
        dailyPlan,
        toggleRoutineCompletion,
        impactLogs,
        logActivity,
        clearImpactLogs,
        isFirstVisit,
        setIsFirstVisit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
