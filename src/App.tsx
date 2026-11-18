import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AirQualityDashboard } from './components/dashboard/AirQualityDashboard';
import { DailyRoutinePlanner } from './components/planner/DailyRoutinePlanner';
import { IndoorAdvisor } from './components/indoor/IndoorAdvisor';
import { SustainableAlternatives } from './components/sustainability/SustainableAlternatives';
import { ImpactTracker } from './components/impact/ImpactTracker';
import { ChatAssistant } from './components/assistant/ChatAssistant';
import { UserSettingsModal } from './components/settings/UserSettingsModal';
import { OnboardingModal } from './components/onboarding/OnboardingModal';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && <AirQualityDashboard />}
        {activeTab === 'planner' && <DailyRoutinePlanner onOpenSettings={() => setIsSettingsOpen(true)} />}
        {activeTab === 'indoor' && <IndoorAdvisor />}
        {activeTab === 'sustainability' && <SustainableAlternatives />}
        {activeTab === 'impact' && <ImpactTracker />}
        {activeTab === 'chat' && <ChatAssistant />}
      </main>

      <UserSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <OnboardingModal />
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
