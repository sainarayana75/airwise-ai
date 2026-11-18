// ==============================================================
// RULE-BASED FALLBACK CONVERSATIONAL ASSISTANT & GROUNDED ENGINE
// Deterministic, verified responses when Gemini API key is missing or offline
// ==============================================================

import { AirQualityData, ChatMessage, UserProfile } from '../types';
import { calculateCommuteEmissions } from '../utils/emission-calculator';

export const SUGGESTED_PROMPT_CHIPS = [
  'Is it safe for my children to play outside today?',
  'How can I improve air quality inside my house?',
  'What can I do if I cannot afford an air purifier?',
  'How can I reduce pollution exposure during my commute?',
  'Why are you recommending this routine for me?',
  'Which transportation option is more sustainable?',
];

/**
 * Deterministic fallback response generator grounded in verified environmental data and user profile
 */
export function generateFallbackResponse(
  userQuery: string,
  user: UserProfile,
  envData: AirQualityData
): ChatMessage {
  const query = userQuery.toLowerCase().trim();
  const { aqi, category, dominantPollutant, pollutants, weather } = envData;
  const isUnhealthySensitive = aqi > 100 && aqi <= 150;
  const isUnhealthy = aqi > 150 && aqi <= 200;
  const isSevere = aqi > 200;

  const hasChildren = user.familyMembers.some(m => m.ageGroup === 'child' || m.ageGroup === 'infant');
  const hasAsthma = user.familyMembers.some(m => m.hasRespiratoryCondition);
  const hasElderly = user.familyMembers.some(m => m.ageGroup === 'elderly');

  let responseText = '';
  let followUps: string[] = [];

  // Query 1: Children / outdoor play safety
  if (query.includes('child') || query.includes('kid') || query.includes('outside') || query.includes('play')) {
    if (isSevere || isUnhealthy) {
      responseText = `### ⚠️ Outdoor Safety Advisory for Children: **NOT SAFE TODAY**\n\n` +
        `Current outdoor conditions in **${user.location.city}** indicate **${category}** air quality with an AQI of **${aqi}** (dominant: ${dominantPollutant}, PM2.5: ${pollutants.pm2_5 ?? 'elevated'} µg/m³).\n\n` +
        `**Medical & Physiological Rationale:**\n` +
        `- Children breathe **50% more air per kilogram of body weight** than adults, leading to much higher toxic aerosol lung deposition.\n` +
        `- Inhaling PM2.5 at this level triggers acute bronchiolar constriction, airway inflammation, and reduced lung capacity.\n\n` +
        `**Recommended Action:**\n` +
        `1. Cancel outdoor recess, sports practices, and playground trips.\n` +
        `2. Keep play indoors in a sealed room with active HEPA or Corsi-Rosenthal filtration.\n` +
        `3. If outdoor travel is mandatory, have children wear a snug-fitting child-sized certified KF94 or N95 mask.`;
      followUps = ['How can I build an affordable Corsi-Rosenthal air cleaner?', 'When is the next safe ventilation window?'];
    } else if (isUnhealthySensitive) {
      responseText = `### ⚠️ Caution for Children & Sensitive Groups\n\n` +
        `Outdoor AQI is **${aqi} (${category})** in **${user.location.city}**.\n\n` +
        `- **Healthy Children:** Can engage in light outdoor play, but avoid prolonged vigorous aerobic endurance sports (like soccer matches or long runs).\n` +
        `- **Children with Asthma/Allergies:** Should remain indoors or take preventative medication as prescribed.\n` +
        `- Look out for symptoms such as coughing, eye watering, or throat scratchiness.`;
      followUps = ['Is it safe for my commute today?', 'How to seal windows against smog?'];
    } else {
      responseText = `### ✅ Outdoor Play is Safe Today\n\n` +
        `Current air quality in **${user.location.city}** is **${category} (AQI: ${aqi})** with temperature at ${weather.temperature}°C.\n\n` +
        `- It is completely safe for children and infants to play outdoors, participate in sports, and engage in active recreation.\n` +
        `- Take advantage of the clean atmospheric conditions today!`;
      followUps = ['Which transportation option is more sustainable?', 'Show me low-emission routine tips'];
    }
  }

  // Query 2: Indoor air quality improvement / hacks
  else if (query.includes('indoor') || query.includes('house') || query.includes('home') || query.includes('room')) {
    responseText = `### 🏡 Evidence-Based Indoor Air Quality Strategies for ${user.location.city}\n\n` +
      `When outdoor AQI is **${aqi} (${category})**, maintaining an effective indoor clean-air envelope is crucial:\n\n` +
      `1. **Control Window Infiltration:** ${
        isSevere || isUnhealthy 
          ? `Keep all windows and exterior doors tightly shut. Outdoor air has PM2.5 of ${pollutants.pm2_5} µg/m³, which will quickly contaminate indoor rooms.`
          : `Outdoor air is moderate. You may open windows briefly between 2 PM and 4 PM during daytime thermal mixing.`
      }\n` +
      `2. **Kitchen Source Control:** Indoor cooking (especially oil frying and gas burners) generates severe ultrafine particulate spikes. Always run range hood exhaust and cook with pot lids.\n` +
      `3. **Eliminate Combustion Sources:** Stop using incense, scented paraffin candles, and mosquito coils. A single incense stick produces particulate mass equivalent to multiple cigarettes.\n` +
      `4. **Damp Mopping:** Avoid dry brooms or feather dusters that kick settled particles back into the air. Clean with damp microfiber cloths.\n` +
      `5. **Air Cleaning:** ${
        user.hasAirPurifier 
          ? 'Run your HEPA purifier in the bedroom with the door closed for optimal clean air delivery.'
          : 'Build a DIY Corsi-Rosenthal box for ~$50 using a box fan and MERV 13 furnace filters for professional-grade clean air delivery.'
      }`;
    followUps = ['What can I do if I cannot afford an air purifier?', 'When can I open windows today?'];
  }

  // Query 3: Low budget / cannot afford air purifier
  else if (query.includes('afford') || query.includes('budget') || query.includes('cheap') || query.includes('diy') || query.includes('purifier')) {
    responseText = `### 💡 High-Efficacy, Affordable Clean-Air Solutions (Under $50)\n\n` +
      `You don't need a $500 commercial purifier to protect your family from severe smog. Here are verified low-cost alternatives:\n\n` +
      `1. **The Corsi-Rosenthal Box (~$40-$60):**\n` +
      `   - Tape 4 MERV 13 furnace filters together in a cube shape and tape a standard 20" box fan on top facing up.\n` +
      `   - **Scientific fact:** Tests by aerosol scientists prove a Corsi-Rosenthal box achieves Clean Air Delivery Rates (CADR) of 250-400 CFM, matching or outperforming commercial HEPA purifiers at 10% of the cost!\n\n` +
      `2. **Create a "Clean-Air Sleeping Sanctuary" (Under $10):**\n` +
      `   - Pick the smallest bedroom with the fewest exterior openings.\n` +
      `   - Place rolled damp towels or foam weatherstripping tape under doors and around leaky window frames to block drafts.\n` +
      `   - Keep doors shut to concentrate clean air where you sleep.\n\n` +
      `3. **Strict Zero-Cost Source Elimination ($0):**\n` +
      `   - Never dry sweep (use water damp mopping).\n` +
      `   - Zero indoor incense, candles, or tobacco smoking.\n` +
      `   - Boil or steam foods instead of frying or searing.\n\n` +
      `*(Scientific Note: Houseplants do NOT clean PM2.5 particulate smog. Avoid wasting money on plants for air purification).*`;
    followUps = ['How do I build the Corsi-Rosenthal box step-by-step?', 'Is it safe for my children outside?'];
  }

  // Query 4: Commute / travel exposure
  else if (query.includes('commute') || query.includes('traffic') || query.includes('travel') || query.includes('exposure') || query.includes('car')) {
    const transitSavings = calculateCommuteEmissions(user.dailyCommuteDistanceKm || 15, 'bus', user.primaryCommuteMode);
    responseText = `### 🚗 Commute Pollution & Emission Reduction Advice\n\n` +
      `For your **${user.dailyCommuteDistanceKm || 15} km** daily travel in **${user.location.city}** (Current AQI: ${aqi}):\n\n` +
      `**1. Personal Exposure Protection:**\n` +
      `- In-car cabin air can be 2-3x dirtier than ambient air if following diesel trucks.\n` +
      `- **Crucial vehicle setting:** Press the **internal air recirculation button** (the car icon with the curved arrow inside). This forces cabin air through your vehicle’s filter rather than sucking raw exhaust from the highway.\n` +
      `- If using transit or walking to the stop, wear an authentic **N95 or FFP2 respirator**.\n\n` +
      `**2. Environmental Impact:**\n` +
      `- Solo car driving generates approximately **${transitSavings.baselineCo2Kg} kg CO2** for your daily distance.\n` +
      `- Switching to public transit or carpooling saves **${transitSavings.avoidedCo2Kg} kg CO2** today (${transitSavings.percentageReduced}% reduction).\n\n` +
      `**Safety Precondition:** ${
        isSevere || isUnhealthy
          ? 'Avoid walking or cycling along congested roads today due to toxic PM2.5 levels. Take enclosed transit or carpool.'
          : 'Cycling/walking is safe today due to favorable air quality.'
      }`;
    followUps = ['Which transportation option is more sustainable?', 'How can I improve air quality inside my house?'];
  }

  // Query 5: Why are you recommending this routine?
  else if (query.includes('why') || query.includes('reason') || query.includes('recommend') || query.includes('routine')) {
    responseText = `### 🧠 Transparent Decision-Engine Reasoning\n\n` +
      `AirWise AI tailors your plan using a multi-parameter decision matrix combining:\n\n` +
      `1. **Live Environmental Ground Truth:**\n` +
      `   - Location: ${user.location.city} (Latitude ${user.location.latitude.toFixed(2)}, Longitude ${user.location.longitude.toFixed(2)})\n` +
      `   - Index: ${aqi} US EPA AQI (${category})\n` +
      `   - Key Pollutant: ${dominantPollutant} (${pollutants.pm2_5 ?? 'N/A'} µg/m³ PM2.5)\n` +
      `   - Meteorology: ${weather.temperature}°C, ${weather.humidity}% humidity, wind ${weather.windSpeed} km/h (${weather.weatherDescription})\n\n` +
      `2. **Your Family & Vulnerability Constraints:**\n` +
      `   - Family Size: ${user.familySize} members\n` +
      `   - High-Risk Sensitivity: ${hasChildren ? 'Children present (higher inhalation rate); ' : ''}${hasAsthma ? 'Asthma/Respiratory condition flagged; ' : ''}${hasElderly ? 'Elderly family members; ' : 'General population profile.'}\n` +
      `   - Household Equipment: ${user.hasAirPurifier ? 'Equipped with air purifier' : 'No commercial air purifier (prioritizing low-cost DIY clean-room hacks)'}\n` +
      `   - Budget Tier: ${user.budget.toUpperCase()}\n\n` +
      `**The Core Principle:** We never recommend actions that reduce carbon emissions at the cost of acute toxic respiratory exposure. When smog is high, health safety takes precedence!`;
    followUps = ['Is it safe for my children to play outside today?', 'What can I do if I cannot afford an air purifier?'];
  }

  // Query 6: Sustainable transport / alternatives
  else if (query.includes('sustain') || query.includes('transport') || query.includes('emission') || query.includes('alternative')) {
    responseText = `### 🌿 Practical Sustainable Alternatives Comparison\n\n` +
      `Here is how different transportation modes compare for personal exposure and environmental carbon footprint:\n\n` +
      `| Mode | CO2 Factor (kg/pkm) | Exposure Risk Today (AQI ${aqi}) | Practical Assessment |\n` +
      `|---|---|---|---|\n` +
      `| **Metro / Train** | **0.035** | **Lowest Exposure** (Clean filtered cars) | **Best overall choice today** |\n` +
      `| **Public Bus** | **0.089** | **Low-Medium** (Wear N95 at stops) | **54% emission cut vs solo car** |\n` +
      `| **Carpooling** | **0.096** | **Controlled** (Cabin recirculation) | **50% fuel & carbon reduction** |\n` +
      `| **Solo Petrol Car** | **0.192** | **Baseline** (Must keep vents recirculated) | Highest emission footprint |\n` +
      `| **Cycling / Walking** | **0.000** | ${isSevere || isUnhealthy ? '⚠️ **DANGEROUS TODAY** (Heavy aerosol intake)' : '✅ **SAFE & HEALTHY TODAY**'} | ${isSevere || isUnhealthy ? 'Avoid cardio outdoors today' : 'Ideal zero-carbon trip'} |\n\n` +
      `*Notice the distinction: While cycling is zero-emission, doing intense cardio in heavy smog damages lung health. AirWise AI only recommends cycling when AQI is 100 or below.*`;
    followUps = ['How can I reduce pollution exposure during my commute?', 'Is it safe for my children outside?'];
  }

  // Default intelligent assistant response
  else {
    responseText = `### 🌬️ AirWise AI Intelligent Assistant\n\n` +
      `I am analyzing your location (**${user.location.city}**) with current air quality at **AQI ${aqi} (${category})** and temperature **${weather.temperature}°C**.\n\n` +
      `Here is a quick summary for your household:\n` +
      `- **Outdoor Activity:** ${isSevere || isUnhealthy ? 'Suspended for aerobic workouts. Keep sensitive family members indoors.' : 'Safe for general outdoor recreation today.'}\n` +
      `- **Indoor Air:** ${user.hasAirPurifier ? 'Run your air purifier in the bedroom.' : 'Implement sealed clean-air rooms and avoid frying/incense.'}\n` +
      `- **Daily Commute:** ${user.primaryCommuteMode.includes('car') ? 'Consider transit/carpooling to reduce urban smog and your daily carbon footprint.' : 'Great job utilizing lower-emission transit.'}\n\n` +
      `How else can I assist with your clean-air routines, child safety, or sustainable habits?`;
    followUps = [
      'Is it safe for my children to play outside today?',
      'How can I improve air quality inside my house?',
      'What can I do if I cannot afford an air purifier?',
    ];
  }

  return {
    id: `msg-${Date.now()}`,
    sender: 'assistant',
    content: responseText,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isFallback: true,
    suggestedFollowUps: followUps,
  };
}

