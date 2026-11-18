import { describe, it, expect } from 'vitest';
import {
  calculateCommuteEmissions,
  EMISSION_FACTORS_KG_PER_KM,
  PRESET_HOUSEHOLD_IMPACTS,
} from '../src/utils/emission-calculator';

describe('Emission Calculator & Carbon Modeling', () => {
  it('correctly calculates avoided emissions when switching from solo petrol car to public bus', () => {
    const distanceKm = 20;
    const result = calculateCommuteEmissions(distanceKm, 'bus', 'car_petrol');

    // Expected:
    // Car petrol = 20 * 0.192 = 3.84 kg
    // Bus = 20 * 0.089 = 1.78 kg
    // Avoided = 3.84 - 1.78 = 2.06 kg
    expect(result.baselineCo2Kg).toBe(3.84);
    expect(result.actualCo2Kg).toBe(1.78);
    expect(result.avoidedCo2Kg).toBe(2.06);
    expect(result.percentageReduced).toBe(54);
    expect(result.formula).toContain('Avoided Emissions = Distance (20 km)');
  });

  it('correctly calculates avoided emissions when switching to electric rail / metro', () => {
    const distanceKm = 15;
    const result = calculateCommuteEmissions(distanceKm, 'train_metro', 'car_petrol');

    // Expected:
    // Car petrol = 15 * 0.192 = 2.88 kg
    // Train = 15 * 0.035 = 0.525 -> 0.53 kg
    // Avoided = 2.88 - 0.53 = 2.35 kg
    expect(result.baselineCo2Kg).toBe(2.88);
    expect(result.avoidedCo2Kg).toBe(2.35);
    expect(result.percentageReduced).toBeGreaterThan(80);
  });

  it('handles zero or negative distance inputs gracefully', () => {
    const zeroResult = calculateCommuteEmissions(0, 'bus', 'car_petrol');
    expect(zeroResult.avoidedCo2Kg).toBe(0);
    expect(zeroResult.baselineCo2Kg).toBe(0);

    const negativeResult = calculateCommuteEmissions(-15, 'bus', 'car_petrol');
    expect(negativeResult.avoidedCo2Kg).toBe(0);
  });

  it('contains valid documented emission factors for all transport modes', () => {
    expect(EMISSION_FACTORS_KG_PER_KM.car_petrol).toBe(0.192);
    expect(EMISSION_FACTORS_KG_PER_KM.bus).toBe(0.089);
    expect(EMISSION_FACTORS_KG_PER_KM.train_metro).toBe(0.035);
    expect(EMISSION_FACTORS_KG_PER_KM.bicycle).toBe(0);
    expect(EMISSION_FACTORS_KG_PER_KM.walking).toBe(0);
  });

  it('verifies household energy action impacts', () => {
    expect(PRESET_HOUSEHOLD_IMPACTS.thermostat_optimized.avoidedCo2Kg).toBe(1.1);
    expect(PRESET_HOUSEHOLD_IMPACTS.prevented_waste_burning.avoidedCo2Kg).toBe(3.5);
    expect(PRESET_HOUSEHOLD_IMPACTS.prevented_waste_burning.exposureAvoidedScore).toBe(10);
  });
});
