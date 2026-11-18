import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Leaf,
  ShieldCheck,
  Plus,
  Trash2,
  Info,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { calculateCommuteEmissions, PRESET_HOUSEHOLD_IMPACTS } from '../../utils/emission-calculator';
import { CommuteMode } from '../../types';

export const ImpactTracker: React.FC = () => {
  const { impactLogs, logActivity, clearImpactLogs, user } = useApp();
  const [showLogModal, setShowLogModal] = useState(false);

  // Modal form state
  const [logType, setLogType] = useState<'transport' | 'household'>('transport');
  const [commuteDistance, setCommuteDistance] = useState<number>(user.dailyCommuteDistanceKm || 14);
  const [chosenMode, setChosenMode] = useState<CommuteMode>('bus');
  const baselineMode: CommuteMode = 'car_petrol';
  const [selectedHouseholdAction, setSelectedHouseholdAction] = useState<string>('hepa_air_purifier');

  // Compute aggregated stats
  const totalAvoidedCo2 = Number(impactLogs.reduce((acc, curr) => acc + (curr.avoidedCo2Kg || 0), 0).toFixed(2));
  const totalActionsCount = impactLogs.length;
  const transitTripsCount = impactLogs.filter(l => l.category === 'transport').length;
  const exposureActionsCount = impactLogs.filter(l => l.category === 'indoor_action' || l.category === 'routine_completion').length;

  // Group weekly data for Recharts (last 7 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    return d.toISOString().split('T')[0];
  });

  const weeklyChartData = days.map(dayStr => {
    const dayLogs = impactLogs.filter(l => l.date === dayStr);
    const co2 = dayLogs.reduce((sum, l) => sum + l.avoidedCo2Kg, 0);
    const actions = dayLogs.length;
    const dayLabel = new Date(dayStr).toLocaleDateString('en-US', { weekday: 'short' });
    return {
      date: dayLabel,
      fullDate: dayStr,
      co2SavedKg: Number(co2.toFixed(2)),
      actionsDone: actions,
    };
  });

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (logType === 'transport') {
      const calc = calculateCommuteEmissions(commuteDistance, chosenMode, baselineMode);
      logActivity({
        date: new Date().toISOString().split('T')[0],
        category: 'transport',
        title: `Commuted via ${chosenMode.replace('_', ' ')} (${commuteDistance} km)`,
        avoidedCo2Kg: calc.avoidedCo2Kg,
        exposureAvoidedScore: chosenMode === 'train_metro' ? 9 : chosenMode === 'bus' ? 7 : 6,
        formula: calc.formula,
        assumptions: calc.assumptions,
      });
    } else {
      const action = PRESET_HOUSEHOLD_IMPACTS[selectedHouseholdAction];
      if (action) {
        logActivity({
          date: new Date().toISOString().split('T')[0],
          category: 'energy_habit',
          title: action.title,
          avoidedCo2Kg: action.avoidedCo2Kg,
          exposureAvoidedScore: action.exposureAvoidedScore,
          formula: action.formula,
          assumptions: action.assumptions,
        });
      }
    }
    setShowLogModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1.5">
              <BarChart3 className="w-4 h-4" />
              <span>Environmental & Personal Impact Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Impact Calculator & Progress Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Track your household’s cumulative avoided emissions and particulate exposure reduction using documented DEFRA and US EPA emission factors.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowLogModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-700/20 flex items-center space-x-1.5 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Log Completed Action</span>
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Avoided CO2 */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avoided Emissions</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">{totalAvoidedCo2}</span>
              <span className="text-sm font-bold text-emerald-700">kg CO2e</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Calculated via DEFRA/EPA GHG conversion factors</p>
          </div>
        </div>

        {/* Total Actions */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Actions Completed</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">{totalActionsCount}</span>
              <span className="text-sm font-bold text-slate-500">habits logged</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Daily routines & sustainable choices</p>
          </div>
        </div>

        {/* Clean Transit Trips */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sustainable Commutes</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">{transitTripsCount}</span>
              <span className="text-sm font-bold text-blue-700">trips</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Metro, bus & carpool journeys</p>
          </div>
        </div>

        {/* Clean Air Defense score */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Exposure Safeguards</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">{exposureActionsCount}</span>
              <span className="text-sm font-bold text-indigo-700">interventions</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">HEPA, damp mopping & window seals</p>
          </div>
        </div>
      </div>

      {/* Weekly Trend Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>7-Day Avoided Carbon Trend</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily avoided carbon emissions (kg CO2e) from recorded sustainable choices
            </p>
          </div>
          <span className="text-[11px] text-slate-400">Transparent baseline formula</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#CBD5E1" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`${val} kg CO2e Avoided`, 'Carbon Saved']}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Bar dataKey="co2SavedKg" fill="#059669" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transparent Formula & Scientific Disclaimer */}
      <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
        <div className="flex items-center space-x-2 font-bold text-slate-900">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>Transparent Mathematical Formulation & Scientific Assumptions</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Commute Carbon Formula:</strong>{' '}
          <code className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px]">
            Avoided Emissions = Distance (km) × (Baseline Emission Factor - Alternative Mode Factor)
          </code>
          . Emission factors are sourced from UK DEFRA (2023) and US EPA Center for Corporate Climate Leadership (0.192 kg CO2/pkm for petrol cars, 0.089 kg for transit buses, 0.035 kg for electric rail).
        </p>
        <p className="text-[11px] text-slate-500 italic">
          <strong>Important Scientific Disclaimer:</strong> Avoided emissions represent modeled greenhouse gas reductions. Individual household actions cannot single-handedly lower ambient citywide AQI, which is dictated by complex regional meteorology, industrial emissions, and topography.
        </p>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <h3 className="text-base font-bold text-slate-900">Recorded Environmental Actions Log</h3>
          {impactLogs.length > 0 && (
            <button
              onClick={clearImpactLogs}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset History</span>
            </button>
          )}
        </div>

        {impactLogs.length === 0 ? (
          <p className="text-xs text-slate-400 py-8 text-center">No activities recorded yet. Complete a routine action or log a commute above.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {impactLogs.map((log) => (
              <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center space-x-2 mb-0.5">
                    <span className="font-bold text-slate-900">{log.title}</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 text-slate-600 uppercase">
                      {log.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">{log.formula}</p>
                </div>

                <div className="flex items-center space-x-4 sm:text-right flex-shrink-0">
                  <div>
                    <span className="font-bold text-emerald-700 block">
                      {log.avoidedCo2Kg > 0 ? `-${log.avoidedCo2Kg} kg CO2` : 'Exposure Safeguard'}
                    </span>
                    <span className="text-[10px] text-slate-400">{log.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Activity Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Record Sustainable Choice</h3>
            <p className="text-xs text-slate-500 mb-4">
              Log an action to update your emissions reduction tracker
            </p>

            <form onSubmit={handleCreateLog} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="flex rounded-xl bg-slate-100 p-1 font-semibold">
                <button
                  type="button"
                  onClick={() => setLogType('transport')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    logType === 'transport' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Sustainable Commute
                </button>
                <button
                  type="button"
                  onClick={() => setLogType('household')}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    logType === 'household' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Household & Energy Action
                </button>
              </div>

              {logType === 'transport' ? (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Trip Distance (km)</label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={commuteDistance}
                      onChange={(e) => setCommuteDistance(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Chosen Mode of Travel</label>
                    <select
                      value={chosenMode}
                      onChange={(e) => setChosenMode(e.target.value as CommuteMode)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="bus">Public Transit Bus (0.089 kg CO2/km)</option>
                      <option value="train_metro">Electric Metro / Train (0.035 kg CO2/km)</option>
                      <option value="carpool">Carpooling (0.096 kg CO2/km)</option>
                      <option value="bicycle">Bicycle (Safe AQI only, 0.000 kg CO2/km)</option>
                      <option value="walking">Walking (Safe AQI only, 0.000 kg CO2/km)</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Select Implemented Habit</label>
                  <select
                    value={selectedHouseholdAction}
                    onChange={(e) => setSelectedHouseholdAction(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {Object.entries(PRESET_HOUSEHOLD_IMPACTS).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.title} {item.avoidedCo2Kg > 0 ? `(-${item.avoidedCo2Kg} kg CO2)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-700/20"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
