import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Wind,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { PRESET_LOCATIONS } from '../../services/environmental-api';
import { LocationOption } from '../../types';
import { useFocusTrap } from '../../utils/useFocusTrap';

export const OnboardingModal: React.FC = () => {
  const { isFirstVisit, setIsFirstVisit, updateLocation, user } = useApp();
  const [selectedLoc, setSelectedLoc] = useState<LocationOption>(user.location);
  const dialogRef = useFocusTrap<HTMLDivElement>({ isOpen: isFirstVisit });

  if (!isFirstVisit) return null;

  const handleFinish = async () => {
    await updateLocation(selectedLoc);
    setIsFirstVisit(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-dialog-title"
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 outline-none"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center mb-4 shadow-lg shadow-emerald-700/20">
          <Wind className="w-6 h-6 animate-pulse" />
        </div>

        <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800">
          Virtual PromptWars Challenge
        </span>

        <h2 id="onboarding-dialog-title" className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
          Welcome to AirWise AI
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Your GenAI-powered intelligent assistant helping families navigate severe winter smog and urban air pollution through low-emission routines and indoor clean-air engineering.
        </p>

        {/* Quick Location Select */}
        <div className="mt-6 space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Select your city to initialize live atmospheric tracking:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_LOCATIONS.slice(0, 6).map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLoc(loc)}
                aria-pressed={selectedLoc.city === loc.city}
                className={`p-3 rounded-2xl text-left border text-xs font-semibold transition-all ${
                  selectedLoc.city === loc.city
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                }`}
              >
                <div className="font-bold">{loc.city}</div>
                <div className={`text-[10px] ${selectedLoc.city === loc.city ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {loc.country}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Core Pillars */}
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Strict scientific grounding (US EPA standards, no hallucinated AQI)</span>
          </div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Adaptive daily routines for children, seniors, and active commuters</span>
          </div>
        </div>

        {/* Finish CTA */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleFinish}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-lg shadow-emerald-700/25 flex items-center justify-center space-x-2 transition-all hover:scale-[1.01]"
          >
            <span>Launch AirWise AI</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
