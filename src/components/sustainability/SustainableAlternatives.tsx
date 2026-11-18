import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Leaf,
  CheckCircle2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { getSustainableAlternatives } from '../../engine/decision-engine';
import { SustainableAlternative } from '../../types';

export const SustainableAlternatives: React.FC = () => {
  const { user, envData, logActivity } = useApp();
  const [loggedAltId, setLoggedAltId] = useState<string | null>(null);

  if (!envData) return null;

  const alternatives = getSustainableAlternatives(user, envData);

  const handleLog = (alt: SustainableAlternative) => {
    logActivity({
      date: new Date().toISOString().split('T')[0],
      category: 'transport',
      title: `Adopted Alternative: ${alt.title}`,
      avoidedCo2Kg: alt.co2ReductionKgPerTrip,
      exposureAvoidedScore: alt.isSafeToday ? 8 : 2,
      formula: `Avoided ${alt.co2ReductionKgPerTrip} kg CO2e per trip by shifting habit.`,
      assumptions: alt.safetyPrecondition,
    });

    setLoggedAltId(alt.id);
    setTimeout(() => setLoggedAltId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
          <Leaf className="w-4 h-4" />
          <span>Low-Emission Mobility & Climate Habits</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Sustainable Alternatives & Safe Mobility
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          AirWise AI pairs sustainable decarbonization with real-world health safety. We strictly differentiate between <strong>reducing your personal exposure</strong> (protecting your lungs) and <strong>reducing your environmental emissions</strong> (reducing urban smog).
        </p>
      </div>

      {/* Safety Protocol Banner: Personal Exposure vs Environmental Emission Footprint */}
      <div className="p-5 rounded-3xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-blue-900">Health Safety Rule on Active Commuting:</strong>
            <p className="mt-0.5 text-blue-800 text-[11px] leading-relaxed">
              When ambient AQI is elevated (&gt;100), vigorous outdoor cycling or walking substantially increases minute ventilation (inhaling 4-6x more toxic PM2.5). <strong>We never advise active outdoor cardio in heavy smog.</strong> Instead, take electrified mass transit or carpool to simultaneously cut emissions and protect your airway!
            </p>
          </div>
        </div>
      </div>

      {/* Alternatives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alternatives.map((alt) => {
          return (
            <div
              key={alt.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                !alt.isSafeToday
                  ? 'bg-rose-50/30 border-rose-200/70'
                  : 'bg-white border-slate-200/80 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    {alt.category.replace('_', ' ')}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase ${
                      alt.isSafeToday ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {alt.isSafeToday ? 'Safe & Recommended Today' : 'Unsafe Under Current AQI'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1">{alt.title}</h3>
                <p className="text-xs text-slate-500 mb-3">
                  <span className="font-semibold text-slate-700">Current habit: </span>
                  {alt.currentHabit}
                </p>

                {/* Proposed Change */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs mb-3 text-slate-800">
                  <strong className="text-emerald-700 font-semibold block mb-0.5">Recommended Change:</strong>
                  {alt.alternativeAction}
                </div>

                {/* Personal Exposure vs Environmental Impact */}
                <div className="space-y-2 text-[11px] mb-4">
                  <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-900">
                    <strong className="block font-bold mb-0.5">Personal Exposure Impact:</strong>
                    {alt.exposureImpact}
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-950 flex items-center justify-between">
                    <div>
                      <strong className="block font-bold">Estimated CO2 Reduction:</strong>
                      <span className="text-slate-600">Per trip or routine day</span>
                    </div>
                    <span className="text-base font-black text-emerald-700">
                      -{alt.co2ReductionKgPerTrip} kg CO2
                    </span>
                  </div>
                </div>

                {/* Practical tips and cost comparison */}
                <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                  <div>
                    <strong className="text-slate-700">Cost Factor:</strong> {alt.costComparison}
                  </div>
                  <div>
                    <strong className="text-slate-700">Practical Tip:</strong> {alt.practicalTip}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Updates Impact Tracker</span>
                <button
                  onClick={() => handleLog(alt)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                    loggedAltId === alt.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {loggedAltId === alt.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Logged to Impact Tracker!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Log this Sustainable Habit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
