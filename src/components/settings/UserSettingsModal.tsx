import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Users,
  Car,
  Home,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { AgeGroup, BudgetLevel, CommuteMode, FamilyMember, HomeType, OutdoorPreference, WorkSchedule } from '../../types';
import { useFocusTrap } from '../../utils/useFocusTrap';

export const UserSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useApp();
  const dialogRef = useFocusTrap<HTMLDivElement>({ isOpen, onClose });

  // Local editable copy
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(user.familyMembers);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule>(user.workSchedule);
  const [commuteDistance, setCommuteDistance] = useState<number>(user.dailyCommuteDistanceKm);
  const [primaryMode, setPrimaryMode] = useState<CommuteMode>(user.primaryCommuteMode);
  const [outdoorPref, setOutdoorPref] = useState<OutdoorPreference>(user.outdoorActivityPreference);
  const [budget, setBudget] = useState<BudgetLevel>(user.budget);
  const [homeType, setHomeType] = useState<HomeType>(user.homeType);
  const [hasPurifier, setHasPurifier] = useState<boolean>(user.hasAirPurifier);
  const [hasExhaust, setHasExhaust] = useState<boolean>(user.hasKitchenExhaust);

  if (!isOpen) return null;

  const handleAddMember = () => {
    const newMember: FamilyMember = {
      id: `mem-${Date.now()}`,
      name: `Family Member ${familyMembers.length + 1}`,
      ageGroup: 'adult',
      hasRespiratoryCondition: false,
      isPregnant: false,
    };
    setFamilyMembers([...familyMembers, newMember]);
  };

  const handleRemoveMember = (id: string) => {
    setFamilyMembers(familyMembers.filter(m => m.id !== id));
  };

  const handleUpdateMember = (id: string, updates: Partial<FamilyMember>) => {
    setFamilyMembers(familyMembers.map(m => (m.id === id ? { ...m, ...updates } : m)));
  };

  const handleSave = () => {
    updateUser({
      familySize: familyMembers.length,
      familyMembers,
      workSchedule,
      dailyCommuteDistanceKm: commuteDistance,
      primaryCommuteMode: primaryMode,
      outdoorActivityPreference: outdoorPref,
      budget,
      homeType,
      hasAirPurifier: hasPurifier,
      hasKitchenExhaust: hasExhaust,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 id="settings-dialog-title" className="text-lg font-black text-slate-900">Household & Lifestyle Profile Context</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              AirWise AI adapts recommendations dynamically when family or budget constraints change.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* Family Members Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-slate-900">Family Members & Vulnerabilities ({familyMembers.length})</h4>
              </div>
              <button
                type="button"
                onClick={handleAddMember}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>

            <div className="space-y-2">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) => handleUpdateMember(member.id, { name: e.target.value })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-medium w-28 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    />
                    <select
                      value={member.ageGroup}
                      onChange={(e) => handleUpdateMember(member.id, { ageGroup: e.target.value as AgeGroup })}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-medium text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="infant">Infant (&lt;1 yr)</option>
                      <option value="child">Child (1-12 yrs)</option>
                      <option value="adult">Adult</option>
                      <option value="elderly">Elderly (65+ yrs)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.hasRespiratoryCondition}
                        onChange={(e) => handleUpdateMember(member.id, { hasRespiratoryCondition: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px] text-slate-700">Asthma / Lung Condition</span>
                    </label>

                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.isPregnant}
                        onChange={(e) => handleUpdateMember(member.id, { isPregnant: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span className="text-[11px] text-slate-700">Pregnant</span>
                    </label>

                    {familyMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commute & Work Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Car className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-900">Work & Commuting Configuration</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Work Schedule</label>
                <select
                  value={workSchedule}
                  onChange={(e) => setWorkSchedule(e.target.value as WorkSchedule)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="fixed_office">Fixed Office (Daily travel)</option>
                  <option value="hybrid">Hybrid (2-3 days remote)</option>
                  <option value="remote">Fully Remote (Zero daily commute)</option>
                  <option value="outdoor">Outdoor Work Environment</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Daily Round-Trip Distance</label>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min={0}
                    max={150}
                    value={commuteDistance}
                    onChange={(e) => setCommuteDistance(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                  <span className="text-slate-400 font-medium">km</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Primary Commute Mode</label>
                <select
                  value={primaryMode}
                  onChange={(e) => setPrimaryMode(e.target.value as CommuteMode)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="car_petrol">Solo Petrol Car</option>
                  <option value="car_diesel">Solo Diesel Car</option>
                  <option value="car_ev">Electric Vehicle (EV)</option>
                  <option value="carpool">Shared Carpool</option>
                  <option value="bus">Public Transit Bus</option>
                  <option value="train_metro">Electric Metro / Rail</option>
                  <option value="bicycle">Bicycle</option>
                  <option value="walking">Walking</option>
                </select>
              </div>
            </div>
          </div>

          {/* Household & Budget Equipment */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Home className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-slate-900">Household & Budget Capabilities</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Household Budget Tier</label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value as BudgetLevel)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="low">Budget-Conscious (Free & DIY)</option>
                  <option value="moderate">Moderate (Balanced)</option>
                  <option value="high">Flexible (Commercial HEPA)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dwelling Type</label>
                <select
                  value={homeType}
                  onChange={(e) => setHomeType(e.target.value as HomeType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="apartment">Apartment / Flat</option>
                  <option value="detached_house">Detached House</option>
                  <option value="high_rise">High-Rise Condo</option>
                  <option value="shared">Shared Living Space</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Outdoor Activity</label>
                <select
                  value={outdoorPref}
                  onChange={(e) => setOutdoorPref(e.target.value as OutdoorPreference)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="morning_runs">Morning Runs</option>
                  <option value="evening_walks">Evening Walks</option>
                  <option value="weekend_sports">Weekend Sports</option>
                  <option value="minimal">Minimal Cardio</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPurifier}
                  onChange={(e) => setHasPurifier(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <strong className="block text-slate-800">Has Commercial HEPA Purifier</strong>
                  <span className="text-[10px] text-slate-400">Purifier available in at least 1 bedroom</span>
                </div>
              </label>

              <label className="flex items-center space-x-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasExhaust}
                  onChange={(e) => setHasExhaust(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div>
                  <strong className="block text-slate-800">Has Kitchen Range Exhaust Hood</strong>
                  <span className="text-[10px] text-slate-400">Vents cooking smoke outdoors</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Changes immediately recalculate your daily plan</span>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-700/20 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Update Profile & Recalculate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
