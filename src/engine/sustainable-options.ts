// ==============================================================
// SUSTAINABLE MOBILITY & HABIT ALTERNATIVES
// High-impact sustainable choices balancing emission reductions with air exposure safety
// ==============================================================

import { AirQualityData, SustainableAlternative, UserProfile } from '../types';
import { calculateCommuteEmissions } from '../utils/emission-calculator';

/**
 * Generate Sustainable Lifestyle Alternatives
 * strictly differentiating personal exposure vs environmental footprint!
 */
export function getSustainableAlternatives(user: UserProfile, envData: AirQualityData): SustainableAlternative[] {
  const { aqi } = envData;
  const isAqiSafeForOutdoorCardio = aqi <= 100;
  const distance = user.dailyCommuteDistanceKm || 12;

  const transitImpact = calculateCommuteEmissions(distance, 'bus', user.primaryCommuteMode);
  const metroImpact = calculateCommuteEmissions(distance, 'train_metro', user.primaryCommuteMode);
  const carpoolImpact = calculateCommuteEmissions(distance, 'carpool', user.primaryCommuteMode);

  return [
    {
      id: 'alt-metro-transit',
      category: 'transport',
      title: 'Switch to Urban Metro / Commuter Rail',
      currentHabit: `Solo commute by ${user.primaryCommuteMode.replace('_', ' ')} (${distance} km/day)`,
      alternativeAction: 'Take the electrified metro or commuter train with an N95 mask.',
      co2ReductionKgPerTrip: metroImpact.avoidedCo2Kg,
      exposureImpact: 'High Protection: Underground and modern metro trains feature centralized mechanical HVAC filtration, drastically reducing personal PM2.5 exposure compared to highway traffic.',
      safetyPrecondition: 'Safe in all weather and AQI levels. Wear an N95 mask during above-ground station transfers.',
      isSafeToday: true,
      costComparison: 'Saves 60-80% on fuel and parking fees daily.',
      practicalTip: 'Use transit card auto-reload and download the local metro transit map app.',
    },
    {
      id: 'alt-transit-bus',
      category: 'transport',
      title: 'Municipal Bus Transit & Express Lanes',
      currentHabit: 'Driving personal petrol/diesel vehicle alone',
      alternativeAction: 'Board scheduled city transit bus for daily commute.',
      co2ReductionKgPerTrip: transitImpact.avoidedCo2Kg,
      exposureImpact: 'Moderate Protection: Enclosed cabin shields from direct tailpipe exhaust plumes; sit away from vehicle entry doors.',
      safetyPrecondition: 'Safe across all AQI levels when wearing an N95 respirator at the bus stop.',
      isSafeToday: true,
      costComparison: 'Saves approximately $5-$12 daily in fuel and wear-and-tear.',
      practicalTip: 'Track bus arrival in real time to minimize outdoor waiting time at bus stops.',
    },
    {
      id: 'alt-carpooling',
      category: 'transport',
      title: 'Workplace or Neighborhood Carpooling',
      currentHabit: 'Single-occupancy vehicle driving',
      alternativeAction: 'Share rides with 1-2 colleagues or neighbors living along your corridor.',
      co2ReductionKgPerTrip: carpoolImpact.avoidedCo2Kg,
      exposureImpact: 'Neutral: Vehicle cabin filtration (keep AC on internal recirculate mode with a high-efficiency cabin air filter).',
      safetyPrecondition: 'Safe across all AQI conditions when vehicle cabin air filter is maintained.',
      isSafeToday: true,
      costComparison: 'Cuts fuel and toll costs by 50% immediately.',
      practicalTip: 'Always activate your vehicle’s internal air recirculation button to prevent drawing roadway smog into the cabin.',
    },
    {
      id: 'alt-cycling-walking',
      category: 'transport',
      title: 'Active Commuting (Bicycle / Walking)',
      currentHabit: 'Motorized vehicle travel for trips under 3-5 km',
      alternativeAction: 'Walk or ride a commuter bicycle for short-distance neighborhood errands.',
      co2ReductionKgPerTrip: Number((distance * 0.192).toFixed(2)),
      exposureImpact: isAqiSafeForOutdoorCardio
        ? 'Positive Health Balance: In clean air (AQI < 100), the cardiovascular health benefits of active transport far outweigh low ambient risks.'
        : 'CRITICAL WARNING: When AQI is over 100, vigorous outdoor cycling or walking dramatically increases inhaled particulate volume deep into lung alveoli.',
      safetyPrecondition: 'STRICT CONDITIONAL: Only recommended when outdoor AQI is 100 or below. NEVER recommend outdoor cardio during severe smog episodes.',
      isSafeToday: isAqiSafeForOutdoorCardio,
      costComparison: '$0 fuel; free daily cardio exercise.',
      practicalTip: isAqiSafeForOutdoorCardio 
        ? 'Choose residential side streets with lower vehicular traffic volume.'
        : 'CURRENTLY UNSAFE: Air quality is degraded. Use public transit or carpooling today instead.',
    },
    {
      id: 'alt-trip-chaining',
      category: 'transport',
      title: 'Trip Chaining & Errand Consolidation',
      currentHabit: 'Taking multiple short, separate vehicle trips throughout the week',
      alternativeAction: 'Consolidate multiple errands into a single circular route while the engine is warm.',
      co2ReductionKgPerTrip: 1.2,
      exposureImpact: 'Reduces both personal time spent in roadside traffic and overall neighbourhood tailpipe emissions.',
      safetyPrecondition: 'Safe and beneficial in all air quality conditions.',
      isSafeToday: true,
      costComparison: 'Cold engines consume 20-30% more fuel during the first 5 km; trip chaining saves fuel.',
      practicalTip: 'Plan your grocery, pharmacy, and school pickup sequence before leaving home.',
    },
    {
      id: 'alt-waste-biomass-stop',
      category: 'waste_management',
      title: 'Composting Yard Waste (Zero Open Burning)',
      currentHabit: 'Sweeping and burning garden leaves, yard waste, or scrap paper',
      alternativeAction: 'Compost organic leaves in a backyard bin or use municipal green waste bins.',
      co2ReductionKgPerTrip: 3.5,
      exposureImpact: 'Massive Neighborhood Impact: Open leaf and trash burning emits dense clouds of PM2.5, dioxins, and acrid smoke directly into your family’s breathing zone.',
      safetyPrecondition: 'Mandatory civic practice across all seasons.',
      isSafeToday: true,
      costComparison: 'Eliminates smoke and produces free nutrient-rich garden compost.',
      practicalTip: 'Moisten dry leaves and layer with soil or vegetable peels in a compost bin.',
    },
    {
      id: 'alt-thermostat-winter',
      category: 'household_energy',
      title: 'Smart Winter Thermostat Scheduling',
      currentHabit: 'Continuous high space heating (23-24°C / 75°F)',
      alternativeAction: 'Set winter heating to 20°C (68°F) when home, and 17°C (63°F) when away or asleep.',
      co2ReductionKgPerTrip: 1.1,
      exposureImpact: 'Avoids desiccating indoor mucosal membranes; reduces regional power plant coal/gas emissions.',
      safetyPrecondition: 'Safe for all healthy households; ensure infants and elderly have adequate warm blankets.',
      isSafeToday: true,
      costComparison: 'Lowers winter heating bills by 8-12%.',
      practicalTip: 'Install a programmable or smart thermostat with scheduled overnight setbacks.',
    },
  ];
}
