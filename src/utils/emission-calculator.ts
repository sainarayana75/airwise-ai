// ==============================================================
// ENVIRONMENTAL EMISSION FACTORS & IMPACT CALCULATOR
// Complies with official DEFRA (UK) and US EPA GHG Emission Conversion Factors
// ==============================================================

import { CommuteMode } from '../types';

/**
 * Standard Well-to-Wheel / Operational GHG emission factors in kg CO2e per passenger-kilometer (pkm)
 * References:
 * - UK DEFRA GHG Conversion Factors for Company Reporting (2023)
 * - US EPA Center for Corporate Climate Leadership Emission Factors (2023)
 */
export const EMISSION_FACTORS_KG_PER_KM: Record<CommuteMode, number> = {
  car_petrol: 0.192,     // Average medium petrol/gasoline internal combustion passenger car
  car_diesel: 0.171,     // Average medium diesel passenger car
  car_ev: 0.053,         // Average electric vehicle (factoring global average grid generation mix)
  carpool: 0.096,        // 2-person carpool in standard passenger car (divided baseline)
  bus: 0.089,            // Average municipal transit bus per passenger-km
  train_metro: 0.035,    // Electric commuter rail / underground metro per passenger-km
  bicycle: 0.000,        // Zero tailpipe / direct emissions
  walking: 0.000,        // Zero tailpipe / direct emissions
  remote_work: 0.000,    // Zero commute emissions
};

export interface CommuteImpactResult {
  baselineCo2Kg: number;
  actualCo2Kg: number;
  avoidedCo2Kg: number;
  percentageReduced: number;
  formula: string;
  assumptions: string;
}

/**
 * Calculate avoided CO2 emissions for a commute trip compared to a solo petrol car baseline
 * Formula: Avoided Emissions = Distance × (Baseline Factor - Chosen Mode Factor)
 */
export function calculateCommuteEmissions(
  distanceKm: number,
  chosenMode: CommuteMode,
  baselineMode: CommuteMode = 'car_petrol'
): CommuteImpactResult {
  const safeDistance = Math.max(0, distanceKm);
  const baselineFactor = EMISSION_FACTORS_KG_PER_KM[baselineMode] ?? 0.192;
  const chosenFactor = EMISSION_FACTORS_KG_PER_KM[chosenMode] ?? 0;

  const baselineCo2Kg = Number((safeDistance * baselineFactor).toFixed(2));
  const actualCo2Kg = Number((safeDistance * chosenFactor).toFixed(2));
  const avoidedCo2Kg = Number(Math.max(0, baselineCo2Kg - actualCo2Kg).toFixed(2));
  const percentageReduced = baselineCo2Kg > 0 ? Math.round((avoidedCo2Kg / baselineCo2Kg) * 100) : 0;

  return {
    baselineCo2Kg,
    actualCo2Kg,
    avoidedCo2Kg,
    percentageReduced,
    formula: `Avoided Emissions = Distance (${safeDistance} km) × [Baseline (${baselineFactor} kg/km) - Alternative (${chosenFactor} kg/km)]`,
    assumptions: `Based on DEFRA / EPA passenger transport conversion factors. Assumes average vehicle occupancy and standard grid carbon intensity.`,
  };
}

/**
 * Household energy action emission savings (kg CO2e avoided)
 */
export interface HouseholdActionImpact {
  title: string;
  avoidedCo2Kg: number;
  exposureAvoidedScore: number;
  formula: string;
  assumptions: string;
}

export const PRESET_HOUSEHOLD_IMPACTS: Record<string, HouseholdActionImpact> = {
  hepa_air_purifier: {
    title: 'Operated HEPA Air Purifier in sealed room',
    avoidedCo2Kg: 0,
    exposureAvoidedScore: 9,
    formula: 'Personal exposure reduction: captures 99.97% of PM2.5 particulates down to 0.3 microns',
    assumptions: 'Focuses on exposure reduction rather than carbon reduction; minimal fan power draw (~30W).',
  },
  corsic_rosenthal_box: {
    title: 'Built & Ran DIY Corsi-Rosenthal Box',
    avoidedCo2Kg: 0,
    exposureAvoidedScore: 8,
    formula: 'Personal exposure reduction: CADR of ~200-300 CFM using MERV 13 filters',
    assumptions: 'Low-cost filtration for budget-conscious families during severe smog episodes.',
  },
  kitchen_exhaust_used: {
    title: 'Utilized Kitchen Range Hood Exhaust During Cooking',
    avoidedCo2Kg: 0,
    exposureAvoidedScore: 7,
    formula: 'Direct exhaust removes localized PM2.5 and NO2 spikes from combustion',
    assumptions: 'Vented outdoors, preventing indoor accumulation of cooking byproducts.',
  },
  damp_mopping: {
    title: 'Damp Mopped Floors Instead of Dry Sweeping',
    avoidedCo2Kg: 0,
    exposureAvoidedScore: 6,
    formula: 'Suppresses dust re-suspension and fine particulate circulation',
    assumptions: 'Prevents settled PM10 and PM2.5 from becoming airborne.',
  },
  thermostat_optimized: {
    title: 'Lowered Heating Setpoint by 1°C in Winter',
    avoidedCo2Kg: 1.1,
    exposureAvoidedScore: 4,
    formula: 'Avoided CO2 = Daily heating baseline × 7% average heating energy reduction',
    assumptions: 'Based on US DOE estimates for space heating efficiency in winter.',
  },
  air_dried_laundry: {
    title: 'Air-Dried Laundry (Skipped Electric Tumble Dryer)',
    avoidedCo2Kg: 1.4,
    exposureAvoidedScore: 3,
    formula: 'Avoided CO2 = 2.4 kWh average electric dryer cycle × 0.58 kg CO2/kWh',
    assumptions: 'Assumes indoor drying rack with adequate air circulation.',
  },
  led_lighting_shift: {
    title: 'Switched to Energy-Star LED Lighting',
    avoidedCo2Kg: 0.25,
    exposureAvoidedScore: 2,
    formula: 'Avoided CO2 = (60W incandescent - 9W LED) × 5 hrs × 0.58 kg/kWh',
    assumptions: 'Household daily usage in active rooms.',
  },
  prevented_waste_burning: {
    title: 'Composted Yard/Garden Leaves (Prevented Burning)',
    avoidedCo2Kg: 3.5,
    exposureAvoidedScore: 10,
    formula: 'Avoided Direct Smoke = ~15 kg biomass × 1.5 kg CO2 + eliminated toxic PM2.5 smoke plume',
    assumptions: 'Open biomass burning is one of the single highest contributors to urban winter smog.',
  },
};
