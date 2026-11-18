import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  CalendarCheck2,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ShieldCheck,
  Leaf,
  SlidersHorizontal,
  Home,
  Check,
} from 'lucide-react';
import { RoutineRecommendation, TimeOfDay } from '../../types';

export const DailyRoutinePlanner: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { user, envData, dailyPlan, toggleRoutineCompletion, logActivity } = useApp();
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'all' | TimeOfDay>('all');
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);

  if (!dailyPlan || !envData) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500">Synthesizing personalized routine plan...</p>
      </div>
    );
  }

  const allRecs = [
    ...dailyPlan.morning,
    ...dailyPlan.afternoon,
    ...dailyPlan.evening,
  ];

  const totalActions = allRecs.length;
  const completedActions = allRecs.filter(r => r.completed).length;
  const completionPercentage = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const handleToggle = (rec: RoutineRecommendation) => {
    const isNowCompleted = !rec.completed;
    toggleRoutineCompletion(rec.id);

    // If marked completed, also automatically log to Impact Tracker
    if (isNowCompleted) {
      logActivity({
        date: new Date().toISOString().split('T')[0],
        category: 'routine_completion',
        title: `Completed Routine: ${rec.title}`,
        avoidedCo2Kg: rec.category === 'commute' ? 1.8 : rec.category === 'energy_conservation' ? 1.1 : 0,
        exposureAvoidedScore: rec.priority === 'critical' ? 9 : rec.priority === 'high' ? 7 : 5,
        formula: rec.estimatedImpact,
        assumptions: rec.assumptions,
      });

      setJustLoggedId(rec.id);
      setTimeout(() => setJustLoggedId(null), 3000);
    }
  };

  const renderSection = (title: string, icon: React.ReactNode, items: RoutineRecommendation[]) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
          {icon}
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">{title}</h3>
          <span className="text-xs text-slate-400 font-medium">({items.length} actions)</span>
        </div>

        <div className="space-y-4">
          {items.map((rec) => {
            const isCompleted = rec.completed;
            const isPriority = rec.priority === 'critical' || rec.priority === 'high';

            return (
              <div
                key={rec.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all ${
                  isCompleted
                    ? 'bg-slate-50/80 border-slate-200 opacity-80'
                    : isPriority
                    ? 'bg-white border-emerald-300 shadow-md shadow-emerald-700/5 ring-1 ring-emerald-400/20'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <button
                      onClick={() => handleToggle(rec)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 focus:outline-none transition-colors"
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
                      aria-label={rec.title}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300 hover:text-emerald-500" />
                      )}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
                            rec.priority === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : rec.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rec.priority}
                        </span>

                        {rec.isIndoorAlternative && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 flex items-center space-x-1">
                            <Home className="w-3 h-3 mr-0.5" />
                            <span>Indoor Protective Shift</span>
                          </span>
                        )}

                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          {rec.category.replace('_', ' ')}
                        </span>
                      </div>

                      <h4
                        className={`text-base font-bold transition-all ${
                          isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                        }`}
                      >
                        {rec.title}
                      </h4>
                    </div>
                  </div>

                  {/* Completion toast badge */}
                  {justLoggedId === rec.id && (
                    <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 rounded-lg animate-in fade-in flex items-center space-x-1 flex-shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      <span>Logged to Impact Tracker</span>
                    </span>
                  )}
                </div>

                {/* Suggested Action Callout */}
                <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-800 font-medium leading-relaxed">
                  <strong className="text-emerald-800 font-semibold block mb-0.5">Suggested Action:</strong>
                  {rec.suggestedAction}
                </div>

                {/* Detailed 4-Column Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
                  {/* Reason */}
                  <div className="p-3 rounded-2xl bg-slate-50/60 border border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      1. Scientific Reason
                    </span>
                    <p className="text-slate-600 leading-relaxed text-[11px]">{rec.reason}</p>
                  </div>

                  {/* Pollution Consideration */}
                  <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1 flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      2. Pollution Consideration
                    </span>
                    <p className="text-amber-900 leading-relaxed text-[11px]">{rec.pollutionConsideration}</p>
                  </div>

                  {/* Personal Benefit */}
                  <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1 flex items-center">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      3. Personal Health Benefit
                    </span>
                    <p className="text-emerald-900 leading-relaxed text-[11px]">{rec.personalBenefit}</p>
                  </div>

                  {/* Environmental Benefit & Measured Impact */}
                  <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1 flex items-center">
                      <Leaf className="w-3 h-3 mr-1" />
                      4. Environmental Benefit & Impact
                    </span>
                    <p className="text-blue-900 leading-relaxed text-[11px]">
                      {rec.environmentalBenefit || 'Contributes to community exposure reduction.'}
                    </p>
                    <div className="mt-1.5 pt-1.5 border-t border-blue-100 text-[10px] text-blue-800 font-semibold">
                      <span>Impact: {rec.estimatedImpact}</span>
                    </div>
                  </div>
                </div>

                {/* Transparent Assumptions Footnote */}
                <div className="mt-3 text-[10px] text-slate-400 italic">
                  <strong>Assumption:</strong> {rec.assumptions}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Planner Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
              <CalendarCheck2 className="w-4 h-4" />
              <span>Personalized Pollution-Aware Daily Planner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Adaptive Routine for {user.location.city}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {dailyPlan.summary}
            </p>
          </div>

          {/* Quick Context Settings Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={onOpenSettings}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all border border-slate-200"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span>Edit Family & Constraints</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Exposure Risk Banner */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>Today's Actions Completed ({completedActions} / {totalActions})</span>
              <span className="text-emerald-700 font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="md:col-span-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Overall Exposure Risk:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                dailyPlan.overallExposureRisk === 'Severe'
                  ? 'bg-rose-100 text-rose-800'
                  : dailyPlan.overallExposureRisk === 'High'
                  ? 'bg-orange-100 text-orange-800'
                  : dailyPlan.overallExposureRisk === 'Moderate'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {dailyPlan.overallExposureRisk}
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs font-semibold">
        <button
          onClick={() => setSelectedTimeFilter('all')}
          className={`px-4 py-2 rounded-xl transition-all ${
            selectedTimeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Times ({totalActions})
        </button>
        <button
          onClick={() => setSelectedTimeFilter('morning')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
            selectedTimeFilter === 'morning'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Morning ({dailyPlan.morning.length})</span>
        </button>
        <button
          onClick={() => setSelectedTimeFilter('afternoon')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
            selectedTimeFilter === 'afternoon'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sunset className="w-3.5 h-3.5" />
          <span>Afternoon ({dailyPlan.afternoon.length})</span>
        </button>
        <button
          onClick={() => setSelectedTimeFilter('evening')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 ${
            selectedTimeFilter === 'evening'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Evening ({dailyPlan.evening.length})</span>
        </button>
      </div>

      {/* Routine Sections */}
      <div className="space-y-8">
        {(selectedTimeFilter === 'all' || selectedTimeFilter === 'morning') &&
          renderSection('Morning Routine', <Sun className="w-4 h-4 text-amber-500" />, dailyPlan.morning)}

        {(selectedTimeFilter === 'all' || selectedTimeFilter === 'afternoon') &&
          renderSection('Afternoon Routine', <Sunset className="w-4 h-4 text-orange-500" />, dailyPlan.afternoon)}

        {(selectedTimeFilter === 'all' || selectedTimeFilter === 'evening') &&
          renderSection('Evening & Night Routine', <Moon className="w-4 h-4 text-indigo-500" />, dailyPlan.evening)}
      </div>
    </div>
  );
};
