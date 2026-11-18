import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Code-split heavy interactive tab components via dynamic imports
const AirQualityDashboard = lazy(() =>
  import('./components/dashboard/AirQualityDashboard').then(m => ({ default: m.AirQualityDashboard }))
);
const DailyRoutinePlanner = lazy(() =>
  import('./components/planner/DailyRoutinePlanner').then(m => ({ default: m.DailyRoutinePlanner }))
);
const IndoorAdvisor = lazy(() =>
  import('./components/indoor/IndoorAdvisor').then(m => ({ default: m.IndoorAdvisor }))
);
const SustainableAlternatives = lazy(() =>
  import('./components/sustainability/SustainableAlternatives').then(m => ({ default: m.SustainableAlternatives }))
);
const ImpactTracker = lazy(() =>
  import('./components/impact/ImpactTracker').then(m => ({ default: m.ImpactTracker }))
);
const ChatAssistant = lazy(() =>
  import('./components/assistant/ChatAssistant').then(m => ({ default: m.ChatAssistant }))
);
const UserSettingsModal = lazy(() =>
  import('./components/settings/UserSettingsModal').then(m => ({ default: m.UserSettingsModal }))
);
const OnboardingModal = lazy(() =>
  import('./components/onboarding/OnboardingModal').then(m => ({ default: m.OnboardingModal }))
);

/**
 * Accessible, zero-CLS skeleton fallback rendered during route chunk loading
 */
const ComponentLoadingFallback: React.FC = () => (
  <div
    role="status"
    aria-label="Loading module content"
    className="py-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in"
  >
    <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    <span className="text-xs font-semibold text-slate-500 tracking-wide">Loading clean-air view...</span>
  </div>
);

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* WCAG 2.2 AA Skip Navigation Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-700 focus:text-white focus:rounded-xl focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to main content
      </a>

      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 outline-none">
        <Suspense fallback={<ComponentLoadingFallback />}>
          {activeTab === 'dashboard' && <AirQualityDashboard />}
          {activeTab === 'planner' && <DailyRoutinePlanner onOpenSettings={() => setIsSettingsOpen(true)} />}
          {activeTab === 'indoor' && <IndoorAdvisor />}
          {activeTab === 'sustainability' && <SustainableAlternatives />}
          {activeTab === 'impact' && <ImpactTracker />}
          {activeTab === 'chat' && <ChatAssistant />}
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <OnboardingModal />
      </Suspense>

      <Footer />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
