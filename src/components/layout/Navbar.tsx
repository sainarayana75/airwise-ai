import React, { useState } from 'react';
import { useApp, ActiveTab } from '../../context/AppContext';
import {
  Wind,
  Compass,
  CalendarCheck2,
  Home,
  Leaf,
  BarChart3,
  Bot,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  AlertTriangle,
} from 'lucide-react';
import { PRESET_LOCATIONS, searchLocations } from '../../services/environmental-api';
import { LocationOption } from '../../types';

export const Navbar: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { user, updateLocation, envData, isLoadingEnv, refreshEnvironmentalData, activeTab, setActiveTab } = useApp();
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = async (loc: LocationOption) => {
    await updateLocation(loc);
    setShowLocationSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Air Dashboard', icon: <Wind className="w-4 h-4" /> },
    { id: 'planner', label: 'Daily Planner', icon: <CalendarCheck2 className="w-4 h-4" /> },
    { id: 'indoor', label: 'Indoor IAQ Advisor', icon: <Home className="w-4 h-4" /> },
    { id: 'sustainability', label: 'Sustainable Living', icon: <Leaf className="w-4 h-4" /> },
    { id: 'impact', label: 'Impact Tracker', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'chat', label: 'AI Assistant', icon: <Bot className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-700 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
              <Wind className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Air<span className="text-emerald-600">Wise</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded border border-emerald-200">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Intelligent Clean-Air Companion</p>
            </div>
          </div>

          {/* Location Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setShowLocationSearch(!showLocationSearch)}
              className="flex items-center space-x-2 px-3 py-1.5 text-xs sm:text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full border border-slate-200 transition-colors shadow-inner"
              title="Change active location"
              aria-label="Change location"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold max-w-[120px] sm:max-w-[160px] truncate">{user.location.city}</span>
              {envData && (
                <span
                  className="px-2 py-0.5 text-[11px] font-bold rounded-full text-white ml-1"
                  style={{ backgroundColor: envData.color }}
                >
                  AQI {envData.aqi}
                </span>
              )}
            </button>

            {/* Location Search Modal Dropdown */}
            {showLocationSearch && (
              <div className="absolute top-12 left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center">
                    <Compass className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Select or Search City
                  </h4>
                  <button
                    onClick={() => setShowLocationSearch(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSearch} className="relative mb-3">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search any global city (e.g. Lahore, Delhi, London)..."
                    className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                  {isSearching ? (
                    <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin absolute left-3 top-2.5" />
                  ) : (
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  )}
                </form>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mb-3 max-h-40 overflow-y-auto divide-y divide-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 py-1">
                      Search Results
                    </p>
                    {searchResults.map((res) => (
                      <button
                        key={res.id}
                        onClick={() => handleSelectLocation(res)}
                        className="w-full text-left px-2 py-2 hover:bg-emerald-50 text-xs flex items-center justify-between text-slate-800 rounded-lg transition-colors"
                      >
                        <span className="font-semibold">{res.city}, {res.country}</span>
                        <span className="text-[10px] text-slate-400">{res.admin1}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Smog-Impacted Benchmark Cities */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
                    Benchmark Smog Cities
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_LOCATIONS.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => handleSelectLocation(loc)}
                        className={`text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          user.location.city === loc.city
                            ? 'bg-emerald-600 text-white font-semibold'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {loc.city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions & Settings */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => refreshEnvironmentalData()}
              disabled={isLoadingEnv}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl border border-slate-200 transition-colors"
              title="Refresh live environmental data"
              aria-label="Refresh environmental data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingEnv ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-sm transition-all"
              title="Configure household profile & family constraints"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Profile Context</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1 overflow-x-auto no-scrollbar py-2 border-t border-slate-100 text-xs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Simulated Demonstration Warning Banner (if applicable) */}
      {envData?.isSimulated && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1 text-center text-xs font-semibold flex items-center justify-center space-x-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>
            Demonstration Mode: Using verified winter smog model data for {user.location.city} (Live Open-Meteo API unreachable).
          </span>
        </div>
      )}
    </header>
  );
};
