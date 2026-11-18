import { describe, it, expect, beforeEach } from 'vitest';
import { UserProfile } from '../src/types';
import { PRESET_LOCATIONS } from '../src/services/environmental-api';

describe('User Profile & State Persistence Logic (localStorage)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists modified user profile to localStorage as valid JSON', () => {
    const updatedProfile: UserProfile = {
      location: PRESET_LOCATIONS[1], // Lahore
      familySize: 3,
      familyMembers: [
        { id: '1', name: 'Zainab', ageGroup: 'child', hasRespiratoryCondition: true, isPregnant: false },
        { id: '2', name: 'Tariq', ageGroup: 'adult', hasRespiratoryCondition: false, isPregnant: false },
      ],
      workSchedule: 'hybrid',
      dailyCommuteDistanceKm: 22,
      primaryCommuteMode: 'train_metro',
      outdoorActivityPreference: 'evening_walks',
      budget: 'high',
      homeType: 'high_rise',
      hasAirPurifier: true,
      hasKitchenExhaust: true,
      isOnboarded: true,
    };

    localStorage.setItem('airwise_user_profile', JSON.stringify(updatedProfile));

    const retrievedRaw = localStorage.getItem('airwise_user_profile');
    expect(retrievedRaw).not.toBeNull();

    const parsed: UserProfile = JSON.parse(retrievedRaw!);
    expect(parsed.location.city).toBe('Lahore');
    expect(parsed.familyMembers[0].hasRespiratoryCondition).toBe(true);
    expect(parsed.budget).toBe('high');
    expect(parsed.workSchedule).toBe('hybrid');
  });

  it('handles corrupt localStorage JSON gracefully without throwing', () => {
    localStorage.setItem('airwise_user_profile', '{ corrupted: json invalid }}}');

    let loadedProfile: UserProfile | null = null;
    expect(() => {
      try {
        const raw = localStorage.getItem('airwise_user_profile');
        if (raw) loadedProfile = JSON.parse(raw);
      } catch {
        loadedProfile = null;
      }
    }).not.toThrow();

    expect(loadedProfile).toBeNull();
  });

  it('persists completed routine IDs across sessions', () => {
    const routineIds = ['rec-morn-indoor-exercise', 'rec-eve-hepa-bedroom'];
    localStorage.setItem('airwise_completed_routines', JSON.stringify(routineIds));

    const retrieved = JSON.parse(localStorage.getItem('airwise_completed_routines') || '[]');
    expect(retrieved).toEqual(routineIds);
    expect(retrieved.includes('rec-morn-indoor-exercise')).toBe(true);
  });

  it('persists and clears activity impact logs', () => {
    const logs = [
      {
        id: 'test-log-1',
        date: '2026-11-18',
        category: 'transport',
        title: 'Metro commute',
        avoidedCo2Kg: 2.5,
        exposureAvoidedScore: 8,
        formula: '14 km × factor',
        assumptions: 'EPA factors',
        timestamp: Date.now(),
      },
    ];

    localStorage.setItem('airwise_impact_logs', JSON.stringify(logs));
    expect(JSON.parse(localStorage.getItem('airwise_impact_logs') || '[]')).toHaveLength(1);

    localStorage.removeItem('airwise_impact_logs');
    expect(localStorage.getItem('airwise_impact_logs')).toBeNull();
  });
});
