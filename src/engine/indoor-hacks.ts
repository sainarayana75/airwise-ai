// ==============================================================
// INDOOR AIR QUALITY HACKS
// Evidence-based IAQ engineering customized for household budget and dwelling
// ==============================================================

import { AirQualityData, IndoorHack, UserProfile } from '../types';

/**
 * Indoor Air Quality Hacks customized for household budget and conditions
 */
export function getTailoredIndoorHacks(user: UserProfile, envData: AirQualityData): IndoorHack[] {
  const hacks: IndoorHack[] = [
    {
      id: 'corsi-rosenthal',
      title: 'DIY Corsi-Rosenthal Box Air Cleaner',
      category: 'filtration',
      costLevel: 'low_cost',
      costEstimate: '$40 - $70 (vs $300 - $600 for commercial units)',
      efficacy: 'High (CADR 250-400 CFM, traps >85% of PM2.5)',
      steps: [
        'Obtain one standard 20" x 20" box fan and four MERV 13 (or FPR 10) HVAC furnace filters.',
        'Tape the four filters together in a cube shape with airflow arrows pointing inward towards the center.',
        'Tape the box fan securely to the top blowing upward, and seal the cardboard bottom with duct tape.',
        'Add a circular cardboard shroud to the fan face to eliminate corner air backflow and maximize airflow efficiency.',
      ],
      scientificRationale: 'Peer-reviewed by environmental aerosol engineers (UC Davis / Brown University). Multiple large-surface MERV 13 filters offer very low air resistance, matching or exceeding commercial HEPA clean air delivery rates at a fraction of the cost.',
      importantWarning: 'Ensure filters are rated MERV 13 or higher; MERV 8 filters do not effectively capture fine PM2.5 particles.',
      appliesToBudget: ['low', 'moderate'],
      tag: 'Highest Value DIY',
    },
    {
      id: 'smart-window-timing',
      title: 'Dynamic Window Infiltration Management',
      category: 'ventilation',
      costLevel: 'free',
      costEstimate: '$0 (Pure behavioral change)',
      efficacy: 'Medium to High (Reduces particulate infiltration by 50-70%)',
      steps: [
        'Keep all windows firmly sealed during peak morning (7-10 AM) and night (8 PM - 4 AM) smog inversions.',
        'Check AirWise AI’s Ventilation Window before opening any exterior aperture.',
        'When airing out during low-pollution afternoon dips, open windows on the sheltered, leeward side of the home away from street traffic.',
        'Close windows immediately when wind speed drops below 4 km/h or haze appears.',
      ],
      scientificRationale: 'Thermal inversions lock particulate matter close to the ground when ground temperatures drop. Opening windows during inversions floods the indoor environment with dangerous respirable particles.',
      importantWarning: 'Never leave windows cracked open overnight during winter smog periods.',
      appliesToBudget: ['low', 'moderate', 'high'],
      tag: 'Zero Cost Habit',
    },
    {
      id: 'kitchen-source-control',
      title: 'Kitchen Combustion & Aerosol Elimination',
      category: 'cooking',
      costLevel: 'free',
      costEstimate: '$0',
      efficacy: 'High (Eliminates localized PM2.5 spikes of 200-500 µg/m³)',
      steps: [
        'Always turn kitchen range hood exhaust to maximum before igniting gas burners.',
        'Use lids on frying pans and pots to condense grease vapors and oil droplets.',
        'Favor boiling, steaming, slow-cooking, or microwave reheating over deep frying or high-heat searing during smog days.',
        'Keep the kitchen door closed to prevent smoke and NO2 from migrating into bedrooms.',
      ],
      scientificRationale: 'Stove cooking and oil frying produce ultrafine particles and acrolein. Gas stoves additionally emit NO2 and benzene, which become trapped indoors when exterior ventilation is constrained.',
      importantWarning: 'Recirculating range hoods with dirty charcoal filters do not remove fine PM2.5; prioritize boiling or electric appliances.',
      appliesToBudget: ['low', 'moderate', 'high'],
      tag: 'Health Essential',
    },
    {
      id: 'damp-dust-management',
      title: 'Damp Surface & Microfiber Mopping',
      category: 'dust_cleaning',
      costLevel: 'low_cost',
      costEstimate: '$5 - $15 for microfiber cloths',
      efficacy: 'Medium (Prevents 70-80% of settled particulate re-suspension)',
      steps: [
        'Never use dry bristle brooms or feather dusters; they fling settled particles into the breathing air.',
        'Use damp microfiber cloths with plain warm water to wipe counters, window sills, and tables.',
        'Mop hard floors with a damp microfiber flat mop working from the furthest corner toward the exit.',
        'If vacuuming, use only vacuums equipped with sealed true-HEPA exhaust filtration; standard vacuums spray fine dust back out.',
      ],
      scientificRationale: 'Settled dust contains PM10, PM2.5, heavy metals, and absorbed PAHs. Surface tension in moisture captures and removes particles without airborne aerosolization.',
      importantWarning: 'Do not use chemical aerosol cleaning sprays or scented air fresheners; they emit volatile organic compounds (VOCs) that form secondary organic aerosols.',
      appliesToBudget: ['low', 'moderate', 'high'],
      tag: 'Allergen Defense',
    },
    {
      id: 'indoor-source-elimination',
      title: 'Elimination of Indoor Incense, Candles & Vaping',
      category: 'source_control',
      costLevel: 'free',
      costEstimate: '$0 (Saves money)',
      efficacy: 'Critical (Eliminates continuous indoor particulate sources)',
      steps: [
        'Cease burning incense sticks, mosquito coils, and scented paraffin candles indoors.',
        'Prohibit any indoor smoking or e-cigarette aerosolization.',
        'Avoid essential oil ultrasonic diffusers during heavy smog days, as fine water-oil droplets register as respirable particulate matter.',
        'Use electric insect repellents or sealed screens rather than smoke-generating coils.',
      ],
      scientificRationale: 'A single burning incense stick emits up to 45 mg of PM2.5 and benzene—equivalent to smoking 1-2 cigarettes in a sealed room. When windows are shut against outdoor smog, indoor combustion creates lethal enclosed concentrations.',
      importantWarning: 'Houseplants DO NOT filter particulate smog or replace HEPA filtration. Relying on houseplants for air cleaning is an unsupported myth.',
      appliesToBudget: ['low', 'moderate', 'high'],
      tag: 'Vital Precaution',
    },
    {
      id: 'dedicated-clean-room',
      title: 'Creating a Sealed "Clean-Air Sanctuary" Room',
      category: 'filtration',
      costLevel: user.hasAirPurifier ? 'free' : 'low_cost',
      costEstimate: user.hasAirPurifier ? '$0' : '$25 for sealing tape & draft stoppers',
      efficacy: 'Very High (Lowers room PM2.5 by 80-95%)',
      steps: [
        'Select the most well-sealed bedroom with the fewest exterior doors and windows.',
        'Apply foam weatherstripping tape along window frame perimeters and place draft snakes under the entrance door.',
        'Station your air purifier (commercial HEPA or Corsi-Rosenthal box) inside this room away from walls.',
        'Keep the room door shut; gather family members inside during peak outdoor smog hours.',
      ],
      scientificRationale: 'Concentrating clean-air delivery into a smaller, sealed volume creates high air changes per hour (ACH > 5), rapidly cleansing the air even if the rest of the house remains leaky.',
      importantWarning: 'Ensure the room has adequate volume so CO2 does not exceed comfortable thresholds (open door briefly every 3-4 hours if occupied by multiple people).',
      appliesToBudget: ['low', 'moderate', 'high'],
      tag: 'Smog Emergency',
    },
  ];

  // Prioritize based on user budget and conditions
  return hacks.sort((a, b) => {
    if (envData.aqi > 200) {
      if (a.id === 'dedicated-clean-room') return -1;
      if (b.id === 'dedicated-clean-room') return 1;
    }
    if (user.budget === 'low') {
      if (a.costLevel === 'free' && b.costLevel !== 'free') return -1;
      if (a.costLevel === 'low_cost' && b.costLevel === 'investment') return -1;
    }
    return 0;
  });
}