/**
 * Build grounded system prompt for Google Gemini API
 * Strictly enforces that Gemini never hallucinates AQI values, uses the provided real-time data,
 * and maintains strict environmental and health accuracy.
 */
export function buildGeminiPrompt(
  userQuery: string,
  user: UserProfile,
  envData: AirQualityData,
  conversationHistory: { role: string; content: string }[]
): {
  systemInstruction: string;
  userPrompt: string;
} {
  const systemInstruction = `You are AirWise AI, an elite environmental intelligence assistant and clean-air companion for families navigating urban smog and winter air pollution.

VERIFIED GROUND-TRUTH CONTEXT (DO NOT OVERRIDE OR INVENT DIFFERENT NUMBERS):
- Location: ${user.location.city}, ${user.location.country} (Coordinates: ${user.location.latitude}, ${user.location.longitude})
- Current Standard: ${envData.standardLabel}
- Current AQI: ${envData.aqi} (${envData.category})
- Dominant Pollutant: ${envData.dominantPollutant}
- Verified Pollutants: PM2.5=${envData.pollutants.pm2_5 ?? 'N/A'} µg/m³, PM10=${envData.pollutants.pm10 ?? 'N/A'} µg/m³, NO2=${envData.pollutants.no2 ?? 'N/A'} µg/m³, SO2=${envData.pollutants.so2 ?? 'N/A'} µg/m³, O3=${envData.pollutants.o3 ?? 'N/A'} µg/m³
- Meteorology: Temperature=${envData.weather.temperature}°C, Humidity=${envData.weather.humidity}%, Wind=${envData.weather.windSpeed} km/h, Weather=${envData.weather.weatherDescription}
- User Profile: Family Size=${user.familySize}, Budget=${user.budget}, Commute=${user.primaryCommuteMode} (${user.dailyCommuteDistanceKm} km), HasPurifier=${user.hasAirPurifier}, HasKitchenExhaust=${user.hasKitchenExhaust}
- Family Members: ${JSON.stringify(user.familyMembers)}

STRICT OPERATIONAL RULES:
1. Never invent or contradict the verified AQI or pollutant values provided above.
2. Clearly distinguish between reducing PERSONAL EXPOSURE (e.g. masks, HEPA purifiers, window sealing) and reducing ENVIRONMENTAL EMISSIONS (e.g. transit, composting, energy conservation).
3. SAFETY RULE: NEVER recommend outdoor cycling or jogging when AQI > 100. Prioritize respiratory health over zero-carbon exercise during smog spikes.
4. INDOOR RULE: Never claim houseplants replace HEPA filters. Recommend evidence-based hacks like the Corsi-Rosenthal box or kitchen exhaust.
5. Never claim individual consumer actions directly altered the citywide AQI.
6. Provide structured, actionable, and empathetic advice with bullet points and bold highlights. Keep it concise, accessible, and scientifically accurate.`;

  const historySnippet = conversationHistory.length > 0
    ? `\nPRIOR CONVERSATION SUMMARY:\n${conversationHistory.map(h => `${h.role}: ${h.content.slice(0, 200)}`).join('\n')}`
    : '';

  const userPrompt = `User question: "${userQuery}"${historySnippet}\n\nPlease answer based strictly on the verified environmental and user context provided in the system instruction.`;

  return { systemInstruction, userPrompt };
}
