import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Home,
  Clock,
  AlertTriangle,
  Wrench,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { calculateVentilationWindows, getTailoredIndoorHacks } from '../../engine/decision-engine';
import { IndoorHack } from '../../types';

export const IndoorAdvisor: React.FC = () => {
  const { user, envData, logActivity } = useApp();
  const [selectedCostFilter, setSelectedCostFilter] = useState<'all' | 'free' | 'low_cost' | 'investment'>('all');
  const [activeExpandedId, setActiveExpandedId] = useState<string | null>('corsi-rosenthal');
  const [loggedHackId, setLoggedHackId] = useState<string | null>(null);

  if (!envData) return null;

  const ventilationWindows = calculateVentilationWindows(envData);
  const tailoredHacks = getTailoredIndoorHacks(user, envData);

  const filteredHacks = tailoredHacks.filter(h => {
    if (selectedCostFilter === 'all') return true;
    return h.costLevel === selectedCostFilter;
  });

  const handleLogHack = (hack: IndoorHack) => {
    logActivity({
      date: new Date().toISOString().split('T')[0],
      category: 'indoor_action',
      title: `Implemented Indoor IAQ Action: ${hack.title}`,
      avoidedCo2Kg: 0,
      exposureAvoidedScore: 8,
      formula: hack.efficacy,
      assumptions: hack.scientificRationale,
    });

    setLoggedHackId(hack.id);
    setTimeout(() => setLoggedHackId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
          <Home className="w-4 h-4" />
          <span>Indoor Air Quality & Exposure Defense Advisor</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Indoor Clean-Air Engineering & Hacks
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Up to 80% of human pollution exposure occurs indoors during winter smog episodes. Learn verified, physics-based mitigation techniques tailored to your home type ({user.homeType}) and budget ({user.budget}).
        </p>
      </div>

      {/* Module 3 Feature 1: Dynamic Window Ventilation Advisor */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Dynamic Window Infiltration & Ventilation Windows</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Calculated using hourly outdoor particulate and thermal mixing forecasts for {user.location.city}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Never open windows without checking outdoor AQI
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ventilationWindows.map((win, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all ${
                win.recommended
                  ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/20'
                  : 'bg-rose-50/40 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">
                  {win.startHour} – {win.endHour}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                    win.recommended ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {win.recommended ? 'Safe Airing' : 'Keep Sealed'}
                </span>
              </div>

              <div className="my-2">
                <span className="text-2xl font-black text-slate-900">{win.avgAqi}</span>
                <span className="text-xs text-slate-500 ml-1">Avg AQI</span>
              </div>

              <p className="text-xs font-semibold text-slate-800 mb-1.5">{win.advisory}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{win.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Module 3 Feature 2: Debunking Houseplants Myth Banner */}
      <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-amber-900">Scientific Truth on Houseplants & Air Filtration:</strong>
            <p className="mt-0.5 text-amber-800 text-[11px] leading-relaxed">
              Contrary to popular urban myth, <strong>houseplants DO NOT filter fine PM2.5 or PM10 particulate smog</strong>. The 1989 NASA Clean Air Study evaluated VOCs in tiny hermetic chambers. In real homes with air exchange, you would need hundreds of plants per room to produce any measurable effect. Never rely on plants to protect your lungs from winter smog—use true HEPA or MERV 13 filtration!
            </p>
          </div>
        </div>
      </div>

      {/* Module 3 Feature 3: Actionable Indoor Hacks with Budget Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Evidence-Based Indoor Hacks & Protocols
            </h3>
            <p className="text-xs text-slate-500">
              High-impact solutions sorted for your budget level ({user.budget})
            </p>
          </div>

          {/* Budget filter buttons */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedCostFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCostFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Hacks
            </button>
            <button
              onClick={() => setSelectedCostFilter('free')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCostFilter === 'free' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              $0 Zero-Cost
            </button>
            <button
              onClick={() => setSelectedCostFilter('low_cost')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedCostFilter === 'low_cost' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Low-Cost DIY
            </button>
          </div>
        </div>

        {/* Hacks Accordion Cards */}
        <div className="space-y-3">
          {filteredHacks.map((hack) => {
            const isExpanded = activeExpandedId === hack.id;

            return (
              <div
                key={hack.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
              >
                <div
                  onClick={() => setActiveExpandedId(isExpanded ? null : hack.id)}
                  className="p-5 sm:p-6 cursor-pointer hover:bg-slate-50/50 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center font-bold flex-shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-slate-100 text-slate-700">
                          {hack.costEstimate}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                          {hack.tag}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">{hack.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-emerald-600 hidden sm:inline">
                      {isExpanded ? 'Hide Details' : 'View Protocol'}
                    </span>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-4 text-xs">
                    {/* Efficacy & Rationale */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Clean Air Efficacy
                        </span>
                        <p className="text-slate-800 font-semibold">{hack.efficacy}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                          Scientific Rationale
                        </span>
                        <p className="text-emerald-950 text-[11px] leading-relaxed">{hack.scientificRationale}</p>
                      </div>
                    </div>

                    {/* Step-by-Step Implementation */}
                    <div>
                      <h5 className="font-bold text-slate-900 mb-2">Step-by-Step Implementation:</h5>
                      <ol className="space-y-2">
                        {hack.steps.map((st, i) => (
                          <li key={i} className="flex items-start space-x-2 text-slate-700 text-[11px] leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">
                              {i + 1}
                            </span>
                            <span>{st}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Safety Precaution Warning */}
                    <div className="p-3 rounded-2xl bg-rose-50/60 border border-rose-200 text-rose-900 text-[11px] flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Safety Precaution:</strong> {hack.importantWarning}
                      </div>
                    </div>

                    {/* Log Hack CTA */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogHack(hack);
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all"
                      >
                        {loggedHackId === hack.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Logged to Impact Tracker!</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Implemented & Log</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
